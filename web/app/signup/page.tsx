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
  GraduationCap,
  LocateFixed,
  Check,
  Building2,
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

const POPULAR_LOCATIONS = [
  'Jaipur, Rajasthan',
  'Jodhpur, Rajasthan',
  'Kota, Rajasthan',
  'Alwar, Rajasthan',
  'Ajmer, Rajasthan',
  'Bikaner, Rajasthan',
  'Udaipur, Rajasthan',
  'Bhilwara, Rajasthan',
  'Sikar, Rajasthan',
  'Bharatpur, Rajasthan',
  'Pali, Rajasthan',
  'Sri Ganganagar, Rajasthan',
  'Hanumangarh, Rajasthan',
  'Jhunjhunu, Rajasthan',
  'Churu, Rajasthan',
  'Nagaur, Rajasthan',
  'Tonk, Rajasthan',
  'Sawai Madhopur, Rajasthan',
  'Dausa, Rajasthan',
  'Chittorgarh, Rajasthan',
  'Bundi, Rajasthan',
  'Baran, Rajasthan',
  'Jhalawar, Rajasthan',
  'Banswara, Rajasthan',
  'Dungarpur, Rajasthan',
  'Pratapgarh, Rajasthan',
  'Rajsamand, Rajasthan',
  'Sirohi, Rajasthan',
  'Jalore, Rajasthan',
  'Barmer, Rajasthan',
  'Jaisalmer, Rajasthan',
  'Delhi (NCR)',
  'Gurugram, Haryana',
  'Noida, UP',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
  'Indore, MP',
  'Bhopal, MP',
  'Lucknow, UP',
  'Patna, Bihar',
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
  const [city, setCity] = useState('Jaipur');
  const [schoolName, setSchoolName] = useState('');

  // Location suggestions & GPS state
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close city dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCitySearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Auto-Detect Current Location using GPS + Reverse Geocoding
  const handleDetectCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            const detected =
              data.address?.city ||
              data.address?.state_district ||
              data.address?.town ||
              data.address?.county ||
              data.address?.state;
            if (detected) {
              setCity(detected);
              setCitySearchOpen(false);
            }
          }
        } catch (err) {
          console.warn('Geolocation reverse geocoding note:', err);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (geoErr) => {
        console.warn('Geolocation error:', geoErr);
        setIsDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  // Validation function
  const validateForm = (): boolean => {
    setError(null);
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please enter the student\'s full name (at least 2 letters).');
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

    if (!password || password.trim().length < 4) {
      setError('Please set an easy password or 4-digit PIN for the student.');
      return false;
    }

    return true;
  };

  // Setup Firebase invisible reCAPTCHA
  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null;
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(
          firebaseAuth,
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => {
              (window as any).recaptchaVerifier?.clear();
              (window as any).recaptchaVerifier = null;
            },
          }
        );
      }
      return (window as any).recaptchaVerifier;
    } catch (e) {
      console.warn('reCAPTCHA init note:', e);
      return null;
    }
  };

  // Step 1: Request OTP on Student Mobile
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
        setError(checkData.message || 'This mobile number is already registered or invalid.');
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
        }
      } catch (fbErr: any) {
        console.warn('Firebase SMS dispatch note (using fallback OTP):', fbErr.message || fbErr);
      }

      setShowOtpModal(true);
      setResendCooldown(45);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Signup initiate error:', err);
      setError('Could not connect to the server. Please check your internet connection.');
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
        setResendCooldown(45);
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
      console.error('Resend OTP error:', e);
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Verify OTP & Create Account
  const handleVerifyOtpAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 4 or 6-digit OTP code.');
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
        console.warn('Firebase verify note, verifying against internal DB OTP store:', fbErr.message);
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
          schoolName: schoolName.trim(),
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
        localStorage.setItem(
          'student_user',
          JSON.stringify({ ...data.student, schoolName: schoolName.trim() })
        );
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 text-slate-800 flex flex-col justify-between p-4 md:p-8 font-sans">
      <div id="recaptcha-container" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">AI Tuition</span>
            <span className="block text-[11px] font-bold text-indigo-600">Student Sign Up</span>
          </div>
        </Link>

        <Link
          href="/login"
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
        >
          Already registered? <span className="text-indigo-600 font-extrabold">Login →</span>
        </Link>
      </header>

      {/* Main Registration Card */}
      <main className="max-w-lg mx-auto w-full my-6 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black mb-2 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Class 1st to 8th • Free Homework Help
          </span>
          <h1 className="text-2xl font-black text-slate-900">Student Sign Up</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an account to start learning with personal AI Teachers
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-black text-sm">Account created successfully!</p>
              <p className="text-emerald-700 font-normal">Opening AI Tutor studio...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleInitiateSignup} className="space-y-4">
          {/* Student Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Student Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Parent Mobile Number with +91 Country Badge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Parent Mobile Number <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">10 Digits (OTP verification)</span>
            </div>
            <div className="flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100 transition-all overflow-hidden bg-slate-50/40">
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 border-r border-slate-200 text-slate-700 font-bold text-xs shrink-0 select-none">
                <span className="text-base">🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98290 12345"
                className="w-full px-3.5 py-2.5 bg-transparent focus:outline-none text-sm font-bold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Password / PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password / 4-Digit PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Easy 4-digit PIN or password for the child"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
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
              Select Class <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CLASSES.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    type="button"
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="HINDI">Hindi Medium</option>
                <option value="ENGLISH">English Medium</option>
              </select>
            </div>
          </div>

          {/* City / District with Intelligent Suggestions & Auto-Detect */}
          <div className="relative" ref={cityDropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                City / District (Optional)
              </label>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Detect current location using GPS"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-amber-500' : 'text-indigo-600'}`} />
                <span>{isDetectingLocation ? 'Detecting...' : '📍 Auto-Detect'}</span>
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={city}
                onFocus={() => setCitySearchOpen(true)}
                onChange={(e) => {
                  setCity(e.target.value);
                  setCitySearchOpen(true);
                }}
                placeholder="Type or select e.g. Jaipur, Kota, Alwar..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-800"
              />
              {city && (
                <button
                  type="button"
                  onClick={() => setCity('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {citySearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-indigo-100 shadow-xl max-h-52 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                  Select Location or District:
                </div>
                {POPULAR_LOCATIONS.filter((loc) =>
                  loc.toLowerCase().includes((city || '').toLowerCase().trim())
                ).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setCity(loc.split(',')[0].trim());
                      setCitySearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{loc}</span>
                    </div>
                    {city.toLowerCase() === loc.split(',')[0].toLowerCase().trim() && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* School Name (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              School Name (Optional)
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Central Academy, Kendriya Vidyalaya, DPS..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
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
            <Sparkles className="w-4 h-4 text-indigo-600" /> Class 1st to 8th
          </span>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-indigo-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setError(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl shadow-inner">
                <KeyRound className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Verify Mobile OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the code sent to <strong className="text-slate-700">+91 {phone}</strong>
              </p>
            </div>

            {demoOtp && (
              <div
                onClick={() => setOtp(demoOtp)}
                className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-all"
              >
                <span>Verification Code: <strong>{demoOtp}</strong></span>
                <span className="text-[10px] text-amber-700 uppercase font-black underline">Auto-Fill ↵</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
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
                  placeholder="• • • •"
                  className="w-full text-center py-2.5 text-2xl tracking-[0.4em] font-black rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {otpLoading ? (
                  <span>Verifying OTP...</span>
                ) : (
                  <>
                    <span>Confirm & Start Learning</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                {resendCooldown > 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend OTP Code</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 AI Tuition • Safe, Child-Friendly AI Learning Platform
      </footer>
    </div>
  );
}
