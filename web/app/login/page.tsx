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
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
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
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
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
        setError(data.message || 'Unable to send OTP. Please check the number and try again.');
        setLoading(false);
        return;
      }

      setDemoOtp(data.demoOtp || null);
      setOtpStep('OTP');
      setResendCountdown(60);
      setSuccess(`OTP sent successfully to +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError('Connection error. Please check your internet connection.');
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
      setError('Please enter the 4 or 6-digit OTP received on your mobile.');
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
        setError(data.message || 'Invalid or expired OTP. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(`Login successful! Redirecting to AI Tutor...`);
      await syncRecordsAndRedirect(data.student, cleanPhone);
    } catch (err) {
      setError('Error logging in. Please try again.');
      setLoading(false);
    }
  };

  // 3. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
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
        setError(data.message || 'Incorrect mobile number or password.');
        setLoading(false);
        return;
      }

      setSuccess(`Welcome back, ${data.student.name}! Opening AI Tutor...`);
      await syncRecordsAndRedirect(data.student, cleanPhone);
    } catch (err) {
      setError('Login error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 text-slate-800 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">AI Tuition</span>
            <span className="block text-[11px] font-bold text-indigo-600">Student Portal</span>
          </div>
        </Link>

        <Link
          href="/signup"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors"
        >
          Create Account (Sign Up) →
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto w-full my-6 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-indigo-100/80 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
            <Smartphone className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {loginMode === 'OTP' ? 'Student Login' : 'Password Login'}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            {loginMode === 'OTP'
              ? 'Enter your mobile number to receive an instant OTP'
              : 'Sign in with your registered mobile number and password'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMode('OTP');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'OTP'
                ? 'bg-white text-indigo-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mobile OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('PASSWORD');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'PASSWORD'
                ? 'bg-white text-indigo-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Password</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{success}</span>
          </div>
        )}

        {/* MODE 1: MOBILE OTP LOGIN */}
        {loginMode === 'OTP' && (
          <div>
            {otpStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>

                  {/* Clean, perfectly-aligned Phone Input with +91 Country Badge */}
                  <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition-all overflow-hidden bg-slate-50/40">
                    <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 border-r border-slate-200 text-slate-700 font-bold text-sm shrink-0 select-none">
                      <span className="text-base">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      autoFocus
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full px-4 py-3 bg-transparent focus:outline-none text-base font-bold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                    Enter 10-digit number without 0 or +91
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Sending OTP...</span>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">OTP sent to:</span>
                    <span className="font-black text-slate-900 tracking-wider text-sm">
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
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-200"
                  >
                    Change Number
                  </button>
                </div>

                {demoOtp && (
                  <div
                    onClick={() => setOtp(demoOtp)}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all"
                  >
                    <span>Verification Code: <strong>{demoOtp}</strong></span>
                    <span className="text-[10px] text-amber-700 uppercase font-black underline">Auto-Fill ↵</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Enter OTP Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full text-center py-3 text-2xl tracking-[0.4em] font-black rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-slate-900 bg-slate-50/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.trim().length < 4}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Verify & Login</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  {resendCountdown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      Resend OTP in <strong className="text-slate-600">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Resend OTP
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
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition-all overflow-hidden bg-slate-50/40">
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 border-r border-slate-200 text-slate-700 font-bold text-sm shrink-0 select-none">
                  <span className="text-base">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full px-4 py-3 bg-transparent focus:outline-none text-base font-bold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-semibold text-slate-900 bg-slate-50/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-extrabold text-indigo-600 hover:underline">
            Sign Up
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 AI Tuition • Safe, Child-Friendly AI Learning Platform
      </footer>
    </div>
  );
}
