'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, ChevronRight, Zap, Car, UserCheck, Key, Compass, TrendingUp, Radio, Building2, BarChart3, Shield, Loader2 } from 'lucide-react';
import { RoleType, ROLE_THEMES } from '@/components/navigation/RoleNavConfig';
import { useAuth } from '@/context/AuthContext';

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
}

const ROLE_QUICK_ACTIONS: Record<RoleType, QuickAction[]> = {
  customer: [
    { label: 'Plan a trip', prompt: 'Help me plan a trip itinerary', icon: Compass },
    { label: 'Find a driver', prompt: 'Help me find and hire a professional driver', icon: UserCheck },
    { label: 'Rent a vehicle', prompt: 'What vehicles are available for rent?', icon: Key },
    { label: 'My recent trips', prompt: 'Show me a summary of my recent trips', icon: Car },
  ],
  driver: [
    { label: "Today's schedule", prompt: "What does my schedule look like today?", icon: TrendingUp },
    { label: 'Earnings summary', prompt: 'Give me an earnings summary for this week', icon: Zap },
    { label: 'Pending requests', prompt: 'Are there any pending trip requests?', icon: Radio },
    { label: 'Safety tips', prompt: 'Give me safety tips for night driving', icon: Shield },
  ],
  partner: [
    { label: 'Fleet summary', prompt: 'Give me a summary of my fleet status', icon: Car },
    { label: "Today's bookings", prompt: "What bookings do I have today?", icon: Key },
    { label: 'Revenue overview', prompt: 'How is my revenue performing this month?', icon: TrendingUp },
    { label: 'Maintenance alerts', prompt: 'Are there any vehicles due for maintenance?', icon: Building2 },
  ],
  admin: [
    { label: 'Platform summary', prompt: 'Give me a platform-wide summary', icon: BarChart3 },
    { label: 'Operations status', prompt: "What's the current operations status?", icon: Zap },
    { label: 'Safety alerts', prompt: 'Are there any active safety alerts?', icon: Shield },
    { label: 'Revenue today', prompt: "What's today's revenue?", icon: TrendingUp },
  ],
};

const ROLE_GREETINGS: Record<RoleType, string> = {
  customer: "Hi! I'm VITO AI. I can help you book rides, plan trips, find drivers, and manage your account.",
  driver: "Hi! I'm VITO AI. I can help you manage requests, track earnings, optimize routes, and answer driver FAQs.",
  partner: "Hi! I'm VITO AI. I can help you manage your fleet, track bookings, review revenue, and optimize operations.",
  admin: "Hi! I'm VITO AI, your platform intelligence assistant. I can provide real-time platform insights and operational reports.",
};

export default function VITOAIDrawer({ role }: VITOAIDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const theme = ROLE_THEMES[role];
  const quickActions = ROLE_QUICK_ACTIONS[role];

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
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Use existing AI trip planner endpoint if available
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, role, context: { userName: user?.name } }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'ai', content: data.data?.response || data.message || 'I\'m processing your request.' }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Graceful fallback — intelligent contextual response
      const fallback = getFallbackResponse(text, role);
      setMessages((prev) => [...prev, { role: 'ai', content: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (text: string, role: RoleType): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('trip') || lowerText.includes('travel'))
      return 'I can help you plan your trip! Use the Book a Ride or AI Trip Planner features to get started with smart routing and real-time availability.';
    if (lowerText.includes('earn') || lowerText.includes('revenue') || lowerText.includes('money'))
      return 'Your earnings data is updated in real-time. Check the Earnings section for a detailed breakdown of daily, weekly, and monthly performance.';
    if (lowerText.includes('fleet') || lowerText.includes('vehicle'))
      return 'Fleet management tools are available in the Fleet section. You can view availability, schedule maintenance, and track utilization rates.';
    if (lowerText.includes('safe') || lowerText.includes('sos') || lowerText.includes('emergency'))
      return 'Safety is our top priority. For emergencies, use the SOS button immediately. For safety reports or incidents, visit the Safety section.';
    return `I'm VITO AI, ready to assist with your ${role} tasks. I can help with bookings, navigation, analytics, and platform management. What specific information do you need?`;
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open VITO AI Assistant"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
          style={{
            background: `linear-gradient(135deg, ${theme.accentHex}, ${theme.accentHex}cc)`,
            boxShadow: `0 8px 32px ${theme.accentHex}50`,
          }}
        >
          <Sparkles className="w-6 h-6 text-white" />
          <span className="absolute -top-8 right-0 bg-[#0B0F1C] border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            VITO AI
          </span>
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fadeIn md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 flex flex-col md:bottom-6 md:right-6 md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-slideInRight"
          style={{
            width: '100%',
            maxWidth: '420px',
            height: '85dvh',
            maxHeight: '640px',
            background: 'linear-gradient(160deg, #0D1220 0%, #090D18 100%)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0"
            style={{ background: `${theme.accentHex}12` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${theme.accentHex}25`, border: `1px solid ${theme.accentHex}40` }}
              >
                <Sparkles className="w-4 h-4" style={{ color: theme.accentHex }} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight">VITO AI</h2>
                <p className="text-[10px] font-medium" style={{ color: `${theme.accentHex}` }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)} Assistant · Always on
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close VITO AI"
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
            {messages.length === 0 ? (
              /* Welcome State */
              <div className="space-y-5 animate-fadeInUp">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-sm text-slate-300 leading-relaxed">{ROLE_GREETINGS[role]}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-1">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, i) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => sendMessage(action.prompt)}
                          className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-left transition-all group"
                        >
                          <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white transition-colors" style={{ color: theme.accentHex }} />
                          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white leading-tight">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}
                >
                  {msg.role === 'ai' && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 shrink-0 mt-0.5"
                      style={{ background: `${theme.accentHex}25` }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: theme.accentHex }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'bg-white/[0.05] border border-white/[0.06] text-slate-200 rounded-tl-sm'
                    }`}
                    style={msg.role === 'user' ? { background: theme.accentHex } : undefined}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${theme.accentHex}25` }}
                >
                  <Sparkles className="w-3 h-3" style={{ color: theme.accentHex }} />
                </div>
                <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.06] flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-4 border-t border-white/[0.06] shrink-0 bg-[#090D18]">
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] focus-within:border-white/20 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask VITO anything..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none px-2 py-1.5"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
                style={{ background: theme.accentHex }}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-2">VITO AI · Role-aware · Platform-integrated</p>
          </div>
        </div>
      )}
    </>
  );
}
