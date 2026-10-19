'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  X,
  Sparkles,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'OTP_RESET'>('EMAIL');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('कृपया एडमिन ईमेल और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'अमान्य एडमिन क्रेडेंशियल्स');
        setLoading(false);
        return;
      }

      // Store admin session
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      }

      router.push('/admin');
    } catch (err: any) {
      setError('सर्वर से संपर्क नहीं हो पाया।');
      setLoading(false);
    }
  };

  // Forgot Password: Step 1 Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);

    if (!forgotEmail) {
      setForgotMsg({ type: 'error', text: 'कृपया पंजीकृत एडमिन ईमेल दर्ज करें।' });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp', email: forgotEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setForgotMsg({ type: 'error', text: data.message || 'ईमेल नहीं मिला।' });
        setForgotLoading(false);
        return;
      }

      setForgotStep('OTP_RESET');
      if (data.debugOtp) {
        setForgotOtp(data.debugOtp);
        setForgotMsg({
          type: 'success',
          text: `OTP कोड आपके ईमेल पर भेजा गया (लोकल टेस्ट कोड: ${data.debugOtp})`,
        });
      } else {
        setForgotMsg({ type: 'success', text: data.message });
      }
      setForgotLoading(false);
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: 'सर्वर त्रुटि।' });
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);

    if (!forgotOtp || !newPassword) {
      setForgotMsg({ type: 'error', text: 'कृपया 6-अंकों का OTP और नया पासवर्ड दर्ज करें।' });
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          email: forgotEmail,
          otp: forgotOtp,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setForgotMsg({ type: 'error', text: data.message || 'पासवर्ड रीसेट विफल रहा।' });
        setForgotLoading(false);
        return;
      }

      setForgotMsg({ type: 'success', text: data.message });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('EMAIL');
        setEmail(forgotEmail);
        setPassword(newPassword);
      }, 1500);
      setForgotLoading(false);
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: 'सर्वर त्रुटि।' });
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
            ⚡
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight">AI Tuition</span>
            <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Admin Portal
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← होम पेज पर जाएं
        </Link>
      </header>

      {/* Main Login Box */}
      <main className="max-w-md mx-auto w-full my-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">सुपर एडमिन लॉगिन</h1>
          <p className="text-xs text-slate-400 mt-1">
            सुरक्षित एडमिनिस्ट्रेटिव एक्सेस (केवल अधिकृत स्टाफ के लिए)
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              एडमिन ईमेल आईडी (Admin Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aituition.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">पासवर्ड (Password)</label>
              {/* User requirement: ONLY Forgot Password, no sign up */}
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || 'admin@aituition.com');
                  setForgotMsg(null);
                  setForgotStep('EMAIL');
                  setShowForgotModal(true);
                }}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                पासवर्ड भूल गए? (Forgot Password)
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-600 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>सत्यापन हो रहा है...</span>
            ) : (
              <>
                <span>एडमिन पैनल खोलें</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Note - Explicitly mentions No Public Registration */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>सुरक्षा सूचना: नए एडमिन केवल सुपर-एडमिन द्वारा बनाए जा सकते हैं।</span>
          </p>
        </div>

        {/* Quick Demo Credentials for founder testing */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <p className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider mb-1.5 text-center">
            ⚡ त्वरित डेमो टेस्ट (क्लिक करें):
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@aituition.com');
                setPassword('admin');
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 text-[11px] font-bold text-indigo-300"
            >
              सुपर एडमिन (लोकेश)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('rahul@aituition.com');
                setPassword('staff');
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300"
            >
              स्टाफ (राहुल)
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">पासवर्ड रीसेट (Forgot Password)</h3>
                <p className="text-[11px] text-slate-400">
                  {forgotStep === 'EMAIL'
                    ? 'अपना पंजीकृत एडमिन ईमेल दर्ज करें'
                    : 'OTP कोड और नया पासवर्ड दर्ज करें'}
                </p>
              </div>
            </div>

            {forgotMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  forgotMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {forgotMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotStep === 'EMAIL' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">एडमिन ईमेल</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@aituition.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'कोड भेजा जा रहा है...' : '6-अंकीय OTP कोड भेजें →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    6-अंकीय OTP कोड
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    नया पासवर्ड (New Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="कम से कम 6 अक्षर"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('EMAIL')}
                    className="w-1/3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    ← वापस
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'अपडेट हो रहा है...' : 'नया पासवर्ड सुरक्षित करें'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3 z-10">
        AI Tuition Management Console • End-to-End Encrypted Session
      </footer>
    </div>
  );
}
