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
  ShieldCheck,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step: 'EMAIL' -> 'RESET' -> 'SUCCESS'
  const [step, setStep] = useState<'EMAIL' | 'RESET' | 'SUCCESS'>('EMAIL');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Resend Countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Step 1: Send Reset OTP to Email
  const handleSendResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid registered email address (e.g. name@gmail.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, purpose: 'FORGOT_PASSWORD' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'No account found with this email. Please check your email or Sign Up.');
        setLoading(false);
        return;
      }

      setDemoOtp(data.demoOtp || null);
      setStep('RESET');
      setResendCountdown(60);
      setSuccess(`Reset OTP code sent to ${cleanEmail}. Please check your inbox / spam folder.`);
    } catch (err) {
      setError('Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 4-digit OTP code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setError('New password must be at least 4 characters or digits.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'OTP verification failed. Please check the code.');
        setLoading(false);
        return;
      }

      setStep('SUCCESS');
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Server error while resetting password. Please try again.');
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
            <span className="block text-[11px] font-bold text-indigo-600">Password Recovery</span>
          </div>
        </Link>

        <Link
          href="/login"
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
        >
          Back to Login →
        </Link>
      </header>

      {/* Main Recovery Card */}
      <main className="max-w-md mx-auto w-full my-6 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
            <KeyRound className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
          <p className="text-xs text-slate-500 mt-1.5">
            {step === 'EMAIL'
              ? 'Enter your registered email to receive a password reset code'
              : step === 'RESET'
              ? 'Enter the 4-digit code sent to your email and set your new password'
              : 'Password reset successful!'}
          </p>
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
                    Create new account now →
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
            STEP 1: ENTER REGISTERED EMAIL
            ========================================== */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendResetOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Registered Email Address <span className="text-rose-500">*</span>
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
                We will send a 4-digit verification code to this email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email.includes('@')}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span>Sending Reset Code...</span>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ==========================================
            STEP 2: ENTER OTP & NEW PASSWORD
            ========================================== */}
        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Reset code sent to:</span>
                <span className="font-black text-slate-900 text-xs break-all">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('EMAIL');
                  setOtp('');
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

            {/* OTP Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                4-Digit OTP Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={4}
                autoFocus
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="w-full text-center py-2.5 text-2xl tracking-[0.5em] font-black rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-slate-900 bg-slate-50/30"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password / PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set your new password or 4-digit PIN"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-semibold text-slate-900 bg-slate-50/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-sm font-semibold text-slate-900 bg-slate-50/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length < 4 || newPassword.trim().length < 4}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <span>Reset Password & Save</span>
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
                  onClick={() => handleSendResetOtp()}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Reset Code</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* ==========================================
            STEP 3: SUCCESS STATE
            ========================================== */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Password Changed!</h3>
            <p className="text-xs text-slate-500">
              Your password has been successfully updated in the database.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/25 transition-all"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          Remember your password?{' '}
          <Link href="/login" className="font-extrabold text-indigo-600 hover:underline">
            Log In
          </Link>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 AI Tuition • Safe, Child-Friendly AI Learning Platform
      </footer>
    </div>
  );
}

