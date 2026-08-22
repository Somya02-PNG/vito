const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, any> | string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    statusCode: number;
    errors?: Record<string, string>;
  };
}

/**
 * Thin wrapper around fetch that:
 * - Prepends the API base URL
 * - Sends credentials: 'include' for httpOnly cookies
 * - Serialises JSON bodies
 * - Parses and returns typed responses
 */
export async function fetchAPI<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    ...rest,
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw {
      message: data.error?.message || 'Something went wrong',
      statusCode: res.status,
      errors: data.error?.errors,
    };
  }

  return data;
}
