'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  KeyRound,
} from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();

  // Mode: EMAIL_OTP (primary) vs PASSWORD
  const [loginMode, setLoginMode] = useState<'EMAIL_OTP' | 'PASSWORD'>('EMAIL_OTP');

  // Email OTP Login State
  const [email, setEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [emailOtp, setEmailOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Password Login State
  const [passwordIdentifier, setPasswordIdentifier] = useState('');
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
  const syncRecordsAndRedirect = async (studentData: any, identifier: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_user', JSON.stringify(studentData));
      localStorage.setItem('vidya_subscribed', studentData.isSubscribed ? 'true' : 'false');

      try {
        const queryParam = identifier.includes('@')
          ? `email=${encodeURIComponent(identifier)}`
          : `phone=${encodeURIComponent(identifier.replace(/\D/g, ''))}`;
        const recRes = await fetch(
          `/api/student/records?${queryParam}&studentId=${encodeURIComponent(studentData.id || '')}`
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

  // ==========================================
  // 1. SEND EMAIL OTP
  // ==========================================
  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'LOGIN' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to send OTP to email. Please check your email address.');
        setLoading(false);
        return;
      }

      setDemoOtp(data.demoOtp || null);
      setEmailOtpStep('OTP');
      setResendCountdown(60);
      setSuccess(`OTP code requested for ${cleanEmail}`);
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. VERIFY EMAIL OTP
  // ==========================================
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = emailOtp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid or expired OTP code.');
        setLoading(false);
        return;
      }

      setSuccess(`Welcome ${data.student?.name || 'Student'}! Opening AI Tutor...`);
      await syncRecordsAndRedirect(data.student, cleanEmail);
    } catch (err) {
      setError('Login error. Please try again.');
      setLoading(false);
    }
  };

  // ==========================================
  // 3. PASSWORD LOGIN
  // ==========================================
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = passwordIdentifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your Email address or Mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const isMail = cleanIdentifier.includes('@');
      const bodyPayload = isMail
        ? { email: cleanIdentifier.toLowerCase(), password }
        : { phone: cleanIdentifier.replace(/\D/g, ''), password };

      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Incorrect email/mobile or password.');
        setLoading(false);
        return;
      }

      setSuccess(`Welcome back, ${data.student.name}! Opening AI Tutor...`);
      await syncRecordsAndRedirect(data.student, cleanIdentifier);
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
            {loginMode === 'EMAIL_OTP' ? (
              <Mail className="w-7 h-7 text-indigo-600" />
            ) : (
              <Lock className="w-7 h-7 text-indigo-600" />
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {loginMode === 'EMAIL_OTP' ? 'Email OTP Login' : 'Password Login'}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5">
            {loginMode === 'EMAIL_OTP'
              ? 'Enter your email to receive an instant verification code'
              : 'Sign in with your email / mobile and password'}
          </p>
        </div>

        {/* 2-Way Tab Switcher: Email OTP vs Password */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => {
              setLoginMode('EMAIL_OTP');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'EMAIL_OTP'
                ? 'bg-white text-indigo-700 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('PASSWORD');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {error.toLowerCase().includes('sign up') && (
                <div className="mt-1.5">
                  <Link
                    href="/signup"
                    className="font-black text-rose-800 hover:text-rose-950 underline inline-flex items-center gap-1"
                  >
                    Create Account (Sign Up) →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{success}</span>
          </div>
        )}

        {/* ==========================================
            TAB 1: EMAIL OTP LOGIN (DEFAULT & FREE)
            ========================================== */}
        {loginMode === 'EMAIL_OTP' && (
          <div>
            {emailOtpStep === 'EMAIL' ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-bold text-slate-900 bg-slate-50/40 placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                    Instant verification code will be sent to your email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.includes('@')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Sending Code to Email...</span>
                  ) : (
                    <>
                      <span>Send Email OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">OTP sent to:</span>
                    <span className="font-black text-slate-900 text-xs break-all">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailOtpStep('EMAIL');
                      setEmailOtp('');
                      setError(null);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shrink-0 ml-2"
                  >
                    Change Email
                  </button>
                </div>

                {demoOtp && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center">
                    <span className="block text-[11px] text-amber-700 font-semibold mb-0.5">Dev Testing OTP Code:</span>
                    <span className="text-xl font-black font-mono tracking-widest text-amber-900">{demoOtp}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Enter 4-Digit OTP Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full text-center py-3 text-2xl tracking-[0.5em] font-black rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-slate-900 bg-slate-50/30"
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    Check your Inbox or Spam folder
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || emailOtp.trim().length < 4}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <span>Verifying Code...</span>
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
                      Resend code in <strong className="text-slate-600">{resendCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendEmailOtp()}
                      className="font-bold text-indigo-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend Email OTP</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: PASSWORD LOGIN
            ========================================== */}
        {loginMode === 'PASSWORD' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Email Address or Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={passwordIdentifier}
                onChange={(e) => setPasswordIdentifier(e.target.value)}
                placeholder="name@gmail.com or 10-digit mobile"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-bold text-slate-900 bg-slate-50/40 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700">
                  Password / PIN <span className="text-rose-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password or PIN"
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
