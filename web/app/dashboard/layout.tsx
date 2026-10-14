'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookCheck,
  FileText,
  CreditCard,
  ShieldCheck,
  Bell,
  LogOut,
  ChevronDown,
  Sparkles,
  Flame,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Child Overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Homework Log', icon: BookCheck, href: '/dashboard/homework' },
  { name: 'Weekly Report Card', icon: FileText, href: '/dashboard/report' },
  { name: 'Subscription & Billing', icon: CreditCard, href: '/dashboard/billing' },
  { name: 'Settings & Guardrails', icon: ShieldCheck, href: '/dashboard/guardrails' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedChild, setSelectedChild] = useState('Aarav Sharma (Class 5th B)');
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 p-5 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-orange-500/20">
              AI
            </div>
            <div>
              <span className="font-extrabold text-white text-base block leading-tight">Parent Portal</span>
              <span className="text-[10px] text-slate-400 font-medium">AI Tuition App</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Student AI Studio launcher for laptop/desktop */}
          <Link
            href="/tutor"
            className="mt-6 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 hover:opacity-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Open Student Studio</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Web</span>
          </Link>
        </div>

        {/* Bottom Subscription mini banner */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>Active Pro Pass</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">₹200/mo</span>
            </div>
            <p className="text-[11px] text-slate-400">Next renewal: Nov 10, 2026</p>
          </div>

          <Link
            href="/"
            className="mt-4 flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 font-semibold px-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout to Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
          {/* Child Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Viewing:</span>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{selectedChild}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-xl border border-orange-200 text-xs font-extrabold">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>7 Days Streak</span>
            </div>

            <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
              RS
            </div>
          </div>
        </header>

        {/* Dashboard Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
