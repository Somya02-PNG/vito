'use me';
'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Navigation,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Car,
  Compass,
  TrendingUp,
  Terminal
} from 'lucide-react';

interface BackendHealth {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    state: string;
    connected: boolean;
  };
  system: {
    platform: string;
    nodeVersion: string;
  };
}

export default function Home() {
  const [healthData, setHealthData] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/health`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: BackendHealth = await res.json();
      setHealthData(data);
      setLastCheckTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Health check failed:', err);
      setError(err.message || 'Failed to reach backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="min-h-screen bg-[#07090E] relative overflow-hidden flex flex-col justify-between">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-vito-glow pointer-events-none opacity-80" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#07090E]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                VITO <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wider">AI Platform</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthData ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${healthData ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span>API Gateway: <strong className="text-white">{healthData ? 'Connected (Port 5000)' : 'Connecting...'}</strong></span>
            </div>

            <button
              onClick={checkHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 shadow-lg shadow-blue-600/25 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Health
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-medium backdrop-blur-md">
            <Compass className="w-4 h-4 text-cyan-400" /> Autonomous Urban Transit & AI Fleet Engine
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Hello <span className="text-gradient">VITO</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-normal">
            Next-generation AI-powered mobility ecosystem integrating real-time telemetry, dynamic route optimization, and autonomous fleet coordination.
          </p>
        </div>

        {/* Live System Health Card (Frontend-Backend Connection) */}
        <div className="max-w-4xl mx-auto w-full mb-16">
          <div className={`glass-panel-glow rounded-2xl p-6 md:p-8 transition-all duration-300 ${error ? 'border-red-500/40 bg-red-950/10' : ''}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${healthData ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Backend Connection Monitor
                    {healthData ? (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ONLINE
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-pulse" /> TESTING
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Endpoint: <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">{API_URL}/api/health</code>
                  </p>
                </div>
              </div>

              {lastCheckTime && (
                <div className="text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  Last Checked: <span className="text-slate-200 font-mono">{lastCheckTime}</span>
                </div>
              )}
            </div>

            {/* Status Grid */}
            {loading && !healthData ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-sm text-slate-400">Pinging VITO Express API endpoint...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Backend Unreachable</h4>
                  <p className="text-xs text-red-300/80 mt-1">{error}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Ensure the Express backend is running via <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">npm run dev</code> inside <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">/backend</code> directory.
                  </p>
                </div>
              </div>
            ) : healthData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Service Name
                  </div>
                  <div className="text-sm font-semibold text-white truncate">{healthData.service}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" /> Mongoose MongoDB
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5 capitalize">
                    <span className={`w-2 h-2 rounded-full ${healthData.database.connected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                    {healthData.database.state}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Server Uptime
                  </div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {healthData.uptimeSeconds}s active
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Node Environment
                  </div>
                  <div className="text-sm font-semibold text-white font-mono">
                    {healthData.system.nodeVersion} ({healthData.system.platform})
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobility Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Route Optimization</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Predictive neural pathfinding to dynamically bypass urban traffic congestion and reduce transit emissions.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Autonomous Fleet Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time vehicle telemetry stream and battery state monitoring across distributed EV fleets.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-orange-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Demand Forecasting</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              ML-driven passenger demand heatmaps enabling proactive vehicle positioning and zero idle latency.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090E] py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 VITO Mobility Systems. Full-stack Next.js 14 + Express + MongoDB Architecture.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> Frontend: Port 3000</span>
            <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5 text-cyan-400" /> Backend: Port 5000</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
