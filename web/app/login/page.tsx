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
} from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

export default function StudentLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState<'PHONE' | 'OTP_RESET'>('PHONE');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotDemoOtp, setForgotDemoOtp] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotConfirmation, setForgotConfirmation] = useState<ConfirmationResult | null>(null);
  const [isFirebaseForgot, setIsFirebaseForgot] = useState(false);

  useEffect(() => {
    return () => {
      if ((window as any).forgotRecaptchaVerifier) {
        try {
          (window as any).forgotRecaptchaVerifier.clear();
          (window as any).forgotRecaptchaVerifier = null;
        } catch (e) {}
      }
    };
  }, []);

  const setupForgotRecaptcha = () => {
    try {
      if (!(window as any).forgotRecaptchaVerifier) {
        (window as any).forgotRecaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'forgot-recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }
      return (window as any).forgotRecaptchaVerifier;
    } catch (e) {
      console.warn('Forgot recaptcha error:', e);
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password / PIN.');
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
        setError(data.message || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('student_user', JSON.stringify(data.student));
      }
      setTimeout(() => {
        router.push('/tutor');
      }, 1000);
    } catch (err: any) {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  };

  // Forgot Password: Send OTP
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanPhone = forgotPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setForgotError('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'FORGOT_PASSWORD' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotError(data.message || 'No account found with this number.');
        setForgotLoading(false);
        return;
      }

      setForgotDemoOtp(data.demoOtp || null);

      // Try Firebase Phone Auth for real SMS
      try {
        const appVerifier = setupForgotRecaptcha();
        if (appVerifier) {
          const confirmation = await signInWithPhoneNumber(
            firebaseAuth,
            `+91${cleanPhone}`,
            appVerifier
          );
          setForgotConfirmation(confirmation);
          setIsFirebaseForgot(true);
          console.log('✅ Forgot password SMS sent via Firebase to +91', cleanPhone);
        }
      } catch (fbErr: any) {
        console.warn('Firebase SMS warning in forgot password:', fbErr.message || fbErr);
        setIsFirebaseForgot(false);
      }

      setForgotStep('OTP_RESET');
    } catch (e) {
      setForgotError('Could not send OTP. Please check your connection.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password: Reset with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotOtp.trim() || forgotOtp.trim().length < 4) {
      setForgotError('Please enter the OTP.');
      return;
    }
    if (forgotNewPassword.trim().length < 4) {
      setForgotError('New password must be at least 4 characters or digits.');
      return;
    }

    setForgotLoading(true);
    const cleanPhone = forgotPhone.replace(/\D/g, '');

    // Verify with Firebase if available
    if (forgotConfirmation && isFirebaseForgot) {
      try {
        await forgotConfirmation.confirm(forgotOtp.trim());
      } catch (fbErr: any) {
        console.warn('Firebase OTP verification failed, falling back to server OTP:', fbErr.message);
      }
    }

    try {
      const res = await fetch('/api/auth/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotError(data.message || 'Password reset failed.');
        setForgotLoading(false);
        return;
      }

      setForgotSuccess('Password reset successfully! Logging in...');
      if (data.student && typeof window !== 'undefined') {
        localStorage.setItem('student_user', JSON.stringify(data.student));
      }

      setTimeout(() => {
        setShowForgotModal(false);
        router.push('/tutor');
      }, 1200);
    } catch (e) {
      setForgotError('Could not reset password. Please try again.');
    } finally {
      setForgotLoading(false);
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
            <span className="block text-[11px] font-bold text-indigo-600">Student Portal</span>
          </div>
        </Link>

        <Link
          href="/signup"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200"
        >
          Create New Account →
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md mx-auto w-full my-8 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-amber-500" />

        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
            🎒
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Student Login
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Login with your registered mobile number and password
          </p>
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
            <span>Login successful! Opening AI Classroom...</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mobile Number (Phone) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold tracking-wide"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Password / PIN *</label>
              <button
                type="button"
                onClick={() => {
                  setForgotPhone(phone);
                  setForgotStep('PHONE');
                  setForgotError(null);
                  setForgotSuccess(null);
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password / PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/signup" className="font-extrabold text-indigo-600 hover:underline">
            Sign Up for Free
          </Link>
        </div>

        {/* Demo Quick Logins */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">
            Quick Demo Accounts:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhone('9829012345');
                setPassword('1234');
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
            >
              Aarav (Class 5)
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone('9414054321');
                setPassword('1234');
              }}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
            >
              Priya (Class 7)
            </button>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal (OTP Verification) */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-indigo-100 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Reset Password via OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                {forgotStep === 'PHONE'
                  ? 'Enter your registered mobile number to receive an OTP'
                  : `Enter OTP sent to +91 ${forgotPhone} and choose a new password`}
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'PHONE' ? (
              <form onSubmit={handleSendForgotOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <span>Sending OTP...</span>
                  ) : (
                    <>
                      <span>Send OTP to Mobile</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {forgotDemoOtp && (
                  <div
                    onClick={() => setForgotOtp(forgotDemoOtp)}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all"
                  >
                    <span>Demo OTP: <strong>{forgotDemoOtp}</strong></span>
                    <span className="text-[10px] text-amber-700 uppercase font-black underline">Auto Fill ↵</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • •"
                    className="w-full text-center py-2 text-xl tracking-[0.4em] font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password / PIN
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new 4-digit PIN or password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <span>Updating Password in DB...</span>
                  ) : (
                    <>
                      <span>Reset Password & Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep('PHONE')}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600"
                  >
                    ← Change Mobile Number
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Invisible reCAPTCHA container for Firebase */}
      <div id="forgot-recaptcha-container"></div>

      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 AI Tuition • Safe & Child-Friendly AI Learning Platform
      </footer>
    </div>
  );
}
