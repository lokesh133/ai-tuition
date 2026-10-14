'use client';

import React from 'react';
import { Award, Download, Share2, Star, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Weekly Performance Report Card 📊</h1>
          <p className="text-xs text-slate-500 mt-1">Class 5th B • Term 1 Learning Milestone</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 flex items-center gap-2 shadow-sm">
            <Share2 className="w-4 h-4" />
            <span>Share to WhatsApp</span>
          </button>
          <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Card Paper Design */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Student: Aarav Sharma</h2>
            <p className="text-xs text-slate-500">Kendriya Vidyalaya • Roll No: 14 • Session: 2026-27</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold">Weekly Grade</span>
              <span className="text-3xl font-black text-indigo-600">A+</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
              🏆
            </div>
          </div>
        </div>

        {/* Subjects Score Breakdown */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider text-xs">Subject Competency</h3>
          {[
            { subject: 'Mathematics', score: '92/100', teacher: 'Sharma Sir', remarks: 'Exceptional in fractions and word problems' },
            { subject: 'Science', score: '88/100', teacher: 'Neha Mam', remarks: 'Good understanding of living organisms' },
            { subject: 'English', score: '76/100', teacher: 'Riya Didi', remarks: 'Needs more practice in past tense verbs' },
            { subject: 'Social Studies', score: '82/100', teacher: 'Kabir Sir', remarks: 'Curious about solar system & planetary orbits' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="mb-2 sm:mb-0">
                <span className="font-extrabold text-slate-900 text-sm">{item.subject}</span>
                <span className="text-slate-400 ml-2">({item.teacher})</span>
                <p className="text-slate-600 mt-1">{item.remarks}</p>
              </div>
              <span className="font-black text-slate-900 text-sm bg-white px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                {item.score}
              </span>
            </div>
          ))}
        </div>

        {/* Teacher Signature note */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>Verified by NCERT Aligned AI Tuition Curriculum Engine</p>
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>Parent Verified via OTP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
