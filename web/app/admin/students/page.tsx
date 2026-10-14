'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

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
    studentName: 'Aarav Sharma',
    avatar: '👦',
    classGrade: 'Class 5th',
    city: 'Alwar',
    subject: 'Science',
    teacherId: 'neha_mam',
    teacherName: 'Neha Mam',
    question: 'Neha Mam, Photosynthesis kya hota hai simple words me samjhao?',
    aiResponseSnippet: 'Beta, jaise aapki mummy kitchen me khana banati hain, waise hi paudhe sooraj ki roshni aur paani se apna khana banate hain!',
    cached: true,
    timestamp: 'Just now',
  },
  {
    id: 'DBT-9420',
    studentName: 'Priya Verma',
    avatar: '👧',
    classGrade: 'Class 7th',
    city: 'Varanasi',
    subject: 'Math',
    teacherId: 'sharma_sir',
    teacherName: 'Sharma Sir',
    question: 'Linear equation 2x + 5 = 15 me pehle 5 minus karenge ya 2 divide?',
    aiResponseSnippet: 'Shabash beta! Hamesha pehle addition/subtraction wala number dusri side le jaate hain. 15 me se 5 ghatao, kya aaya?',
    cached: false,
    timestamp: '2 mins ago',
  },
  {
    id: 'DBT-9419',
    studentName: 'Rohan Gupta',
    avatar: '🧒',
    classGrade: 'Class 3rd',
    city: 'Jabalpur',
    subject: 'English',
    teacherId: 'riya_didi',
    teacherName: 'Riya Didi',
    question: 'Didi, "went" aur "gone" me kya antar hota hai?',
    aiResponseSnippet: '"Went" simple past hai jaise "I went to school". "Gone" hamesha has/have ke saath lagta hai jaise "He has gone".',
    cached: true,
    timestamp: '5 mins ago',
  },
  {
    id: 'DBT-9418',
    studentName: 'Kabir Rathore',
    avatar: '👦',
    classGrade: 'Class 4th',
    city: 'Sikar',
    subject: 'SST',
    teacherId: 'kabir_sir',
    teacherName: 'Kabir Sir',
    question: 'Kabir Sir, humare solar system me sabse garmi wala grah konsa hai?',
    aiResponseSnippet: 'Zyadatar log Mercury sochte hain, par sachme Venus sabse garam hai kyunki uske paas moti carbon dioxide ki chadar hai!',
    cached: true,
    timestamp: '8 mins ago',
  },
  {
    id: 'DBT-9417',
    studentName: 'Meera Patel',
    avatar: '👧',
    classGrade: 'Class 2nd',
    city: 'Anand',
    subject: 'Hindi',
    teacherId: 'pooja_mam',
    teacherName: 'Pooja Mam',
    question: 'Mam, "Sangya" ke kitne bhed hote hain?',
    aiResponseSnippet: 'Beta, aamtaur par sangya ke 3 mukhya bhed hote hain: Vyakti-vachak, Jati-vachak, aur Bhaav-vachak.',
    cached: true,
    timestamp: '11 mins ago',
  },
  {
    id: 'DBT-9416',
    studentName: 'Aditya Yadav',
    avatar: '👦',
    classGrade: 'Class 8th',
    city: 'Gorakhpur',
    subject: 'Math',
    teacherId: 'sharma_sir',
    teacherName: 'Sharma Sir',
    question: 'Sharma Sir, Pythagorean triplet check karne ka formula kya hai?',
    aiResponseSnippet: 'Beta, agar 2m, m²-1 aur m²+1 ka pair dekhein, toh (a)² + (b)² = (c)² satisfy hona chahiye. Check karo 6, 8, 10!',
    cached: false,
    timestamp: '14 mins ago',
  },
];

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');

  const filteredDoubts = MOCK_DOUBTS.filter((d) => {
    const matchesSearch =
      d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.question.toLowerCase().includes(search.toLowerCase()) ||
      d.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase());

    const matchesSubject = filterSubject === 'ALL' || d.subject.toLowerCase() === filterSubject.toLowerCase();

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-sky-400 bg-sky-500/20 px-3 py-1 rounded-full border border-sky-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Live Doubt Stream & Analytics
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Redis Cache Hit Rate: 68.4%
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            Student Doubt Activity & Learning Signals
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Bache kis subject me sabse zyada sawaal pooch rahe hain aur AI Teachers unhe kaise Socratic step-by-step guidance de rahe hain.
          </p>
        </div>

        <Link
          href="/admin/subscriptions"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <span>View Subscriptions & Payments</span>
          <Users className="w-4 h-4" />
        </Link>
      </div>

      {/* Teacher Question Distribution Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <span className="text-2xl block mb-1">📐</span>
          <span className="text-xs font-bold text-slate-900 block">Sharma Sir</span>
          <span className="text-[11px] text-slate-400">Mathematics</span>
          <div className="mt-2 text-lg font-black text-indigo-600">4,820 Doubts</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <span className="text-2xl block mb-1">🔬</span>
          <span className="text-xs font-bold text-slate-900 block">Neha Mam</span>
          <span className="text-[11px] text-slate-400">Science & EVS</span>
          <div className="mt-2 text-lg font-black text-sky-600">3,940 Doubts</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <span className="text-2xl block mb-1">📚</span>
          <span className="text-xs font-bold text-slate-900 block">Riya Didi</span>
          <span className="text-[11px] text-slate-400">English Grammar</span>
          <div className="mt-2 text-lg font-black text-pink-600">2,410 Doubts</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <span className="text-2xl block mb-1">🌍</span>
          <span className="text-xs font-bold text-slate-900 block">Kabir Sir</span>
          <span className="text-[11px] text-slate-400">Social Studies</span>
          <div className="mt-2 text-lg font-black text-purple-600">1,830 Doubts</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
          <span className="text-2xl block mb-1">✍️</span>
          <span className="text-xs font-bold text-slate-900 block">Pooja Mam</span>
          <span className="text-[11px] text-slate-400">Hindi Vyakaran</span>
          <div className="mt-2 text-lg font-black text-emerald-600">1,220 Doubts</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions, student names, cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
        >
          <option value="ALL">All Subjects</option>
          <option value="Math">Mathematics</option>
          <option value="Science">Science & EVS</option>
          <option value="English">English</option>
          <option value="SST">Social Studies</option>
          <option value="Hindi">Hindi</option>
        </select>
      </div>

      {/* Live Stream List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-Time Student Queries (Live Feed)
          </h3>
          <span className="text-xs text-slate-400">Auto-refreshing stream</span>
        </div>

        {filteredDoubts.map((doubt) => (
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
                    Asked <strong className="text-slate-700">{doubt.teacherName}</strong> • {doubt.subject}
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

            {/* Question */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-800 font-semibold">
              <span className="text-slate-400 mr-1.5 font-bold">Q:</span>
              "{doubt.question}"
            </div>

            {/* AI Teacher Answer */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
              <span className="text-indigo-600 mr-1.5 font-bold">{doubt.teacherName}:</span>
              {doubt.aiResponseSnippet}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
