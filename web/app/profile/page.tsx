'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Lock,
  BookOpen,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  LogOut,
  Clock,
  Award,
  Calendar,
  Layers,
} from 'lucide-react';

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

export default function StudentProfilePage() {
  const router = useRouter();

  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedClass, setSelectedClass] = useState('Class 4');
  const [board, setBoard] = useState('RBSE (Rajasthan Board)');
  const [medium, setMedium] = useState('HINDI');
  const [city, setCity] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [doubtsAsked, setDoubtsAsked] = useState(0);
  const [createdAt, setCreatedAt] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('student_user');
      if (!stored) {
        // Not logged in -> redirect to login
        router.push('/login');
        return;
      }

      const parsed = JSON.parse(stored);
      if (parsed.id) setStudentId(parsed.id);
      if (parsed.name) setName(parsed.name);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.classGrade) setSelectedClass(parsed.classGrade);
      if (parsed.board) setBoard(parsed.board.includes('CBSE') ? 'CBSE Board' : 'RBSE (Rajasthan Board)');
      if (parsed.medium) setMedium(parsed.medium);
      if (parsed.city) setCity(parsed.city);

      // Fetch live fresh data from DB
      const queryParam = parsed.id ? `id=${parsed.id}` : `phone=${parsed.phone}`;
      fetch(`/api/student/profile?${queryParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.student) {
            const s = data.student;
            setStudentId(s.id);
            setName(s.name);
            setPhone(s.phone);
            setSelectedClass(s.classGrade || 'Class 4');
            setBoard(s.board?.includes('CBSE') ? 'CBSE Board' : 'RBSE (Rajasthan Board)');
            setMedium(s.medium || 'HINDI');
            setCity(s.city || '');
            setIsSubscribed(Boolean(s.isSubscribed));
            setDoubtsAsked(s.doubtsAsked || 0);
            setCreatedAt(s.createdAt || '');
            // Update storage with freshest copy
            localStorage.setItem('student_user', JSON.stringify(s));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } catch (e) {
      setLoading(false);
    }
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Student name cannot be empty.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('New password must be at least 4 characters or digits.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          name: name.trim(),
          classGrade: selectedClass,
          board: board.includes('CBSE') ? 'CBSE' : 'RBSE',
          medium,
          city: city.trim(),
          password: newPassword ? newPassword.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to update profile.');
        setSaving(false);
        return;
      }

      setSuccess('Profile updated successfully in database!');
      setNewPassword('');
      setConfirmPassword('');
      // Update local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('student_user', JSON.stringify(data.student));
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Server error while saving profile. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('student_user');
    }
    router.push('/login');
  };

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase() || 'ST';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/30 text-slate-800 font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/tutor"
              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Classroom</span>
            </Link>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
            <Link href="/" className="font-extrabold text-sm text-slate-800 hidden sm:inline">
              AI Tuition App
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tutor"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Classroom</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all text-xs font-bold flex items-center gap-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-100 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-indigo-600 to-emerald-500" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              {getInitials(name)}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
                  {selectedClass}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Student Account • Registered Mobile: <span className="font-bold text-slate-700">+91 {phone}</span>
              </p>

              {/* Quick stats banner */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span><strong>Board:</strong> {board.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span><strong>Medium:</strong> {medium === 'HINDI' ? 'Hindi Medium' : 'English Medium'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span><strong>Doubts Solved:</strong> {doubtsAsked}</span>
                </div>
                {createdAt && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Member since {new Date(createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section 1: Academic & Personal Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Personal & Academic Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Keshav Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900"
                />
              </div>

              {/* Mobile Phone (Read-Only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Mobile Number (Login ID)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled
                    value={`+91 ${phone}`}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    VERIFIED
                  </span>
                </div>
              </div>

              {/* Board */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Education Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>RBSE (Rajasthan Board)</option>
                  <option>CBSE Board</option>
                </select>
              </div>

              {/* Medium */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Medium of Instruction</label>
                <select
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HINDI">Hindi Medium (हिन्दी)</option>
                  <option value="ENGLISH">English Medium</option>
                </select>
              </div>

              {/* City / District */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  City / District
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Alwar, Jaipur, Delhi"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Class Grade Buttons */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Current Class / Grade
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {CLASSES.map((cls) => {
                  const isSelected = selectedClass === cls || selectedClass === `कक्षा ${cls.split(' ')[1]}` || selectedClass === `${cls}th`;
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
          </div>

          {/* Section 2: Security & Password */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Change Password / 4-Digit PIN</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Leave blank if you do not wish to change your existing password or PIN.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password / PIN
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new 4-digit PIN or password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password / PIN
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password to confirm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href="/tutor"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition-all"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
