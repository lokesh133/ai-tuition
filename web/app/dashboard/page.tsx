'use client';

import React, { useState } from 'react';
import {
  Clock,
  HelpCircle,
  TrendingUp,
  Volume2,
  FileCheck,
  Shield,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Sliders,
  CreditCard,
  RotateCcw,
} from 'lucide-react';

const WEEKLY_DOUBTS = [
  { day: 'Mon', count: 6 },
  { day: 'Tue', count: 9 },
  { day: 'Wed', count: 4 },
  { day: 'Thu', count: 8 },
  { day: 'Fri', count: 7 },
  { day: 'Sat', count: 5 },
  { day: 'Sun', count: 3 },
];

const SUBJECT_PERFORMANCE = [
  { subject: 'Mathematics (Sharma Sir)', accuracy: 92, doubts: 18, color: 'bg-amber-500', status: 'Strongest 💪' },
  { subject: 'Science (Neha Mam)', accuracy: 88, doubts: 12, color: 'bg-sky-500', status: 'Very Good 🔬' },
  { subject: 'English (Riya Didi)', accuracy: 76, doubts: 7, color: 'bg-pink-500', status: 'Improving 📖' },
  { subject: 'Social Studies (Kabir Sir)', accuracy: 64, doubts: 5, color: 'bg-purple-500', status: 'Needs Focus ⚠️' },
];

const HOMEWORK_SCANS = [
  {
    id: 'hw-1',
    timestamp: 'Today, 04:30 PM',
    subject: 'Math',
    question: 'Fractions cross-multiplication & simplification',
    feedback: 'Identified missing negative sign in Step 2. Auto-corrected with formula.',
    teacher: 'Sharma Sir',
    status: 'Corrected',
  },
  {
    id: 'hw-2',
    timestamp: 'Yesterday, 06:15 PM',
    subject: 'Science',
    question: 'Photosynthesis chemical equation & leaf structure',
    feedback: 'All 3 stages explained correctly. Neha Mam awarded 20 Star Points.',
    teacher: 'Neha Mam',
    status: '100% Correct',
  },
  {
    id: 'hw-3',
    timestamp: '12 Oct, 05:00 PM',
    subject: 'English',
    question: 'Past tense vs Present Continuous tense worksheet',
    feedback: '3/5 sentences corrected with Hindi phonetic examples.',
    teacher: 'Riya Didi',
    status: 'Reviewed',
  },
];

