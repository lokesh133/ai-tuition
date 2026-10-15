'use client';

import React from 'react';
import { CreditCard, Download, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Subscription & Billing 💳</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your ₹200/month plan, payment mode & invoices</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Active plan card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
              BETA TESTING PASS • 100% FREE
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">All-in-One Pass (Classes 1–8)</h2>
            <p className="text-xs text-slate-600 mt-1">Unlimited doubts with all 5 AI Teachers • Homework Scanner Active</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-3xl font-black text-emerald-600">₹0</span>
            <span className="text-xs text-slate-500"> / Free Beta</span>
            <p className="text-[11px] text-amber-700 font-bold mt-1">Commercial Launch Plan: ₹200/mo</p>
          </div>
        </div>

        {/* Payment mode & UPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">Saved Payment Method</span>
            <p className="font-extrabold text-sm text-slate-900">UPI - Google Pay (rajesh.sharma@okaxis)</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Auto-Pay Mandate Active (NPCI Compliant)</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-1">Billing Contact</span>
            <p className="font-extrabold text-sm text-slate-900">+91 98765-43210 (WhatsApp Alerts)</p>
            <p className="text-[11px] text-slate-400 mt-1">Invoices sent directly via WhatsApp</p>
          </div>
        </div>

        {/* Invoice History Table */}
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 mb-3">Billing History & GST Invoices</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Invoice No.</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-medium">10 Oct, 2026</td>
                  <td className="p-3 text-slate-500">INV-2026-10492</td>
                  <td className="p-3 font-bold text-slate-900">₹200.00</td>
                  <td className="p-3"><span className="text-emerald-600 font-bold">Paid (UPI)</span></td>
                  <td className="p-3 text-right">
                    <button className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">10 Sep, 2026</td>
                  <td className="p-3 text-slate-500">INV-2026-09281</td>
                  <td className="p-3 font-bold text-slate-900">₹200.00</td>
                  <td className="p-3"><span className="text-emerald-600 font-bold">Paid (UPI)</span></td>
                  <td className="p-3 text-right">
                    <button className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancel button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">No lock-in period. You can pause or cancel anytime.</span>
          <button className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold">
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
