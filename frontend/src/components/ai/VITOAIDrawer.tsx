'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Car,
  UserCheck,
  Key,
  Compass,
  TrendingUp,
  Radio,
  Building2,
  BarChart3,
  Shield,
  Loader2,
  Bot,
  MapPin,
  Route,
  Zap,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { RoleType } from '@/components/navigation/RoleNavConfig';
import { useAuth } from '@/context/AuthContext';
import { askVitoAgent, VitoChatMessage, VitoToolCall } from '@/lib/vito-agent';

interface VITOAIDrawerProps {
  role: RoleType;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ElementType;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  toolCalls?: VitoToolCall[];
  provider?: string;
}

const ROLE_QUICK_ACTIONS: Record<RoleType, QuickAction[]> = {
  customer: [
    { label: 'Cab fare estimate', prompt: 'Cab fare from Connaught Place Delhi to Noida Sector 18', icon: Compass },
    { label: 'Find verified driver', prompt: 'Help me find and hire a top-rated driver in Delhi', icon: UserCheck },
    { label: 'Rent self-drive car', prompt: 'Show available verified rental vehicles in Delhi NCR', icon: Key },
    { label: 'Safety & SOS shield', prompt: 'Explain the 24/7 VITO emergency safety and live sharing shield', icon: Shield },
  ],
  driver: [
    { label: "Today's schedule", prompt: "What does my schedule look like today?", icon: TrendingUp },
    { label: 'Earnings breakdown', prompt: 'Give me an earnings summary for this week with net payouts', icon: TrendingUp },
    { label: 'Pending trip requests', prompt: 'Are there any high-priority trip requests waiting?', icon: Radio },
    { label: 'Pre-trip checklist', prompt: 'Show me the pre-trip vehicle safety checklist', icon: Shield },
  ],
  partner: [
    { label: 'Fleet & bookability', prompt: 'Why is my vehicle eligible or not eligible for booking?', icon: Car },
    { label: "Today's bookings", prompt: 'What bookings and handovers do I have scheduled today?', icon: Key },
    { label: 'Earnings & net payouts', prompt: 'How is rental revenue performing this week after platform deductions?', icon: TrendingUp },
    { label: 'Document compliance', prompt: 'Which vehicles have expired or pending RC/Insurance documents?', icon: Building2 },
  ],
  admin: [
    { label: 'Platform health', prompt: 'Give me a platform-wide operations summary and live status', icon: BarChart3 },
    { label: 'Active rides', prompt: 'How many rides and rentals are currently live?', icon: Car },
    { label: 'Safety alerts', prompt: 'Are there any active SOS or safety incident tickets?', icon: Shield },
    { label: 'Revenue gross volume', prompt: "What's today's platform gross volume and payout liability?", icon: TrendingUp },
  ],
};

