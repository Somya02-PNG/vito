'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Car,
  Clock,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

interface Booking {
  _id: string;
  startDate: string;
  endDate: string;
  vehicle?: { name: string };
  vehicleName?: string;
  status: string;
  customerName?: string;
  customer?: { name: string };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PartnerCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAPI<{ bookings: Booking[] }>('/api/rentals/partner/bookings');
      setBookings(res.data?.bookings || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getBookingsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter((b) => {
      if (!b.startDate || !b.endDate) return false;
      const start = b.startDate.slice(0, 10);
      const end = b.endDate.slice(0, 10);
      return dateStr >= start && dateStr <= end;
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  const calendarDays: (number | null)[] = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  // Pad to full weeks
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-teal-500 to-teal-500/50" />
          <h1 className="text-2xl font-black text-white tracking-tight">Fleet Calendar</h1>
        </div>
        <p className="text-sm text-slate-400 pl-4">Vehicle availability and booking schedule</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-5">
          {/* Month Nav */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 rounded-lg bg-teal-600/20 text-teal-300 text-xs font-bold hover:bg-teal-600/30 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayBookings = day ? getBookingsForDay(day) : [];
                const hasBookings = dayBookings.length > 0;
                const todayDay = isToday(day ?? -1);
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={i}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    disabled={!day}
                    className={`relative h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                      !day ? 'opacity-0 cursor-default' :
                      isSelected ? 'bg-teal-600 text-white' :
                      todayDay ? 'bg-teal-600/20 border border-teal-500/40 text-teal-300 font-bold' :
                      hasBookings ? 'bg-white/[0.06] hover:bg-white/[0.10] text-white cursor-pointer' :
                      'hover:bg-white/[0.04] text-slate-400 cursor-pointer'
                    }`}
                  >
                    <span className="text-xs font-semibold">{day}</span>
                    {hasBookings && !isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayBookings.slice(0, 3).map((_, bi) => (
                          <div key={bi} className="w-1 h-1 rounded-full bg-teal-400" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="p-5 rounded-2xl bg-[#0B101E] border border-teal-500/20 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-teal-400" />
            {selectedDay
              ? `${MONTHS[month].slice(0, 3)} ${selectedDay} Bookings`
              : 'Select a Date'}
          </h3>

          {!selectedDay ? (
            <p className="text-xs text-slate-500">Click on a date in the calendar to see bookings for that day.</p>
          ) : error ? (
            <ErrorState message={error} compact onRetry={fetchBookings} />
          ) : selectedBookings.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No bookings"
              description="No vehicles booked on this date."
              accentColor="#14B8A6"
              size="sm"
            />
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <div key={b._id} className="p-3.5 rounded-xl bg-white/[0.03] border border-teal-500/15 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-teal-400 shrink-0" />
                    <p className="text-xs font-bold text-white truncate">{b.vehicle?.name || b.vehicleName || 'Vehicle'}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">{b.customer?.name || b.customerName || 'Customer'}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {b.startDate?.slice(0, 10)} → {b.endDate?.slice(0, 10)}
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    b.status === 'active' || b.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                  }`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Monthly summary */}
          <div className="pt-3 border-t border-white/[0.06]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">This Month</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Total Bookings</p>
              <p className="text-xs font-bold text-white">{bookings.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
