'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  Sparkles,
  Calculator,
  Plus,
  Trash2,
  Users,
  DollarSign,
  PieChart,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Receipt,
  Utensils,
  Fuel,
  Car,
  Hotel,
  Ticket,
  ShoppingBag,
  Package,
  Calendar,
  MapPin,
  Loader2,
  TrendingUp,
  UserPlus,
  Check,
  ChevronDown,
  Info,
  Key,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Participant {
  name: string;
}

interface Trip {
  _id: string;
  aiPlanData: {
    title: string;
    destination: string;
    dates?: string;
  };
  participants: Participant[];
  createdAt: string;
}

interface SplitDetails {
  participantName: string;
  amount: number;
  percentage?: number;
}

interface Expense {
  _id: string;
  title: string;
  category: 'food' | 'transport' | 'accommodation' | 'fuel' | 'tickets' | 'shopping' | 'other';
  amount: number;
  paidByName: string;
  splitType: 'equal' | 'percentage' | 'custom' | 'no_split';
  splits: SplitDetails[];
  createdAt: string;
}

interface SettlementData {
  totalTripSpent: number;
  netBalances: { name: string; netBalance: number }[];
  settlements: { from: string; to: string; amount: number }[];
}

const CATEGORY_ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  food: { icon: <Utensils className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  fuel: { icon: <Fuel className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  transport: { icon: <Car className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  accommodation: { icon: <Hotel className="w-4 h-4" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  tickets: { icon: <Ticket className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  shopping: { icon: <ShoppingBag className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  other: { icon: <Package className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<'SPLITTER' | 'AI_PLANNER'>('SPLITTER');

  // Trips State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [loadingTrips, setLoadingTrips] = useState(true);

  // New Trip Modal
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');
  const [newTripParticipants, setNewTripParticipants] = useState('Rahul, Priya, Alex, Sara');

  // Expense Data State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // New Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [paidByName, setPaidByName] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [addingExpense, setAddingExpense] = useState(false);

  // AI Planner State
  const [aiDestination, setAiDestination] = useState('Manali & Spiti Valley');
  const [aiDays, setAiDays] = useState(4);
  const [aiBudget, setAiBudget] = useState('Moderate (₹15k - ₹25k)');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiItinerary, setAiItinerary] = useState<any | null>(null);

  // Fetch Trips
  const loadTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await fetchAPI<{ trips: Trip[] }>('/api/planner/trips');
      if (res.data?.trips && res.data.trips.length > 0) {
        setTrips(res.data.trips);
        setSelectedTripId(res.data.trips[0]._id);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // Selected Trip Object
  const currentTrip = useMemo(() => {
    return trips.find((t) => t._id === selectedTripId) || trips[0];
  }, [trips, selectedTripId]);

  // Set default paidByName when trip changes
  useEffect(() => {
    if (currentTrip && currentTrip.participants.length > 0) {
      setPaidByName(currentTrip.participants[0].name);
    }
  }, [currentTrip]);

  // Fetch Trip Expenses & Settlement Summary
  const loadTripExpenses = async (tripId: string) => {
    if (!tripId) return;
    setLoadingExpenses(true);
    try {
      const res = await fetchAPI<{
        expenses: Expense[];
        totalTripSpent: number;
        netBalances: { name: string; netBalance: number }[];
        settlements: { from: string; to: string; amount: number }[];
      }>(`/api/planner/trips/${tripId}/expenses`);

      if (res.data) {
        setExpenses(res.data.expenses || []);
        setSettlement({
          totalTripSpent: res.data.totalTripSpent || 0,
          netBalances: res.data.netBalances || [],
          settlements: res.data.settlements || [],
        });
      }
    } catch {
      // Fallback empty
      setExpenses([]);
      setSettlement(null);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (selectedTripId) {
      loadTripExpenses(selectedTripId);
    }
  }, [selectedTripId]);

  // Handle Log Expense
  const handleLogExpense = async () => {
    if (!expenseTitle || !amount || !selectedTripId) return;
    setAddingExpense(true);

    try {
      await fetchAPI(`/api/planner/trips/${selectedTripId}/expenses`, {
        method: 'POST',
        body: {
          title: expenseTitle,
          category,
          amount: parseFloat(amount),
          paidByName: paidByName || (currentTrip?.participants[0]?.name || 'You'),
          splitType,
        },
      });

      // Clear Form
      setExpenseTitle('');
      setAmount('');
      await loadTripExpenses(selectedTripId);
    } catch (err: any) {
      alert(err?.message || 'Failed to log expense');
    } finally {
      setAddingExpense(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string) => {
    try {
      await fetchAPI(`/api/planner/expenses/${id}`, { method: 'DELETE' });
      await loadTripExpenses(selectedTripId);
    } catch {
      // Refresh anyway
      await loadTripExpenses(selectedTripId);
    }
  };

  // Handle Create Trip
  const handleCreateTrip = async () => {
    if (!newTripTitle || !newTripDestination) return;
    try {
      const participantNames = newTripParticipants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetchAPI<{ trip: Trip }>('/api/planner/trips', {
        method: 'POST',
        body: {
          title: newTripTitle,
          destination: newTripDestination,
          participantNames,
        },
      });

      if (res.data?.trip) {
        const newTrip = res.data.trip;
        setTrips((prev) => [newTrip, ...prev]);
        setSelectedTripId(newTrip._id);
      }
      setShowNewTripModal(false);
      setNewTripTitle('');
      setNewTripDestination('');
    } catch {
      setShowNewTripModal(false);
    }
  };

  // Generate AI Itinerary
  const handleGenerateAiItinerary = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      setAiItinerary({
        destination: aiDestination,
        days: aiDays,
        budget: aiBudget,
        plan: [
          { day: 1, title: 'Arrival & Scenic Route Drive', items: ['Check-in at mountain resort', 'Solang Valley sunset drive', 'Traditional Himachali dinner'] },
          { day: 2, title: 'High-Altitude Pass Exploration', items: ['Early morning drive to Atal Tunnel', 'Snow points & photography', 'Hot tea at local dhaba'] },
          { day: 3, title: 'Old Manali Culture & Cafes', items: ['Visit Hadimba Temple', 'Cafe hopping in Old Manali', 'Local handicraft shopping'] },
          { day: 4, title: 'River Rafting & Return Journey', items: ['Beas river rafting adventure', 'Souvenir shopping', 'Departure'] },
        ],
      });
      setGeneratingAi(false);
    }, 1500);
  };

  return (
    <div className="relative overflow-hidden min-h-screen pb-12">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[400px] bg-hero-glow pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER & TAB TOGGLE
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[11px] font-semibold text-violet-400 uppercase tracking-wider w-fit mb-1.5">
              <Sparkles className="w-3 h-3" />
              Smart Travel Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Trip Planner & <span className="text-gradient">Expense Splitter</span>
            </h1>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('SPLITTER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'SPLITTER'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Expense Splitter
            </button>
            <button
              onClick={() => setActiveTab('AI_PLANNER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'AI_PLANNER'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Itinerary
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: EXPENSE SPLITTER
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'SPLITTER' && (
          <div className="space-y-6">

            {/* TRIP SELECTOR & PARTICIPANT BAR */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Trip
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="bg-transparent text-base font-bold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                  >
                    {trips.map((t) => (
                      <option key={t._id} value={t._id} className="bg-slate-900 text-white">
                        {t.aiPlanData.title} ({t.aiPlanData.destination})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trip Participants List */}
              {currentTrip && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Group ({currentTrip.participants.length}):
                  </span>
                  {currentTrip.participants.map((p) => (
                    <span
                      key={p.name}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-slate-200"
                    >
                      {p.name}
                    </span>
                  ))}
                  <button
                    onClick={() => setShowNewTripModal(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-bold text-violet-300 hover:bg-violet-500/25 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Trip
                  </button>
                </div>
              )}
            </div>

            {/* MAIN EXPENSE SPLITTER GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">

              {/* ─────────────────────────────────────────────────────────────
                  LEFT: LOG EXPENSE FORM & EXPENSES FEED
              ───────────────────────────────────────────────────────────── */}
              <div className="space-y-6">

                {/* LOG EXPENSE FORM */}
                <div className="glass-panel rounded-2xl p-5 space-y-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4.5 h-4.5 text-violet-400" />
                    Log New Trip Expense
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Expense Description
                      </label>
                      <input
                        type="text"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        placeholder="e.g. Seafood Dinner at Shack"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 2400"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Category */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500/40 capitalize [color-scheme:dark]"
                      >
                        {['food', 'transport', 'accommodation', 'fuel', 'tickets', 'shopping', 'other'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Paid By */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Paid By
                      </label>
                      <select
                        value={paidByName}
                        onChange={(e) => setPaidByName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
                      >
                        {currentTrip?.participants.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Split Type */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Split Rule
                      </label>
                      <select
                        value={splitType}
                        onChange={(e) => setSplitType(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
                      >
                        <option value="equal">Equal Among All</option>
                        <option value="custom">Custom Split</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleLogExpense}
                    disabled={addingExpense}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {addingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add Expense</>}
                  </button>
                </div>

                {/* LOGGED EXPENSES FEED */}
                <div className="glass-panel rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-violet-400" />
                      Logged Expenses ({expenses.length})
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">
                      Total: ₹{settlement?.totalTripSpent.toLocaleString('en-IN') || 0}
                    </span>
                  </div>

                  {loadingExpenses ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Loading trip expenses...</p>
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="text-center py-8 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No expenses logged for this trip yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenses.map((exp) => {
                        const catMeta = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS.other;
                        return (
                          <div
                            key={exp._id}
                            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between hover:border-white/[0.12] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${catMeta.bg} ${catMeta.color}`}>
                                {catMeta.icon}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">{exp.title}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Paid by <span className="text-violet-300 font-semibold">{exp.paidByName}</span> · {exp.splitType} split
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-extrabold text-white">
                                ₹{exp.amount.toLocaleString('en-IN')}
                              </span>
                              <button
                                onClick={() => handleDeleteExpense(exp._id)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* ─────────────────────────────────────────────────────────────
                  RIGHT: SETTLEMENT SUMMARY ("WHO OWES WHOM HOW MUCH")
              ───────────────────────────────────────────────────────────── */}
              <div className="space-y-6">

                {/* SETTLEMENT SUMMARY CARD */}
                <div className="glass-panel-glow rounded-2xl p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Calculator className="w-4.5 h-4.5 text-emerald-400" />
                      Settlement Summary
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Debt Minimized
                    </span>
                  </div>

                  {/* Net Balances */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                      Individual Net Balances
                    </label>
                    <div className="space-y-2">
                      {settlement?.netBalances.map((nb) => (
                        <div
                          key={nb.name}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                        >
                          <span className="font-bold text-white">{nb.name}</span>
                          <span
                            className={`font-extrabold ${
                              nb.netBalance > 0
                                ? 'text-emerald-400'
                                : nb.netBalance < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {nb.netBalance > 0
                              ? `+₹${nb.netBalance.toLocaleString('en-IN')} (gets back)`
                              : nb.netBalance < 0
                              ? `-₹${Math.abs(nb.netBalance).toLocaleString('en-IN')} (owes)`
                              : 'Settled ₹0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Who Owes Whom How Much */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                      Optimal Settlements (Who Owes Whom)
                    </label>

                    {!settlement || settlement.settlements.length === 0 ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-emerald-300">All trip balances are settled!</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {settlement.settlements.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-rose-300">{s.from}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-bold text-emerald-300">{s.to}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-amber-300">
                                ₹{s.amount.toLocaleString('en-IN')}
                              </span>
                              <button className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/30 transition-all">
                                Settle
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: AI TRIP PLANNER
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'AI_PLANNER' && (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">

            {/* AI GENERATOR FORM */}
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-violet-400" />
                AI Smart Itinerary Generator
              </h2>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Destination
                </label>
                <input
                  type="text"
                  value={aiDestination}
                  onChange={(e) => setAiDestination(e.target.value)}
                  placeholder="e.g. Leh Ladakh, Goa, Udaipur"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={aiDays}
                    onChange={(e) => setAiDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Budget Tier
                  </label>
                  <select
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-violet-500/40 [color-scheme:dark]"
                  >
                    <option value="Backpacker (₹5k - ₹10k)">Backpacker</option>
                    <option value="Moderate (₹15k - ₹25k)">Moderate</option>
                    <option value="Luxury (₹40k+)">Luxury</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateAiItinerary}
                disabled={generatingAi}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/25 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AI Route...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Smart Itinerary
                  </>
                )}
              </button>
            </div>

            {/* AI ITINERARY RESULT DISPLAY */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-violet-400" />
                AI Generated Itinerary
              </h2>

              {!aiItinerary ? (
                <div className="text-center py-16">
                  <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400">Click "Generate Smart Itinerary" to create an AI-optimized travel plan</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{aiItinerary.destination}</h3>
                      <p className="text-xs text-slate-400">{aiItinerary.days} Days · {aiItinerary.budget}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Ready to Link
                    </span>
                  </div>

                  <div className="space-y-3">
                    {aiItinerary.plan.map((day: any) => (
                      <div key={day.day} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                        <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                          Day {day.day}: {day.title}
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                          {day.items.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <a
                    href="/dashboard/rental"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    <Key className="w-4 h-4" />
                    Book Rental Vehicle for this Trip
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          NEW TRIP CREATION MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showNewTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel-glow rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-extrabold text-white">Create New Group Trip</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Trip Name
                </label>
                <input
                  type="text"
                  value={newTripTitle}
                  onChange={(e) => setNewTripTitle(e.target.value)}
                  placeholder="e.g. Manali Snow Expedition"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Destination
                </label>
                <input
                  type="text"
                  value={newTripDestination}
                  onChange={(e) => setNewTripDestination(e.target.value)}
                  placeholder="e.g. Manali, India"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Participants (Comma separated)
                </label>
                <input
                  type="text"
                  value={newTripParticipants}
                  onChange={(e) => setNewTripParticipants(e.target.value)}
                  placeholder="Rahul, Priya, Alex, Sara"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet-500/40"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewTripModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrip}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/25"
              >
                Create Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
