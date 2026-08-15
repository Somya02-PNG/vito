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
} from 'lucide-react';
import { RoleType } from '@/components/navigation/RoleNavConfig';
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
    { label: 'Plan a trip', prompt: 'Help me plan a seamless trip itinerary', icon: Compass },
    { label: 'Find a driver', prompt: 'Help me find and hire a top-rated driver', icon: UserCheck },
    { label: 'Rent a vehicle', prompt: 'Show available rental vehicles with verified insurance', icon: Key },
    { label: 'Recent trips', prompt: 'Show me a breakdown of my recent rides', icon: Car },
  ],
  driver: [
    { label: "Today's schedule", prompt: "What does my schedule look like today?", icon: TrendingUp },
    { label: 'Earnings summary', prompt: 'Give me an earnings summary for this week', icon: TrendingUp },
    { label: 'Pending requests', prompt: 'Are there any high-priority trip requests?', icon: Radio },
    { label: 'Safety checklist', prompt: 'Show me the pre-trip safety checklist', icon: Shield },
  ],
  partner: [
    { label: 'Fleet status', prompt: 'Give me a summary of my active fleet', icon: Car },
    { label: "Today's bookings", prompt: "What bookings do I have scheduled today?", icon: Key },
    { label: 'Revenue trends', prompt: 'How is rental revenue performing this week?', icon: TrendingUp },
    { label: 'Maintenance alerts', prompt: 'Are there any vehicles due for service?', icon: Building2 },
  ],
  admin: [
    { label: 'Platform health', prompt: 'Give me a platform-wide operations summary', icon: BarChart3 },
    { label: 'Active rides', prompt: "How many rides are currently live?", icon: Car },
    { label: 'Safety alerts', prompt: 'Are there any active SOS or safety incident tickets?', icon: Shield },
    { label: 'Revenue today', prompt: "What's today's platform gross volume?", icon: TrendingUp },
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, role, context: { userName: user?.name } }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'ai', content: data.data?.response || data.message || "I'm on it!" }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Contextual fallback response
      let fallback = `I'm happy to help you with that, ${user?.name || 'there'}! `;
      const lower = text.toLowerCase();
      if (lower.includes('plan') || lower.includes('trip')) {
        fallback += 'You can use our Cab Booking page or AI Trip Planner to enter your pickup and destinations with real-time ETA and fares.';
      } else if (lower.includes('driver')) {
        fallback += 'You can view verified drivers with safety credentials in the Hire a Driver section.';
      } else if (lower.includes('rent')) {
        fallback += 'Browse our verified fleet of sedans, SUVs, and luxury cars under Rentals.';
      } else if (lower.includes('earning')) {
        fallback += 'Your weekly earnings summary and payout records are updated live in the Earnings tab.';
      } else if (lower.includes('safe') || lower.includes('sos')) {
        fallback += 'Your safety is protected 24/7. Emergency SOS and live trip sharing are always available in the Safety Center.';
      } else {
        fallback += `I can help you navigate ${role} services, optimize routes, check bookings, and answer questions. What would you like to do next?`;
      }
      setMessages((prev) => [...prev, { role: 'ai', content: fallback }]);
    } finally {
      setIsLoading(false);
    }
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
                    <h3 className="text-base font-black tracking-tight">VITO AI</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/25 text-white">
                      Intelligent Companion
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium">
                    Your intelligent travel & mobility companion
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
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#00A99D]" />
                  <span className="text-xs font-bold text-[#0B1728] dark:text-white">
                    Hi {user?.name ? user.name.split(' ')[0] : 'there'} 👋
                  </span>
                </div>
                <p className="text-xs text-[#526174] dark:text-slate-300 leading-relaxed">
                  I'm your VITO mobility intelligence assistant. Ask me anything about rides, driver matching, route timing, safety alerts, or platform stats.
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
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#00C2B3] to-[#7567E8] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#07111F] text-white rounded-br-none shadow-sm'
                        : 'bg-[#F1F5F8] dark:bg-[#10243A] text-[#0B1728] dark:text-white rounded-bl-none border border-[#E5EAF0] dark:border-[#17334F]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 items-center text-xs text-[#8995A5]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00A99D]" />
                  <span>VITO AI is thinking...</span>
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
                  placeholder="Ask VITO AI anything..."
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
