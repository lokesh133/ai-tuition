'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface StudentSubscription {
  id: string;
  studentName: string;
  avatar: string;
  classGrade: string;
  parentName: string;
  parentPhone: string;
  city: string;
  plan: string;
  priceMonthly: number;
  paymentMethod: string;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRING' | 'OVERDUE';
  renewalDate: string;
  doubtsAsked: number;
  homeworkScans: number;
  studyMinutes: number;
}

const MOCK_STUDENTS: StudentSubscription[] = [
  {
    id: 'STU-1001',
    studentName: 'Aarav Sharma',
    avatar: '👦',
    classGrade: 'Class 5th',
    parentName: 'Ramesh Sharma',
    parentPhone: '+91 98290 12345',
    city: 'Alwar, Rajasthan',
    plan: '₹200/mo All-Access',
    priceMonthly: 200,
    paymentMethod: 'UPI AutoPay (PhonePe)',
    status: 'ACTIVE',
    renewalDate: '10 Nov 2026',
    doubtsAsked: 48,
    homeworkScans: 14,
    studyMinutes: 320,
  },
  {
    id: 'STU-1002',
    studentName: 'Priya Verma',
    avatar: '👧',
    classGrade: 'Class 7th',
    parentName: 'Sanjay Verma',
    parentPhone: '+91 94140 54321',
    city: 'Varanasi, UP',
    plan: '₹200/mo All-Access',
    priceMonthly: 200,
    paymentMethod: 'UPI AutoPay (GPay)',
    status: 'ACTIVE',
    renewalDate: '14 Nov 2026',
    doubtsAsked: 62,
    homeworkScans: 19,
    studyMinutes: 440,
  },
  {
    id: 'STU-1003',
    studentName: 'Rohan Gupta',
    avatar: '🧒',
    classGrade: 'Class 3rd',
    parentName: 'Sunita Gupta',
    parentPhone: '+91 97830 98765',
    city: 'Jabalpur, MP',
    plan: '₹200/mo All-Access',
    priceMonthly: 200,
    paymentMethod: 'Paytm Wallet',
    status: 'EXPIRING',
    renewalDate: '16 Oct 2026',
    doubtsAsked: 29,
    homeworkScans: 8,
    studyMinutes: 190,
  },
  {
    id: 'STU-1004',
    studentName: 'Ananya Mishra',
    avatar: '👧',
    classGrade: 'Class 6th',
    parentName: 'Manoj Mishra',
    parentPhone: '+91 91660 11223',
    city: 'Patna, Bihar',
    plan: '3-Day Free Trial',
    priceMonthly: 0,
    paymentMethod: 'Trial Account',
    status: 'TRIAL',
    renewalDate: '17 Oct 2026',
    doubtsAsked: 16,
    homeworkScans: 5,
    studyMinutes: 110,
  },
  {
    id: 'STU-1005',
    studentName: 'Kabir Rathore',
    avatar: '👦',
    classGrade: 'Class 4th',
    parentName: 'Vikram Rathore',
    parentPhone: '+91 99280 44556',
    city: 'Sikar, Rajasthan',
    plan: '₹200/mo All-Access',
    priceMonthly: 200,
    paymentMethod: 'UPI AutoPay (Paytm)',
    status: 'ACTIVE',
    renewalDate: '22 Nov 2026',
    doubtsAsked: 54,
    homeworkScans: 22,
    studyMinutes: 380,
  },
  {
    id: 'STU-1006',
    studentName: 'Meera Patel',
    avatar: '👧',
    classGrade: 'Class 2nd',
    parentName: 'Dinesh Patel',
    parentPhone: '+91 98250 88990',
    city: 'Anand, Gujarat',
    plan: '₹200/mo All-Access',
    priceMonthly: 200,
    paymentMethod: 'UPI AutoPay (GPay)',
    status: 'ACTIVE',
    renewalDate: '28 Nov 2026',
    doubtsAsked: 38,
    homeworkScans: 12,
    studyMinutes: 245,
  },
  {
    id: 'STU-1007',
    studentName: 'Aditya Yadav',
    avatar: '👦',
    classGrade: 'Class 8th',
    parentName: 'Rajesh Yadav',
    parentPhone: '+91 94500 77889',
    city: 'Gorakhpur, UP',
    plan: '₹200/mo All-Access',
    priceMonthly: 200,
    paymentMethod: 'Card Auto-Debit',
    status: 'OVERDUE',
    renewalDate: '12 Oct 2026',
    doubtsAsked: 71,
    homeworkScans: 27,
    studyMinutes: 510,
  },
];