export default function VITOAIDrawer({ role }: VITOAIDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const quickActions = ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.customer;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userText = text.trim();
    const userMsg: Message = { role: 'user', content: userText };
    
    // Build conversation history in { role, content } format
    const history: VitoChatMessage[] = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askVitoAgent({
        message: userText,
        history,
        context: {
          userId: user?.id || 'guest',
          userName: user?.name || 'Guest',
          role: role,
          city: 'Delhi NCR',
          pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
        },
        maxSteps: 10,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: response.reply || 'Here is what I found for your request.',
          toolCalls: response.toolCalls,
          provider: response.provider,
        },
      ]);
    } catch (err: any) {
      console.error('VITO AI Agent Error:', err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `I'm here to assist you with all VITO services across Cabs, Rentals, Driver Hiring, and Safety. What would you like to explore next?`,
          provider: 'vito-fallback',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderToolIcon = (toolName: string) => {
    const t = toolName.toLowerCase();
    if (t.includes('location') || t.includes('geo')) return <MapPin className="w-3 h-3 text-cyan-400" />;
    if (t.includes('route') || t.includes('distance')) return <Route className="w-3 h-3 text-emerald-400" />;
    if (t.includes('fare') || t.includes('price')) return <Zap className="w-3 h-3 text-amber-400" />;
    if (t.includes('driver')) return <UserCheck className="w-3 h-3 text-blue-400" />;
    if (t.includes('rental') || t.includes('vehicle')) return <Car className="w-3 h-3 text-purple-400" />;
    return <Cpu className="w-3 h-3 text-slate-400" />;
  };

  return (
    <>
      {/* Floating VITO AI Trigger Button */}
      <button
        id="vito-ai-floating-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white font-bold text-xs shadow-[0_4px_24px_rgba(0,194,179,0.45)] hover:scale-105 active:scale-95 transition-all select-none group"
        style={{
          background: 'linear-gradient(135deg, #00C2B3 0%, #7567E8 100%)',
        }}
        aria-label="Ask VITO AI Assistant"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="tracking-wide">✦ Ask VITO AI</span>
      </button>

      {/* Slide-in Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md h-full bg-white/95 dark:bg-[#0B1728]/95 backdrop-blur-2xl border-l border-[#E5EAF0] dark:border-[#17334F] shadow-2xl flex flex-col z-10 animate-slideInRight">
            {/* Header */}
            <div
              className="p-5 flex items-center justify-between text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #00C2B3 0%, #7567E8 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">VITO AI Agent</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/25 text-white flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      Live Agent
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium">
                    Autonomous navigation, fares, rentals & safety
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Greeting Card */}
              <div className="p-4 rounded-2xl bg-[#F0FCFB] dark:bg-[#10243A]/60 border border-[#00C2B3]/25 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#00A99D]" />
                    <span className="text-xs font-bold text-[#0B1728] dark:text-white">
                      Hi {user?.name ? user.name.split(' ')[0] : 'there'} 👋
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {role.toUpperCase()} MODE
                  </span>
                </div>
                <p className="text-xs text-[#526174] dark:text-slate-300 leading-relaxed">
                  I am powered by the VITO Autonomous Travel Navigator Agent with tool-calling capabilities for routing, fare calculations, fleet verification, and 24/7 safety protocols.
                </p>
              </div>

              {/* Quick Action Suggestion Chips */}
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8995A5] px-1">
                    Quick Suggestions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, i) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => sendMessage(action.prompt)}
                          className="p-3 rounded-xl bg-white dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] hover:border-[#00C2B3]/50 text-left transition-all group shadow-sm flex flex-col justify-between gap-2"
                        >
                          <Icon className="w-4 h-4 text-[#00A99D] group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-[#0B1728] dark:text-white leading-tight">
                            {action.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message Thread */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[90%] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#00C2B3] to-[#7567E8] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        msg.role === 'user'
                          ? 'bg-[#07111F] text-white rounded-br-none shadow-sm'
                          : 'bg-[#F1F5F8] dark:bg-[#10243A] text-[#0B1728] dark:text-white rounded-bl-none border border-[#E5EAF0] dark:border-[#17334F]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Tool Calls Visual Trace */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Autonomous Tools Executed:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.toolCalls.map((tc, tcIdx) => (
                              <span
                                key={tcIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                              >
                                {renderToolIcon(tc.tool)}
                                {tc.tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {msg.role === 'ai' && msg.provider && (
                    <span className="text-[9px] font-mono text-slate-400 px-9">
                      Engine: {msg.provider}
                    </span>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 items-center text-xs text-[#8995A5] pl-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00A99D]" />
                  <span>VITO AI Agent is planning and executing tools...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-[#E5EAF0] dark:border-[#17334F] bg-white dark:bg-[#0B1728] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for cab fare, route, rental, driver, safety..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[#F7F9FC] dark:bg-[#10243A] border border-[#E5EAF0] dark:border-[#17334F] text-xs text-[#0B1728] dark:text-white placeholder:text-[#8995A5] outline-none focus:border-[#00C2B3] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center shadow-md disabled:opacity-40 transition-all active:scale-95 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #00C2B3 0%, #7567E8 100%)',
                  }}
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
