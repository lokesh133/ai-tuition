'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();

  // Mode: OTP (primary) vs PASSWORD
  const [loginMode, setLoginMode] = useState<'OTP' | 'PASSWORD'>('OTP');

  // OTP Login State
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Password Login State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resend OTP Countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Sync Student Records on Login
  const syncRecordsAndRedirect = async (studentData: any, cleanPhone: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_user', JSON.stringify(studentData));
      localStorage.setItem('vidya_subscribed', studentData.isSubscribed ? 'true' : 'false');

      try {
        const recRes = await fetch(
          `/api/student/records?phone=${encodeURIComponent(cleanPhone)}&studentId=${encodeURIComponent(studentData.id || '')}`
        );
        if (recRes.ok) {
          const recData = await recRes.json();
          if (recData.worksheetHistory && recData.worksheetHistory.length > 0) {
            localStorage.setItem('ai_tuition_worksheet_records', JSON.stringify(recData.worksheetHistory));
          }
          if (recData.testHistory && recData.testHistory.length > 0) {
            localStorage.setItem('vidya_sunday_test_history_v1', JSON.stringify(recData.testHistory));
          }
          if (recData.currentSession) {
            localStorage.setItem('vidya_current_session', JSON.stringify(recData.currentSession));
          }
        }
      } catch (syncErr) {
        console.warn('Student login records sync error:', syncErr);
      }
    }
    setTimeout(() => {
      router.push('/tutor');
    }, 600);
  };

  // 1. Send OTP to Mobile
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('कृपया मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें (शुरुआत 6, 7, 8, 9 से)।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'LOGIN' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'ओटीपी भेजने में समस्या हुई। कृपया पुनः प्रयास करें।');
        setLoading(false);
        return;
      }

      setDemoOtp(data.demoOtp || null);
      setOtpStep('OTP');
      setResendCountdown(60);
      setSuccess(`ओटीपी +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)} पर भेज दिया गया है!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError('सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट जांचें।');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP & Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError('कृपया मोबाइल पर प्राप्त 4-अंकों का ओटीपी दर्ज करें।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'गलत ओटीपी! कृपया पुनः प्रयास करें।');
        setLoading(false);
        return;
      }

      setSuccess(`सफलतापूर्वक लॉगिन हो गया! AI Tutor में आपका स्वागत है...`);
      await syncRecordsAndRedirect(data.student, cleanPhone);
    } catch (err) {
      setError('लॉगिन करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      setLoading(false);
    }
  };

  // 3. Fallback: Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!password) {
      setError('कृपया अपना पासवर्ड दर्ज करें।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'गलत मोबाइल नंबर या पासवर्ड!');
        setLoading(false);
        return;
      }

      setSuccess(`नमस्ते ${data.student.name}, AI Tutor खुल रहा है...`);
      await syncRecordsAndRedirect(data.student, cleanPhone);
    } catch (err) {
      setError('लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 text-slate-800 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">AI Tuition</span>
            <span className="block text-[11px] font-bold text-indigo-600">छात्र लॉगिन पोर्टल (Student Login)</span>
          </div>
        </Link>

        <Link
          href="/signup"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors"
        >
          नया खाता बनाएं (Sign Up) →
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto w-full my-6 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-amber-500" />

        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
            📱
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {loginMode === 'OTP' ? 'मोबाइल OTP लॉगिन' : 'पासवर्ड से लॉगिन'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {loginMode === 'OTP'
              ? 'अपने 10 अंकों के मोबाइल नंबर पर ओटीपी प्राप्त कर तुरंत लॉगिन करें'
              : 'रजिस्टर्ड मोबाइल नंबर और पासवर्ड से लॉगिन करें'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-5 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setLoginMode('OTP');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'OTP'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>मोबाइल OTP लॉगिन</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('PASSWORD');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'PASSWORD'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>पासवर्ड लॉगिन</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* MODE 1: MOBILE OTP LOGIN */}
        {loginMode === 'OTP' && (
          <div>
            {otpStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    मोबाइल नंबर (10-Digit Mobile Number) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98XXXXXXXX"
                      className="w-full pl-13 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-bold tracking-wider text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>ओटीपी भेजा जा रहा है...</span>
                  ) : (
                    <>
                      <span>ओटीपी भेजें (Send OTP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">ओटीपी भेजा गया:</span>
                    <span className="font-black text-slate-900 tracking-wider">
                      +91 {phone.slice(0, 5)} {phone.slice(5)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('PHONE');
                      setOtp('');
                      setDemoOtp(null);
                      setError(null);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    नंबर बदलें
                  </button>
                </div>

                {demoOtp && (
                  <div
                    onClick={() => setOtp(demoOtp)}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all"
                  >
                    <span>डेमो OTP: <strong>{demoOtp}</strong></span>
                    <span className="text-[10px] text-amber-700 uppercase font-black underline">ऑटो-भरें ↵</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ओटीपी दर्ज करें (Enter OTP) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full text-center py-2.5 text-2xl tracking-[0.4em] font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.trim().length < 4}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>सत्यापित किया जा रहा है...</span>
                  ) : (
                    <>
                      <span>सत्यापित करें और लॉगिन करें</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  {resendCountdown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      ओटीपी दोबारा भेजें ({resendCountdown}s)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      ओटीपी दोबारा भेजें (Resend OTP)
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: PASSWORD LOGIN */}
        {loginMode === 'PASSWORD' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                मोबाइल नंबर (Mobile Number) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold tracking-wide"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                पासवर्ड (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="अपना पासवर्ड दर्ज करें"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>लॉगिन किया जा रहा है...</span>
              ) : (
                <>
                  <span>पासवर्ड से लॉगिन करें</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          खाता नहीं है?{' '}
          <Link href="/signup" className="font-extrabold text-indigo-600 hover:underline">
            नया खाता बनाएं (Sign Up)
          </Link>
        </div>

        {/* Quick Demo Accounts */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">
            त्वरित परीक्षण (Quick Demo Accounts):
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhone('9829012345');
                setPassword('1234');
                setOtpStep('PHONE');
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
            >
              Aarav (9829012345)
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone('9610328630');
                setPassword('1234');
                setOtpStep('PHONE');
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
            >
              Lokesh (9610328630)
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 AI Tuition • सुरक्षित एवं बाल-अनुकूल AI शिक्षण मंच
      </footer>
    </div>
  );
}