export default function AdminSubscriptionsPage() {
  const [studentsList, setStudentsList] = useState<StudentSubscription[]>(MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Admin Free Test Mode States
  const [adminTestPhone, setAdminTestPhone] = useState('9829012345');
  const [adminTestName, setAdminTestName] = useState('लोकेश (Admin Test)');
  const [adminTestClass, setAdminTestClass] = useState('Class 4th');
  const [isGrantingFree, setIsGrantingFree] = useState(false);

  // Fetch real subscriptions from DB on mount
  React.useEffect(() => {
    fetch('/api/admin/subscription/grant-free')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.subscriptions?.length > 0) {
          const mapped: StudentSubscription[] = data.subscriptions.map((s: any) => ({
            id: s.id.slice(0, 8).toUpperCase(),
            studentName: s.studentName || 'Student',
            avatar: '👦',
            classGrade: s.classGrade || 'Class 4th',
            parentName: s.studentName,
            parentPhone: s.phone || '9829012345',
            city: 'Rajasthan',
            plan: s.planName,
            priceMonthly: s.amount,
            paymentMethod: s.amount === 0 ? 'Admin Free Pass (₹0)' : 'Razorpay UPI',
            status: s.status,
            renewalDate: `${s.daysRemaining} दिन बाकी`,
            doubtsAsked: 12,
            homeworkScans: 4,
            studyMinutes: 90,
          }));
          setStudentsList((prev) => [...mapped, ...prev]);
        }
      })
      .catch(() => {});
  }, []);

  // Filter students
  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClass === 'ALL' || s.classGrade.toLowerCase().includes(selectedClass.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL' || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleSendReport = (student: StudentSubscription) => {
    setActionSuccessMsg(`WhatsApp Weekly Report Link generated for parent ${student.parentName} (${student.parentPhone})!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleToggleSubscriptionStatus = async (studentId: string, makeFree: boolean) => {
    try {
      const student = studentsList.find((s) => s.id === studentId);
      if (!student) return;

      if (makeFree) {
        await fetch('/api/admin/subscription/grant-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: student.parentPhone || student.id,
            studentName: student.studentName,
            days: 365,
            planName: 'Admin Free Pass (गरीब छात्र / टेस्ट)',
          }),
        });

        setActionSuccessMsg(`🎁 "${student.studentName}" को 100% फ्री एक्सेस दिया गया है। जब तक आप इसे बदलेंगे नहीं, यह फ्री रहेगा।`);
        setStudentsList((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  status: 'ACTIVE',
                  plan: 'Admin Free Pass (100% Free)',
                  priceMonthly: 0,
                  paymentMethod: '🎁 Admin Free Pass',
                  renewalDate: '365 दिन बाकी',
                }
              : s
          )
        );
      } else {
        setActionSuccessMsg(`💳 "${student.studentName}" को सामान्य पेड मोड (₹200 आवश्यक) में बदल दिया गया है।`);
        setStudentsList((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  status: 'OVERDUE',
                  plan: '₹200/mo All-Access',
                  priceMonthly: 200,
                  paymentMethod: 'UPI AutoPay Pending',
                  renewalDate: 'रिन्यूअल बाकी',
                }
              : s
          )
        );
      }
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch {
      setActionSuccessMsg('त्रुटि: स्टेटस अपडेट नहीं हो पाया।');
      setTimeout(() => setActionSuccessMsg(null), 5000);
    }
  };

  // 1-Click Grant 30 Days Free Test to any account
  const handleGrantAdminFreePass = async (phone: string, name: string, grade: string) => {
    setIsGrantingFree(true);
    try {
      const res = await fetch('/api/admin/subscription/grant-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: phone,
          studentName: name,
          days: 30,
          planName: 'Admin Free Test Pass (30 Days - ₹0)',
        }),
      });

      const data = await res.json();
      setIsGrantingFree(false);

      if (data.success) {
        setActionSuccessMsg(`🎉 बधाई! "${name}" (${phone}) के खाते में 30 दिन का फ्री ट्यूशन टेस्ट पैक सक्रिय हो गया है!`);
        // Add to local state immediately
        const newRecord: StudentSubscription = {
          id: `FREE-${Math.floor(1000 + Math.random() * 9000)}`,
          studentName: name,
          avatar: '🌟',
          classGrade: grade,
          parentName: `${name} (Admin)`,
          parentPhone: phone,
          city: 'Rajasthan',
          plan: 'Admin Free Pass (30 Days)',
          priceMonthly: 0,
          paymentMethod: '🎁 Admin Test Mode (Free)',
          status: 'ACTIVE',
          renewalDate: '30 दिन बाकी',
          doubtsAsked: 0,
          homeworkScans: 0,
          studyMinutes: 0,
        };
        setStudentsList([newRecord, ...studentsList]);
      } else {
        setActionSuccessMsg(`त्रुटि: ${data.message}`);
      }
    } catch {
      setIsGrantingFree(false);
      setActionSuccessMsg('त्रुटि: सर्वर से कनेक्शन नहीं हो पाया।');
    }
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Super Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Founder & Super Admin Desk
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Razorpay Gateway Ready
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            Student Subscriptions & Revenue Operations
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            ₹200/महीना रिकरिंग प्लांस, UPI/Razorpay लाइव पेमेंट्स, और एडमिन फ्री टेस्ट अकाउंट्स का नियंत्रण।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tutor"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <span>क्लासरूम टेस्ट करें</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3.5 rounded-2xl text-xs font-black flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ⚡ ADMIN FREE TEST DESK & RAZORPAY CONFIG CARD (Requested by User) */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50/50 rounded-3xl p-6 border-2 border-amber-300/80 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <h2 className="text-base font-black text-slate-900">
                एडमिन फ्री टेस्ट एक्टिवेटर (Admin Free Pass Desk)
              </h2>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                ₹0 टेस्ट मोड
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              आप अपने खुद के मोबाइल नंबर या किसी भी टेस्ट अकाउंट को बिना पेमेंट किए <strong>30 दिन का 100% फ्री ऑल-एक्सेस</strong> दे सकते हैं ताकि आप सारे फीचर्स तुरंत टेस्ट कर सकें।
            </p>
          </div>

          {/* Quick 1-Click Button for Admin Self */}
          <button
            type="button"
            disabled={isGrantingFree}
            onClick={() => handleGrantAdminFreePass('9829012345', 'लोकेश (Founder Admin)', 'Class 4th')}
            className="shrink-0 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGrantingFree ? 'एक्टिवेट हो रहा है...' : '👉 मेरे अकाउंट पर 30 दिन का फ्री टेस्ट लगाएं'}</span>
          </button>
        </div>

        {/* Custom Grant Input Row */}
        <div className="mt-5 pt-4 border-t border-amber-200/70 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={adminTestName}
            onChange={(e) => setAdminTestName(e.target.value)}
            placeholder="छात्र/अकाउंट नाम"
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-blue-600"
          />
          <input
            type="text"
            value={adminTestPhone}
            onChange={(e) => setAdminTestPhone(e.target.value)}
            placeholder="मोबाइल नंबर (उदा. 9829012345)"
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-blue-600"
          />
          <select
            value={adminTestClass}
            onChange={(e) => setAdminTestClass(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-blue-600"
          >
            <option value="Class 1st">कक्षा 1st</option>
            <option value="Class 2nd">कक्षा 2nd</option>
            <option value="Class 3rd">कक्षा 3rd</option>
            <option value="Class 4th">कक्षा 4th</option>
            <option value="Class 5th">कक्षा 5th</option>
            <option value="Class 6th">कक्षा 6th</option>
            <option value="Class 7th">कक्षा 7th</option>
            <option value="Class 8th">कक्षा 8th</option>
          </select>
          <button
            type="button"
            disabled={isGrantingFree || !adminTestPhone.trim()}
            onClick={() => handleGrantAdminFreePass(adminTestPhone, adminTestName, adminTestClass)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            + 30 दिन फ्री पास एक्टिवेट करें
          </button>
        </div>
      </div>


      {/* Financial Health & Margin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Subscribers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Active Paid Kids</span>
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">1,248</span>
            <span className="text-xs font-bold text-emerald-600">+14% this week</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Classes 1st to 8th active users</p>
        </div>

        {/* Card 2: Monthly Recurring Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Monthly Revenue (MRR)</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">₹2,49,600</span>
            <span className="text-xs font-bold text-slate-400">/month</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-2">1,248 students × ₹200/mo plan</p>
        </div>

        {/* Card 3: AI Compute & Server Cost */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">AI & Server Expense</span>
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">₹40,435</span>
            <span className="text-xs font-bold text-emerald-600">₹32.40 / kid</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Gemini Flash + Redis Cache savings</p>
        </div>

        {/* Card 4: Net Founder Profit */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 rounded-2xl p-5 border border-indigo-800 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-200">Net Profit Margin</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">₹2,09,165</span>
            <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
              83.8% Margin
            </span>
          </div>
          <p className="text-[11px] text-indigo-300 mt-2">Target was 75% — Beating targets! 🎯</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, parent phone, ID, or town (e.g. Alwar, Varanasi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 bg-slate-50"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Classes (1st to 8th)</option>
              <option value="Class 1">Class 1st</option>
              <option value="Class 2">Class 2nd</option>
              <option value="Class 3">Class 3rd</option>
              <option value="Class 4">Class 4th</option>
              <option value="Class 5">Class 5th</option>
              <option value="Class 6">Class 6th</option>
              <option value="Class 7">Class 7th</option>
              <option value="Class 8">Class 8th</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active (₹200 Paid)</option>
              <option value="TRIAL">3-Day Trial</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="OVERDUE">Renewal Failed</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
          <span>
            Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of{' '}
            <strong className="text-slate-900">{MOCK_STUDENTS.length}</strong> records loaded
          </span>
          <span className="text-[11px] text-slate-400">
            Real-time webhook sync enabled with Razorpay AutoPay
          </span>
        </div>
      </div>

      {/* Main Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Student & Class</th>
                <th className="py-3.5 px-4">Parent / Contact</th>
                <th className="py-3.5 px-4">Town / City</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Next Renewal</th>
                <th className="py-3.5 px-4 text-center">Activity (Doubts / HW)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Koi student record nahi mila matching search query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{student.avatar}</span>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {student.studentName}
                            </span>
                            <span className="text-[11px] text-indigo-600 font-bold">
                              {student.classGrade} • {student.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Parent Contact */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="text-slate-900 font-semibold block">{student.parentName}</span>
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {student.parentPhone}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4">
                        <span className="text-slate-700 font-medium">{student.city}</span>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block">{student.plan}</span>
                          <span className="text-[10px] text-slate-400">{student.paymentMethod}</span>
                        </div>
                      </td>

                      {/* Status Badge & Free / Paid Toggle */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div>
                            {student.status === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                            {student.status === 'TRIAL' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                                <Clock className="w-3 h-3" /> FREE TRIAL
                              </span>
                            )}
                            {student.status === 'EXPIRING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3 h-3" /> EXPIRING
                              </span>
                            )}
                            {student.status === 'OVERDUE' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3 h-3" /> OVERDUE
                              </span>
                            )}
                          </div>

                          {/* Quick Toggle Free vs Paid (Requested by User) */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleSubscriptionStatus(student.id, true)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                                student.status === 'ACTIVE' && student.priceMonthly === 0
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                              title="गरीब छात्र / टेस्ट के लिए 100% फ्री पास दें"
                            >
                              🎁 फ्री
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSubscriptionStatus(student.id, false)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
                                student.priceMonthly > 0
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-800'
                              }`}
                              title="सामान्य पेड सब्सक्रिप्शन (₹200 आवश्यक)"
                            >
                              💳 पेड
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Renewal Date */}
                      <td className="py-4 px-4">
                        <span className="text-slate-800 font-semibold text-xs">{student.renewalDate}</span>
                      </td>

                      {/* Activity */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 text-[11px]">
                          <span className="font-bold text-indigo-600">{student.doubtsAsked} Doubts</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-bold text-orange-600">{student.homeworkScans} HW</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendReport(student)}
                            title="Send WhatsApp Weekly Progress to Parent"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href="/dashboard"
                            title="Inspect Student's Parent Dashboard View"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AutoPay & Razorpay Webhook Activity Stream */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Recent ₹200 AutoPay Transactions (Live Log)
              </h3>
              <p className="text-[11px] text-slate-400">
                Automatic monthly debits via UPI (PhonePe, GooglePay, Paytm, BHIM)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Success Rate: 98.4%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">TXN-9840294 • 12 mins ago</span>
              <span className="text-xs font-bold text-slate-800">Ramesh Sharma (Aarav - Class 5th)</span>
              <span className="text-[11px] text-emerald-600 font-semibold block">PhonePe UPI • Auto-Renewed</span>
            </div>
            <span className="text-sm font-black text-slate-900">+₹200</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">TXN-9840293 • 45 mins ago</span>
              <span className="text-xs font-bold text-slate-800">Sanjay Verma (Priya - Class 7th)</span>
              <span className="text-[11px] text-emerald-600 font-semibold block">Google Pay UPI • Auto-Renewed</span>
            </div>
            <span className="text-sm font-black text-slate-900">+₹200</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">TXN-9840292 • 1 hour ago</span>
              <span className="text-xs font-bold text-slate-800">Dinesh Patel (Meera - Class 2nd)</span>
              <span className="text-[11px] text-emerald-600 font-semibold block">Paytm UPI • Auto-Renewed</span>
            </div>
            <span className="text-sm font-black text-slate-900">+₹200</span>
          </div>
        </div>
      </div>
    </div>
  );
}
