'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  BookOpen,
  Filter,
  BarChart2,
  TrendingUp,
  UserCheck,
  RefreshCw,
  Phone,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface StudentAccount {
  id: string;
  name: string;
  phone: string;
  classGrade: string;
  board: string;
  medium: string;
  city: string;
  isSubscribed: boolean;
  doubtsAsked: number;
  createdAt: string;
}

interface DoubtLog {
  id: string;
  studentName: string;
  avatar: string;
  classGrade: string;
  city: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  question: string;
  aiResponseSnippet: string;
  cached: boolean;
  timestamp: string;
}

const MOCK_DOUBTS: DoubtLog[] = [
  {
    id: 'DBT-9421',
    studentName: 'आरव शर्मा (Aarav)',
    avatar: '👦',
    classGrade: 'Class 5th',
    city: 'Alwar',
    subject: 'Science',
    teacherId: 'neha_mam',
    teacherName: 'नेहा मैम',
    question: 'नेहा मैम, Photosynthesis क्या होता है आसान शब्दों में समझाओ?',
    aiResponseSnippet: 'बेटा, जैसे आपकी मम्मी किचन में खाना बनाती हैं, वैसे ही पौधे सूरज की रोशनी और पानी से अपना खाना बनाते हैं!',
    cached: true,
    timestamp: 'अभी-अभी',
  },
  {
    id: 'DBT-9420',
    studentName: 'प्रिया वर्मा (Priya)',
    avatar: '👧',
    classGrade: 'Class 7th',
    city: 'Jaipur',
    subject: 'Math',
    teacherId: 'sharma_sir',
    teacherName: 'शर्मा सर',
    question: 'Linear equation 2x + 5 = 15 में पहले 5 घटाएंगे या 2 से भाग देंगे?',
    aiResponseSnippet: 'शाबाश बेटा! हमेशा पहले जोड़/घटाव वाली संख्या को दूसरी तरफ ले जाते हैं। 15 में से 5 घटाओ, क्या आया?',
    cached: false,
    timestamp: '2 मिनट पहले',
  },
  {
    id: 'DBT-9419',
    studentName: 'रोहन गुप्ता',
    avatar: '🧒',
    classGrade: 'Class 3rd',
    city: 'Dausa',
    subject: 'English',
    teacherId: 'riya_didi',
    teacherName: 'रिया दीदी',
    question: 'दीदी, "went" और "gone" में क्या अंतर होता है?',
    aiResponseSnippet: '"Went" simple past है जैसे "I went to school". "Gone" हमेशा has/have के साथ लगता है जैसे "He has gone".',
    cached: true,
    timestamp: '5 मिनट पहले',
  },
];

