/**
 * VITO AI Agent Client & Server Helper
 * Connects to the published VITO AI Agent service (https://travel-navigator-bot.lovable.app)
 * or local backend proxy API routes.
 */

export interface VitoChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface VitoToolCall {
  tool: string;
  input: Record<string, any>;
  output: Record<string, any>;
}

export interface VitoAgentRequest {
  message: string;
  history?: VitoChatMessage[];
  context?: Record<string, any>;
  maxSteps?: number;
}

export interface VitoAgentResponse {
  reply: string;
  provider?: string;
  toolCalls?: VitoToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

const AGENT_URL =
  process.env.NEXT_PUBLIC_VITO_AGENT_API_URL ||
  process.env.VITO_AGENT_API_URL ||
  'https://travel-navigator-bot.lovable.app';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getAgentHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const apiKey = process.env.VITO_API_KEY;
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    headers['x-api-key'] = apiKey.trim();
  }
  return headers;
}

/**
 * Call the VITO AI Agent single-turn JSON endpoint
 * Tries direct agent API first for instant response, falls back to backend proxy
 */
export async function askVitoAgent({
  message,
  history = [],
  context = {},
  maxSteps = 10,
}: VitoAgentRequest): Promise<VitoAgentResponse> {
  // 1. First try direct call to Lovable published VITO Agent API (CORS is enabled)
  try {
    const res = await fetch(`${AGENT_URL}/api/public/vito/agent`, {
      method: 'POST',
      headers: getAgentHeaders(),
      body: JSON.stringify({ message, history, context, maxSteps }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.reply || data.toolCalls)) {
        return data as VitoAgentResponse;
      }
    }
  } catch (directErr) {
    console.warn('Direct VITO Agent fetch failed, attempting backend proxy...', directErr);
  }

  // 2. Fallback to backend Express proxy
  try {
    const proxyRes = await fetch(`${API_BASE}/api/ai/agent`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history, context, maxSteps }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.data) {
        return data.data;
      }
      if (data.reply) {
        return data as VitoAgentResponse;
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy fetch failed:', proxyErr);
  }

  throw new Error('Unable to connect to VITO AI Agent service.');
}

/**
 * Stream responses from the VITO AI Agent
 * Uses ?format=text for plain text streaming
 */
export async function streamVitoAgent({
  message,
  history = [],
  context = {},
  maxSteps = 10,
  onChunk,
}: VitoAgentRequest & { onChunk: (text: string) => void }): Promise<string> {
  let fullText = '';

  try {
    const response = await fetch(`${AGENT_URL}/api/public/vito/chat?format=text`, {
      method: 'POST',
      headers: getAgentHeaders(),
      body: JSON.stringify({ message, history, context, maxSteps }),
    });

    if (!response.ok || !response.body) {
      const result = await askVitoAgent({ message, history, context, maxSteps });
      onChunk(result.reply);
      return result.reply;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onChunk(chunk);
    }
  } catch (error) {
    console.error('Stream error, falling back to askVitoAgent:', error);
    const result = await askVitoAgent({ message, history, context, maxSteps });
    onChunk(result.reply);
    return result.reply;
  }

  return fullText;
}

export default askVitoAgent;
