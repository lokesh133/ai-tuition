'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  MapPin,
  ChevronRight,
} from 'lucide-react';

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Founder Command Center
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              System 100% Operational
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            Namaste Lokesh! AI Tuition Super Admin
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Tier-2 aur Tier-3 towns ke school students (Classes 1st–8th), ₹200/mo subscriptions, live doubts stream, aur 5 AI Teacher Avatars ka central command center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscriptions"
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4" />
            <span>Check All Subscriptions</span>
          </Link>
          <Link
            href="/admin/students"
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            <span>Student Doubts Feed</span>
          </Link>
        </div>
      </div>

      {/* Top Telemetry & Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase text-slate-500">Active Paid Kids</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">1,248</span>
            <span className="text-xs font-bold text-emerald-600">+14% this week</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Class 1st to 8th primary students</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase text-slate-500">Monthly Revenue (MRR)</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">₹2,49,600</span>
            <span className="text-xs font-bold text-slate-400">/mo</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-2">₹200 / student plan</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase text-slate-500">AI Cost Per Student</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">₹32.40</span>
            <span className="text-xs font-bold text-emerald-600">Well below ₹50 cap</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Net Profit: ₹167.60 (83.8% Margin)</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase text-slate-500">Live Doubts Processed</span>
            <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">14,220</span>
            <span className="text-xs font-bold text-emerald-600">68% Redis Cached</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Across 5 AI Teachers</p>
        </div>
      </div>

      {/* 4 Core Super Admin Workflows */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <span>Super Admin Operations & Modules</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Box 1: Subscriptions */}
          <Link
            href="/admin/subscriptions"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group block"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">
                Subscriptions & Revenue Desk ➔
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ₹2.49L MRR
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sabhi 1,248 bacho ke ₹200/month subscriptions, UPI AutoPay status, parent phone numbers, town-wise filters aur renewal dates check karein.
            </p>
          </Link>

          {/* Box 2: Student Doubts */}
          <Link
            href="/admin/students"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group block"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                Student Doubts & Learning Signals ➔
              </h3>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bache real-time me mic par kya sawaal pooch rahe hain, AI responses, weak topics, aur Redis caching rate (₹0 cost questions) dekhein.
            </p>
          </Link>

          {/* Box 3: Courses */}
          <Link
            href="/admin/courses"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group block"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                School Course & RAG Management ➔
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                48 Chapters
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              NCERT aur CBSE syllabus ke chapters upload karein, PDF text extract karein aur Vector DB me sync karein taaki galat answer na aaye.
            </p>
          </Link>

          {/* Box 4: Teachers */}
          <Link
            href="/admin/teachers"
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group block"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-purple-600 transition-colors">
                5 AI Teachers & Slow Blackboard Pacing ➔
              </h3>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                School Style
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Neha Mam, Sharma Sir, Riya Didi, Kabir Sir, Pooja Mam ke prompts, Hinglish tone, aur 1-step at a time Socratic guardrails configure karein.
            </p>
          </Link>
        </div>
      </div>

      {/* Town-Wise Growth Signals */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Tier-2 & Tier-3 Town Distribution
              </h3>
              <p className="text-[11px] text-slate-400">
                Where parents are actively subscribing to the ₹200/mo plan
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-600">Top 5 Cities</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-800 block">Alwar (Raj.)</span>
            <span className="text-base font-black text-indigo-600">312 Kids</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">₹62.4k MRR</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-800 block">Varanasi (UP)</span>
            <span className="text-base font-black text-indigo-600">284 Kids</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">₹56.8k MRR</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-800 block">Jabalpur (MP)</span>
            <span className="text-base font-black text-indigo-600">240 Kids</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">₹48.0k MRR</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-800 block">Sikar (Raj.)</span>
            <span className="text-base font-black text-indigo-600">216 Kids</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">₹43.2k MRR</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-bold text-slate-800 block">Patna (Bihar)</span>
            <span className="text-base font-black text-indigo-600">196 Kids</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">₹39.2k MRR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