export default function AdminStudentsPage() {
  const [activeTab, setActiveTab] = useState<'REGISTERED_STUDENTS' | 'DOUBT_STREAM'>(
    'REGISTERED_STUDENTS'
  );
  const [registeredStudents, setRegisteredStudents] = useState<StudentAccount[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      if (data.success) {
        setRegisteredStudents(data.students);
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleToggleStudentAccess = async (studentId: string, makeFree: boolean) => {
    setUpdatingStudentId(studentId);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, isFree: makeFree }),
      });
      const data = await res.json();
      setUpdatingStudentId(null);
      if (data.success) {
        setActionMsg(data.message);
        setRegisteredStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, isSubscribed: makeFree } : s))
        );
        setTimeout(() => setActionMsg(null), 5000);
      } else {
        setActionMsg(`त्रुटि: ${data.message}`);
        setTimeout(() => setActionMsg(null), 5000);
      }
    } catch {
      setUpdatingStudentId(null);
      setActionMsg('सर्वर से कनेक्ट करने में त्रुटि।');
      setTimeout(() => setActionMsg(null), 5000);
    }
  };

  const filteredStudents = registeredStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'ALL' || s.classGrade.includes(filterClass);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-sky-400 bg-sky-500/20 px-3 py-1 rounded-full border border-sky-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> लाइव स्टूडेंट डेटाबेस एवं प्रश्न लॉग
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              कुल पंजीकृत छात्र: {registeredStudents.length}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            विद्यार्थी डेटा एवं लाइव डाउट स्ट्रीम
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            जब कोई विद्यार्थी वेबसाइट या मोबाइल ऐप पर साइनअप करता है, तो उसका खाता यहाँ तुरंत दिखाई देता है।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStudents}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>डेटा रिफ्रेश करें</span>
          </button>
          <Link
            href="/admin/subscriptions"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <span>सब्सक्रिप्शन देखें →</span>
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {actionMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3.5 rounded-2xl text-xs font-black flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('REGISTERED_STUDENTS')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 transition-all relative ${
            activeTab === 'REGISTERED_STUDENTS'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>पंजीकृत विद्यार्थी सूची ({registeredStudents.length})</span>
          {activeTab === 'REGISTERED_STUDENTS' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('DOUBT_STREAM')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 transition-all relative ${
            activeTab === 'DOUBT_STREAM'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>लाइव सवाल / डाउट फीड</span>
          {activeTab === 'DOUBT_STREAM' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Registered Students Table */}
      {activeTab === 'REGISTERED_STUDENTS' && (
        <div className="space-y-4">
          {/* Helper Note for Free vs Paid Access (Requested by User) */}
          <div className="bg-gradient-to-r from-amber-50 via-white to-emerald-50 rounded-2xl p-4 border border-amber-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <span className="text-slate-800 font-semibold leading-relaxed">
                <strong>एडमिन विशेष अधिकार (गरीब छात्र सहायता एवं टेस्ट एक्सेस):</strong> जब कोई छात्र रजिस्टर करे, तो आप उसके आगे <strong className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-black">🎁 100% फ्री</strong> बटन दबाकर उसे हमेशा के लिए फ्री एक्सेस दे सकते हैं। जब तक आप वापस <strong className="text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-black">💳 पेड</strong> नहीं चुनेंगे, तब तक वह बिना किसी फीस के फ्री पढ़ेगा।
              </span>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="नाम, मोबाइल नंबर, शहर से खोजें..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">सभी कक्षाएं (Class 1-8)</option>
              <option value="1">कक्षा 1</option>
              <option value="2">कक्षा 2</option>
              <option value="3">कक्षा 3</option>
              <option value="4">कक्षा 4</option>
              <option value="5">कक्षा 5</option>
              <option value="6">कक्षा 6</option>
              <option value="7">कक्षा 7</option>
              <option value="8">कक्षा 8</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loadingStudents ? (
              <div className="p-8 text-center text-xs text-slate-400">
                विद्यार्थी सूची लोड हो रही है...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">कोई छात्र नहीं मिला</p>
                <p className="text-xs text-slate-400 mt-1">
                  नए छात्र <Link href="/signup" className="text-indigo-600 underline">/signup</Link> पेज से खाता बना सकते हैं।
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-5">विद्यार्थी आईडी और नाम</th>
                      <th className="py-3 px-5">मोबाइल नंबर</th>
                      <th className="py-3 px-5">कक्षा एवं बोर्ड</th>
                      <th className="py-3 px-5">माध्यम / शहर</th>
                      <th className="py-3 px-5">एक्सेस कंट्रोल (फ्री / पेड)</th>
                      <th className="py-3 px-5">पूछे गए सवाल</th>
                      <th className="py-3 px-5">साइनअप तिथि</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                              {st.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                              <div className="text-slate-400 text-[10px] font-mono">{st.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-700 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            +91 {st.phone}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                            {st.classGrade}
                          </span>
                          <span className="ml-1.5 text-slate-500 text-[11px] font-medium">
                            ({st.board})
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-600">
                          <div>{st.medium === 'HINDI' ? 'हिन्दी माध्यम' : 'English'}</div>
                          <div className="text-[10px] text-slate-400">{st.city}</div>
                        </td>
                        <td className="py-4 px-5">
                          {/* 🎁 FREE vs 💳 PAID TOGGLE BUTTONS (Requested by User) */}
                          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              disabled={updatingStudentId === st.id}
                              onClick={() => handleToggleStudentAccess(st.id, true)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                                st.isSubscribed
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                              }`}
                              title="गरीब छात्र या खुद के टेस्ट अकाउंट के लिए 100% फ्री एक्सेस चालू करें"
                            >
                              <span>🎁 100% फ्री</span>
                            </button>
                            <button
                              type="button"
                              disabled={updatingStudentId === st.id}
                              onClick={() => handleToggleStudentAccess(st.id, false)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                                !st.isSubscribed
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                              }`}
                              title="सामान्य सब्सक्रिप्शन मोड (₹200 आवश्यक)"
                            >
                              <span>💳 पेड (₹200)</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-black text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                            {st.doubtsAsked} सवाल
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-400 text-[11px]">
                          {new Date(st.createdAt).toLocaleDateString('hi-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Live Doubt Stream */}
      {activeTab === 'DOUBT_STREAM' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {MOCK_DOUBTS.map((doubt) => (
              <div
                key={doubt.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{doubt.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{doubt.studentName}</span>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                          {doubt.classGrade}
                        </span>
                        <span className="text-[10px] text-slate-400">{doubt.city}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        शिक्षक: <strong className="text-slate-700">{doubt.teacherName}</strong> • {doubt.subject}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doubt.cached ? (
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        ⚡ Redis Cache (₹0 Cost)
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                        🤖 Gemini 1.5 Flash (₹0.003)
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium">{doubt.timestamp}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-800 font-semibold">
                  <span className="text-slate-400 mr-1.5 font-bold">Q:</span>
                  "{doubt.question}"
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
                  <span className="text-indigo-600 mr-1.5 font-bold">{doubt.teacherName}:</span>
                  {doubt.aiResponseSnippet}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