export default function ParentDashboardOverview() {
  const [screenTimeLimit, setScreenTimeLimit] = useState(45);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [strictSyllabusGuard, setStrictSyllabusGuard] = useState(true);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header Banner & WhatsApp Alert Preview */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
            Aarav's Weekly Summary
          </span>
          <h1 className="text-2xl md:text-3xl font-black mt-3">
            Bahut Badhiya! Aarav ne is hafte 42 doubts solve kiye 🎉
          </h1>
          <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-xl">
            Overall accuracy 86% rahi. Mathematics me Sharma Sir ke saath sabse zyada practice ki gayi hai.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all">
            <Share2 className="w-4 h-4" />
            <span>Send to WhatsApp</span>
          </button>
          <button className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all">
            <Download className="w-4 h-4" />
            <span>Download PDF Card</span>
          </button>
        </div>
      </div>

      {/* 2. Top Analytics Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase">Doubts Asked</span>
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">42</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +18% vs last week
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Avg. 6 doubts/day asked to AI</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase">Study Time</span>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">4h 25m</span>
            <span className="text-xs font-semibold text-slate-500">this week</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Well within daily 45m safe limit</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase">Homework Scans</span>
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">14 Pages</span>
            <span className="text-xs font-bold text-emerald-600">100% Checked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">All mistakes revised with voice</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase">Active Plan</span>
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">₹200</span>
            <span className="text-xs font-bold text-emerald-600">/month Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Renews automatically Nov 10, 2026</p>
        </div>
      </div>

      {/* 3. Daily Doubts Chart & Subject Accuracy Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Doubts Bar Chart */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 mb-1">Daily Doubts Activity</h3>
          <p className="text-xs text-slate-500 mb-6">Kitne sawaal har din pooche gaye</p>

          <div className="flex items-end justify-between gap-3 h-44 pt-4 border-b border-slate-100 pb-2">
            {WEEKLY_DOUBTS.map((item, idx) => {
              const heightPct = (item.count / 10) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">{item.count}</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] bg-indigo-500 hover:bg-indigo-600 rounded-t-lg transition-all"
                  />
                  <span className="text-xs font-semibold text-slate-400">{item.day}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Peak activity on <span className="font-bold text-slate-800">Tuesday (Math Homework)</span>
          </p>
        </div>

        {/* Subject Accuracy Matrix */}
        <div id="subjects" className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 mb-1">Subject-wise Mastery</h3>
          <p className="text-xs text-slate-500 mb-6">Class 5th NCERT Performance Matrix</p>

          <div className="space-y-4">
            {SUBJECT_PERFORMANCE.map((sub, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{sub.subject}</span>
                    <span className="text-xs text-slate-500">({sub.doubts} doubts)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-700">{sub.status}</span>
                    <span className="font-black text-sm text-slate-900">{sub.accuracy}%</span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${sub.accuracy}%` }}
                    className={`h-full ${sub.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Homework Scans Table */}
      <div id="homework" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Recent Homework Scans Log</h3>
            <p className="text-xs text-slate-500">Line-by-line feedback provided by AI teachers</p>
          </div>
          <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 self-start">
            14 Total Pages Scanned This Month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Time & Subject</th>
                <th className="py-3 px-4">Question & Notebook Note</th>
                <th className="py-3 px-4">AI Teacher Feedback</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Voice Audio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HOMEWORK_SCANS.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-medium">
                    <span className="font-bold text-slate-900 block">{scan.subject}</span>
                    <span className="text-slate-400 text-[11px]">{scan.timestamp}</span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-800 max-w-xs">
                    {scan.question}
                  </td>
                  <td className="py-4 px-4 text-slate-600 max-w-sm leading-relaxed">
                    <span className="font-bold text-slate-800 block text-[11px] mb-0.5">{scan.teacher}:</span>
                    {scan.feedback}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {scan.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Parent Safety Guardrails & Screen-Time Controls */}
      <div id="guardrails" className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Study Time Limit & Schedule</h3>
              <p className="text-xs text-slate-500">Control daily device screen-time for Aarav</p>
            </div>
          </div>

          <div className="space-y-6 pt-3">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                <span>Max Daily Study Time:</span>
                <span className="text-indigo-600 text-sm font-black">{screenTimeLimit} Minutes</span>
              </div>
              <input
                type="range"
                min="15"
                max="90"
                step="15"
                value={screenTimeLimit}
                onChange={(e) => setScreenTimeLimit(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>15 min</span>
                <span>30 min</span>
                <span>45 min</span>
                <span>60 min</span>
                <span>90 min</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              💡 <b>Recommended by Child Psychologists:</b> Class 5 students ke liye 45 minute daily interactive tuition ideal balance provide karta hai.
            </div>
          </div>
        </div>

        {/* Guardrails Toggles */}
        <div className="md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">AI Safety & Guardrail Toggles</h3>
              <p className="text-xs text-slate-500">Zero distractions & strict child safety filters</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Block Non-Syllabus Topics</span>
                <span className="text-[11px] text-slate-500">Only answer NCERT Class 1–8 curriculum questions</span>
              </div>
              <input
                type="checkbox"
                checked={strictSyllabusGuard}
                onChange={(e) => setStrictSyllabusGuard(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Daily WhatsApp Summary Alert</span>
                <span className="text-[11px] text-slate-500">Sends homework & doubt digest at 8:00 PM</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Audio-Only Voice Mode</span>
                <span className="text-[11px] text-slate-500">Reduces screen-stare by disabling animated boards</span>
              </div>
              <input
                type="checkbox"
                checked={audioOnlyMode}
                onChange={(e) => setAudioOnlyMode(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Billing & Subscription Management */}
      <div id="billing" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Plan Active
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">All-in-One Pass (₹200 / Month)</h3>
            <p className="text-xs text-slate-500">Unlimited Voice Doubts • All 5 Teachers • Homework Scanner</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Next Auto-Renewal Date</span>
            <span className="text-sm font-extrabold text-slate-900">10 November, 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-400 block mb-1">Payment Method:</span>
            <span className="font-extrabold text-slate-800">UPI (Google Pay)</span>
            <p className="text-slate-500 text-[11px] mt-0.5">rajesh.sharma@okaxis</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-400 block mb-1">Monthly Billing:</span>
            <span className="font-extrabold text-slate-800">₹200.00 / month</span>
            <p className="text-slate-500 text-[11px] mt-0.5">Includes all taxes (No hidden fees)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-400 block mb-1">Invoices:</span>
            <button className="font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Download Oct 2026 Receipt</span>
            </button>
            <p className="text-slate-400 text-[11px] mt-0.5">GST Compliant invoice</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
          <p className="text-slate-500">
            Need to take a break during school vacations? You can cancel or pause anytime.
          </p>
          <button className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold transition-all">
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
