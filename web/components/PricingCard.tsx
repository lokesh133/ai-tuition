import React from 'react';
import { Check, Sparkles, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const PricingCard: React.FC = () => {
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden relative">
      {/* Top Banner Tag */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Beta Testing Phase • 100% Free For Early Testers</span>
      </div>

      <div className="p-8">
        {/* Title and Price */}
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Beta Testing Pass</h3>
            <p className="text-sm text-slate-500 mt-1">Free access during testing (Classes 1st to 8th)</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-bold text-emerald-600">₹</span>
              <span className="text-5xl font-black text-emerald-600 tracking-tight">0</span>
              <span className="text-sm font-semibold text-slate-500">/free</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Future Launch: ₹200/mo
            </span>
          </div>
        </div>

        {/* Value comparison */}
        <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-emerald-700 font-extrabold block">Active Beta Testing Pass</span>
            <p className="text-slate-600 mt-0.5">Bina kisi payment ke sabhi 5 AI teachers se padhein</p>
          </div>
          <span className="bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-lg">
            100% FREE
          </span>
        </div>

        {/* Feature list */}
        <ul className="space-y-3.5 mb-8 text-sm text-slate-700">
          {[
            'Unlimited Voice Doubts with all 5 AI Teachers',
            'Live Step-by-Step Smart Chalkboard & Whiteboard',
            'Homework Scanner with mistake & sign pinpointing',
            'Full RBSE & CBSE Curriculum: Math, EVS, English, Hindi',
            'Weekly WhatsApp Progress Report directly to parents',
            'Strict Kid-Safe AI Guardrails (0% unsafe internet content)',
            'Multi-device access (Phone, Tablet, Desktop Web)',
          ].map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="font-medium">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Link
          href="/tutor"
          className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group"
        >
          <span>Start Learning Free in Beta</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="text-center text-xs text-slate-400 mt-2.5">
          Zero payment required • Active testing mode
        </p>

        {/* Payment Methods and Trust */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Commercial launch par UPI AutoPay (₹200/mo) aayega</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-500 text-[11px]">
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">GPay</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">PhonePe</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Paytm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
