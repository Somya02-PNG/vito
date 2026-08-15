'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { MessageSquare, Send, User } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { SkeletonList } from '@/components/ui/SkeletonCard';

interface Message {
  _id: string;
  senderName?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type?: 'inquiry' | 'support' | 'system';
}

export default function PartnerMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ messages: Message[] }>('/api/partner/messages');
      setMessages(res.data?.messages || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Messages</h1>
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-teal-500 text-xs font-black text-white">{unread}</span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-400 pl-4">Customer inquiries and platform messages</p>
      </div>

      <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-2">
        {loading ? <SkeletonList count={4} /> : error ? (
          <ErrorState message={error} onRetry={fetchMessages} />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Customer inquiries about your vehicles and bookings will appear here."
            accentColor="#14B8A6"
          />
        ) : messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
              !msg.isRead
                ? 'bg-teal-500/5 border-teal-500/20'
                : 'bg-white/[0.02] border-white/[0.05]'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!msg.isRead ? 'bg-teal-500/15 border border-teal-500/30' : 'bg-white/5'}`}>
              <User className={`w-4 h-4 ${!msg.isRead ? 'text-teal-400' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-bold ${!msg.isRead ? 'text-white' : 'text-slate-300'}`}>{msg.senderName || 'Customer'}</p>
                <p className="text-[10px] text-slate-500 shrink-0">{new Date(msg.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{msg.content}</p>
            </div>
            {!msg.isRead && <div className="w-2 h-2 rounded-full bg-teal-400 mt-1 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
