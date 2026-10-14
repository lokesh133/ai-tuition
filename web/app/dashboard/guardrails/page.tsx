'use client';

import React, { useState } from 'react';
import { Shield, Sliders, Bell, EyeOff, CheckCircle } from 'lucide-react';

export default function GuardrailsPage() {
  const [dailyLimit, setDailyLimit] = useState(45);
  const [blockOutsideCurriculum, setBlockOutsideCurriculum] = useState(true);
  const [whatsappDailyDigest, setWhatsappDailyDigest] = useState(true);
  const [safeSearchMode, setSafeSearchMode] = useState(true);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings & Parental Guardrails 🛡️</h1>
        <p className="text-xs text-slate-500 mt-1">Bachhe ke screen-time aur AI learning content ko control karein</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Screen-time controller */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Max Daily Study Limit</h3>
              <p className="text-xs text-slate-500">Device screen-time limit set karein</p>
            </div>
            <span className="text-lg font-black text-indigo-600 bg-white px-3 py-1 rounded-xl border border-slate-200">
              {dailyLimit} Minutes / Day
            </span>
          </div>

          <input
            type="range"
            min="15"
            max="120"
            step="15"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
            <span>15 min</span>
            <span>30 min</span>
            <span>45 min (Recommended)</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Guardrail toggles */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">AI Safety Filters</h3>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-xs text-slate-900 block">Strict NCERT Syllabus Guard</span>
              <span className="text-[11px] text-slate-500">AI sirf Class 1–8 NCERT chapters se related sawaalon ka jawab dega</span>
            </div>
            <input
              type="checkbox"
              checked={blockOutsideCurriculum}
              onChange={(e) => setBlockOutsideCurriculum(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-xs text-slate-900 block">WhatsApp Daily Evening Digest</span>
              <span className="text-[11px] text-slate-500">Roz raat 8:00 baje bache ki study summary parent phone par bheji jayegi</span>
            </div>
            <input
              type="checkbox"
              checked={whatsappDailyDigest}
              onChange={(e) => setWhatsappDailyDigest(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-xs text-slate-900 block">Zero Distraction & Safe Search Filter</span>
              <span className="text-[11px] text-slate-500">Social media, gaming, aur anchaahi internet links automatically block rahenge</span>
            </div>
            <input
              type="checkbox"
              checked={safeSearchMode}
              onChange={(e) => setSafeSearchMode(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md">
            Save Guardrail Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
