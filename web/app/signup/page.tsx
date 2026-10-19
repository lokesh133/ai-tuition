'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Phone,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Star,
  MapPin,
  AlertCircle,
  X,
  KeyRound,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';

const CLASSES = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
];

export default function StudentSignupPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Class 5');
  const [board, setBoard] = useState('RBSE (Rajasthan Board)');
  const [medium, setMedium] = useState('HINDI');
  const [city, setCity] = useState('Alwar');

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Firebase Phone Auth
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isFirebaseOtp, setIsFirebaseOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
    };
  }, []);

  // Validation function
  const validateForm = (): boolean => {
    setError(null);
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please enter a valid student name (at least 2 letters).');
      return false;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.');
      return false;
    }

    if (password.length < 4) {
      setError('Password / 4-Digit PIN must be at least 4 characters or digits.');
      return false;
    }

    return true;
  };

  const setupRecaptcha = () => {
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }
      return (window as any).recaptchaVerifier;
    } catch (e) {
      console.warn('Recaptcha setup warning:', e);
      return null;
    }
  };

  // Step 1: Validate, send Firebase SMS or fallback OTP
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanPhone = phone.trim().replace(/\D/g, '');
    setLoading(true);
    setError(null);

    // 1. Check with DB if phone is already registered
    try {
      const checkRes = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'SIGNUP' }),
      });

      const checkData = await checkRes.json();
      if (!checkRes.ok || !checkData.success) {
        setError(checkData.message || 'Mobile number already registered or invalid.');
        setLoading(false);
        return;
      }

      setDemoOtp(checkData.demoOtp || null);

      // 2. Try Firebase Phone Auth for real SMS
      try {
        const appVerifier = setupRecaptcha();
        if (appVerifier) {
          const confirmation = await signInWithPhoneNumber(
            firebaseAuth,
            `+91${cleanPhone}`,
            appVerifier
          );
          setConfirmationResult(confirmation);
          setIsFirebaseOtp(true);
          console.log('✅ Real SMS sent via Google Firebase to +91', cleanPhone);
        }
      } catch (fbErr: any) {
        console.warn('Firebase SMS dispatch note (using fallback OTP):', fbErr.message || fbErr);
        setIsFirebaseOtp(false);
      }

      setShowOtpModal(true);
      setResendCooldown(30);

      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Could not connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    const cleanPhone = phone.trim().replace(/\D/g, '');
    setOtpLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, purpose: 'SIGNUP' }),
      });
      const data = await res.json();
      if (data.success) {
        setDemoOtp(data.demoOtp || null);
        setResendCooldown(30);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e) {
      setError('Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Verify OTP and Create Account in DB
  const handleVerifyOtpAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP received on your mobile.');
      return;
    }

    setOtpLoading(true);
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');

    // 1. If Firebase Confirmation is active, confirm with Firebase
    if (confirmationResult && isFirebaseOtp) {
      try {
        await confirmationResult.confirm(otp.trim());
      } catch (fbErr: any) {
        console.warn('Firebase OTP verification failed, checking fallback OTP:', fbErr);
      }
    }

    // 2. Create Student in Supabase Database
    try {
      const res = await fetch('/api/auth/student/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          password: password.trim(),
          classGrade: selectedClass,
          board: board.includes('CBSE') ? 'CBSE' : 'RBSE',
          medium,
          city: city.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'OTP verification failed. Please check OTP.');
        setOtpLoading(false);
        return;
      }

      setSuccess(true);
      setShowOtpModal(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem('student_user', JSON.stringify(data.student));
      }

      setTimeout(() => {
        router.push('/tutor');
      }, 1200);
    } catch (err) {
      setError('Could not connect to server to complete signup.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-indigo-50 to-emerald-50 text-slate-800 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Invisible Recaptcha Container for Google Firebase */}
      <div id="recaptcha-container"></div>

      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">AI Tuition</span>
            <span className="block text-[11px] font-bold text-indigo-600">Student Portal (Class 1–8)</span>
          </div>
        </Link>

        <div className="text-xs">
          <span className="text-slate-500 hidden sm:inline">Already have an account? </span>
          <Link
            href="/login"
            className="font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200"
          >
            Login →
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-6 bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400" />

        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> ₹200/Month • 24/7 Personal AI Home Tutor
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">
            Create Student Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign up with OTP verification to start personalized AI learning.
          </p>
        </div>

        {error && !showOtpModal && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Mobile verified & account created! Opening AI Classroom...</span>
          </div>
        )}

        <form onSubmit={handleInitiateSignup} className="space-y-4">
          {/* Student Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Student Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Parent Mobile Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Parent Mobile Number *
              </label>
              <span className="text-[11px] font-semibold text-slate-400">10 Digits (OTP verification)</span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 9829012345"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold tracking-wide"
              />
            </div>
          </div>

          {/* Password / PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password / 4-Digit PIN *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Easy 4-digit PIN or password for the child"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Class Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Class *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CLASSES.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    type="button"
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400 scale-[1.02]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Board & Medium */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Board</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>RBSE (Rajasthan Board)</option>
                <option>CBSE Board</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Medium</label>
              <select
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HINDI">Hindi Medium</option>
                <option value="ENGLISH">English Medium</option>
              </select>
            </div>
          </div>

          {/* City / District */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              City / District (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Alwar, Jaipur, Delhi"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Sending OTP to Mobile...</span>
            ) : (
              <>
                <span>Verify Mobile & Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Trust Badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-around text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Safe
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> RBSE / CBSE
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Live AI Teachers
          </span>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-indigo-100 relative">
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Verify Mobile OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the OTP code sent to <strong className="text-slate-800">+91 {phone}</strong>
              </p>
            </div>

            {demoOtp && !isFirebaseOtp && (
              <div
                onClick={() => setOtp(demoOtp)}
                className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all"
                title="Click to auto-fill OTP"
              >
                <span>Demo OTP: <strong>{demoOtp}</strong></span>
                <span className="text-[10px] text-amber-700 uppercase font-black underline">Auto Fill ↵</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndCreateAccount} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center py-3 text-2xl tracking-[0.4em] font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {otpLoading ? (
                  <span>Verifying OTP...</span>
                ) : (
                  <>
                    <span>Confirm & Finish Sign Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-slate-400 font-semibold">
                    Resend OTP in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 AI Tuition • Safe & Child-Friendly AI Learning Platform
      </footer>
    </div>
  );
}
