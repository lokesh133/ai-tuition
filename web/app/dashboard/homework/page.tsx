'use client';

import React from 'react';
import { Camera, CheckCircle2, AlertTriangle, Volume2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SCANNED_ITEMS = [
  {
    id: 1,
    subject: 'Mathematics',
    teacher: 'Sharma Sir',
    date: '14 Oct, 2026 • 04:30 PM',
    question: 'Q3. 12 × 4 = 48 & Q4. (3/7) × (-14) = 6',
    feedback: 'Step 1 is correct. In Step 2, minus sign was missing. Correct answer is -6.',
    status: 'Checked',
  },
  {
    id: 2,
    subject: 'Science',
    teacher: 'Neha Mam',
    date: '13 Oct, 2026 • 06:15 PM',
    question: 'Photosynthesis chemical formula & leaf diagram',
    feedback: 'Diagram neatly labeled. Chlorophyll role explained well.',
    status: 'Checked',
  },
  {
    id: 3,
    subject: 'English',
    teacher: 'Riya Didi',
    date: '12 Oct, 2026 • 05:00 PM',
    question: 'Worksheet on irregular past tense verbs',
    feedback: 'Corrected 2 spelling errors (e.g., caught, bought).',
    status: 'Checked',
  },
];

export default function HomeworkPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Homework Scanner Log 📸</h1>
          <p className="text-xs text-slate-500 mt-1">Aarav dwara scan ki gayi sabhi notebook pages ki history</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SCANNED_ITEMS.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {item.subject}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">{item.date}</span>
              </div>

              {/* Notebook page preview mockup */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 my-3 font-mono text-xs text-slate-800">
                <p className="font-bold">{item.question}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed mb-4">
                <span className="font-bold text-slate-900 block mb-0.5">{item.teacher}'s Feedback:</span>
                {item.feedback}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {item.status}
              </span>
              <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Explanation</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
