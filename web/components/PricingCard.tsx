import React from 'react';
import { Check, Sparkles, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const PricingCard: React.FC = () => {
  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-3xl border-2 border-indigo-500 shadow-xl overflow-hidden relative">
      {/* Top Banner Tag */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Most Popular • 3-Day Free Trial Included</span>
      </div>

      <div className="p-8">
        {/* Title and Price */}
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">All-in-One Tuition Pass</h3>
            <p className="text-sm text-slate-500 mt-1">Complete NCERT Prep for Classes 1st to 8th</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-bold text-indigo-600">₹</span>
              <span className="text-5xl font-black text-indigo-600 tracking-tight">200</span>
              <span className="text-sm font-semibold text-slate-500">/mo</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Only ₹6.6 / day
            </span>
          </div>
        </div>

        {/* Value comparison */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 line-through">Offline Tuition: ₹2,500/mo</span>
            <p className="font-bold text-slate-800 mt-0.5">Save over 92% every month</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-lg">
            SAVE ₹27,600/yr
          </span>
        </div>

        {/* Feature list */}
        <ul className="space-y-3.5 mb-8 text-sm text-slate-700">
          {[
            'Unlimited Voice Doubts with all 5 AI Teachers',
            'Live Step-by-Step Smart Whiteboard visual explanation',
            'Homework Scanner with step error pinpointing',
            'Full NCERT Curriculum: Math, Science, English, SST, Hindi',
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
          href="/dashboard"
          className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-center text-base shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 group"
        >
          <span>Start 3-Day Free Trial</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <p className="text-center text-xs text-slate-400 mt-2.5">
          No credit card required • Cancel anytime with 1-click
        </p>

        {/* Payment Methods and Trust */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>100% Safe UPI Gateway</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-600">
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">GPay</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">PhonePe</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Paytm</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">UPI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
