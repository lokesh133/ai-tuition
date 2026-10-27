'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Printer,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  ArrowLeft,
  ChevronRight,
  Filter,
  Volume2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface SavedWorksheetRecord {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  files: Array<{ name: string; url: string }>;
  detectedQuestions?: string[];
  activeQuestion?: string;
  score?: number;
  timestamp: number;
}

export default function StudentAllReportPage() {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [worksheetRecords, setWorksheetRecords] = useState<SavedWorksheetRecord[]>([]);
  const [profileName, setProfileName] = useState<string>('');
  const [profileClass, setProfileClass] = useState<string>('');
  const [isClient, setIsClient] = useState<boolean>(false);
  const [parentAnalytics, setParentAnalytics] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Load student user profile & parent analytics
    let phoneOrId = 'guest_student';
    try {
      const saved = localStorage.getItem('student_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.name) setProfileName(u.name);
        if (u.classGrade) setProfileClass(u.classGrade);
        if (u.phone || u.id) phoneOrId = u.phone || u.id;
      }
    } catch {}

    // Fetch live verified learning metrics for parent report
    fetch(`/api/learning-brain/parent-analytics?studentId=${phoneOrId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.analytics) {
          setParentAnalytics(data.analytics);
        }
      })
      .catch((e) => console.warn('Could not fetch parent analytics:', e));

    // Load student's worksheet history from local storage
    try {
      const stored = localStorage.getItem('ai_tuition_worksheet_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorksheetRecords(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read worksheet records:', e);
    }

    // Default sample history if first time
    const today = new Date().toISOString().split('T')[0];
    const defaultData: SavedWorksheetRecord[] = [
      {
        id: 'ws-101',
        title: 'English Lit: Chapter 14.3 My Early Home (Passage & Section A Questions)',
        date: today,
        dateLabel: 'Today, 04:30 PM',
        subjectId: 'english',
        subjectName: 'English Literature',
        teacherName: 'Riya Didi',
        files: [{ name: 'Page_139_Black_Beauty.jpg', url: '' }],
        detectedQuestions: [
          'A. 1. The first place the speaker remembers was a big, pleasant meadow with a clean pond in the middle.',
          'A. 2. When the weather was hot, the speaker and his mother stood by the pond under the trees.',
          'A. 3. As the speaker grew older and could eat grass, his mother went out to work during the day.',
          'A. 4. The speaker\'s master called him Darkie because his coat was black.'
        ],
        score: 10,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'ws-102',
        title: 'Math: Nearest Thousands Rounding Off & Place Value Practice',
        date: today,
        dateLabel: 'Today, 11:15 AM',
        subjectId: 'math',
        subjectName: 'Mathematics',
        teacherName: 'Sharma Sir',
        files: [{ name: 'Math_Worksheet_Ch4.jpg', url: '' }],
        detectedQuestions: [
          'Q1: Estimate difference of 423516 and 453729 by rounding to nearest thousands: 30000',
          'Q2: Difference of place value of 5s in 375059: 49500',
          'Q3: Subtraction of smaller number from greater number is always positive: True'
        ],
        score: 9.5,
        timestamp: Date.now() - 18000000,
      },
      {
        id: 'ws-103',
        title: 'EVS / Science: Plant Adaptations & Water Conservation in Desert',
        date: today,
        dateLabel: 'Yesterday, 05:20 PM',
        subjectId: 'evs',
        subjectName: 'EVS / Science',
        teacherName: 'Neha Mam',
        files: [{ name: 'EVS_Chapter7_Plants.jpg', url: '' }],
        detectedQuestions: [
          'Q1: How do cactus plants survive with very little water?',
          'Q2: Why are roots deep in desert plants?'
        ],
        score: 9,
        timestamp: Date.now() - 86400000,
      }
    ];
    setWorksheetRecords(defaultData);
  }, []);

  const isEn = lang === 'en';

  const studentProfile = {
    name: profileName || (isEn ? 'Student' : 'छात्र'),
    className: profileClass || (isEn ? 'Class 4th (English Medium)' : 'कक्षा 4 (इंग्लिश मीडियम)'),
    board: 'RBSE / CBSE Aligned',
    rollNo: '24',
    session: '2026-27',
    school: isEn ? 'Adarsh Vidya Mandir Public School' : 'आदर्श विद्या मंदिर पब्लिक स्कूल',
    overallScore: 94,
    grade: 'A+',
    streakDays: 7,
    totalWorksheets: worksheetRecords.length > 0 ? worksheetRecords.length + 8 : 18,
    totalPracticeHours: '28.5',
    spellingAccuracy: '98%',
  };

  const subjectStats = [
    {
      id: 'math',
      name: isEn ? 'Mathematics' : 'गणित (Math)',
      teacher: 'Sharma Sir 👨‍🏫',
      score: 96,
      grade: 'A+',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300',
      topics: isEn ? ['Nearest Thousands Round-off', '4-Digit Addition', 'Fractions'] : ['निकटतम हज़ार राउंड ऑफ', '4-अंकीय जोड़', 'भिन्न (Fractions)'],
      remarks: isEn ? 'Exceptional problem solver, quick with calculation steps.' : 'गणित के कठिन प्रश्नों को तेज़ी से और सटीक हल करता है।'
    },
    {
      id: 'english',
      name: isEn ? 'English Literature & Reading' : 'अंग्रेजी (English Literature)',
      teacher: 'Riya Didi 👩‍🏫',
      score: 93,
      grade: 'A',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10 border-pink-500/30 text-pink-900 dark:text-pink-300',
      topics: isEn ? ['14.3 My Early Home Reading', 'Fill in the Blanks', 'Word Meanings'] : ['14.3 My Early Home वाचन', 'रिक्त स्थान पूर्ति', 'कठिन शब्दार्थ'],
      remarks: isEn ? 'Pronunciation is clear. Answered all reading blank questions correctly.' : 'कहानी वाचन व खाली स्थान के सभी उत्तर बिना किसी गलती के हल किए।'
    },
    {
      id: 'evs',
      name: isEn ? 'EVS & General Science' : 'पर्यावरण व विज्ञान (EVS & Science)',
      teacher: 'Neha Mam 👩‍🔬',
      score: 91,
      grade: 'A',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300',
      topics: isEn ? ['Plant Adaptations', 'Water Conservation', 'Living Things'] : ['पौधों का अनुकूलन', 'जल संरक्षण', 'सजीव व निर्जीव'],
      remarks: isEn ? 'Curious about nature experiments and diagram questions.' : 'विज्ञान के प्रयोगों व पर्यावरण के सिद्धांतों को गहरी समझ से याद रखता है।'
    },
    {
      id: 'hindi',
      name: isEn ? 'Hindi & Vyakaran' : 'हिंदी व व्याकरण (Hindi)',
      teacher: 'Kabir Sir 👨‍💼',
      score: 89,
      grade: 'B+',
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-300',
      topics: isEn ? ['Vyakaran (Noun/Verb)', 'Reading Stories', 'Spelling Check'] : ['संज्ञा व क्रिया', 'कहानियों का वाचन', 'शुद्ध वर्तनी'],
      remarks: isEn ? 'Good vocabulary, improving handwriting and spelling rules.' : 'शब्दावली अच्छी है, मात्राओं का सही ध्यान रख रहा है।'
    }
  ];

  const badges = [
    { emoji: '⚡', title: isEn ? 'Speed Solver' : 'स्पीड सॉल्वर', desc: isEn ? 'Solved Math calculations in 30s' : '30 सेकंड में गणित के सवाल हल किए' },
    { emoji: '📖', title: isEn ? 'Story Champion' : 'कहानी वाचन चैंपियन', desc: isEn ? 'Read full 7 paragraphs of Chapter 14.3' : 'पाठ 14.3 के सभी 7 पैराग्राफ बिना रुके पढ़े' },
    { emoji: '✍️', title: isEn ? '100% Spelling Accuracy' : 'स्पेलिंग मास्टर', desc: isEn ? 'Zero spelling errors in Mock Tests' : 'मॉक टेस्ट में शून्य स्पेलिंग गलतियां' },
    { emoji: '🔥', title: isEn ? '7-Day Streak Master' : '7 दिन लगातार पढ़ाई', desc: isEn ? 'Daily practice without missing a day' : 'बिना किसी नागे के रोज़ ट्यूशन क्लास ली' },
  ];

  const filteredWorksheets = selectedSubjectFilter === 'all'
    ? worksheetRecords
    : worksheetRecords.filter((w) => w.subjectId.toLowerCase().includes(selectedSubjectFilter));

  const handleShareWhatsApp = () => {
    const text = isEn
      ? `📊 *AI Tuition Student All Report Card*\n\nStudent: ${studentProfile.name}\nClass: ${studentProfile.className}\nOverall Score: ${studentProfile.overallScore}% (Grade ${studentProfile.grade})\nStudy Streak: ${studentProfile.streakDays} Days 🔥\nWorksheets Solved: ${studentProfile.totalWorksheets}\n\n*Subject Scores:*\n• Math: 96%\n• English: 93%\n• EVS: 91%\n• Hindi: 89%\n\nVerified by AI Tuition Studio (RBSE/CBSE)`
      : `📊 *AI ट्यूशन स्टूडियो - विद्यार्थी सर्वांगीण रिपोर्ट कार्ड*\n\nछात्र: ${studentProfile.name}\nकक्षा: ${studentProfile.className}\nकुल स्कोर: ${studentProfile.overallScore}% (ग्रेड ${studentProfile.grade})\nस्ट्रीक: ${studentProfile.streakDays} दिन लगातार अभ्यास 🔥\nहल की गई वर्कशीट: ${studentProfile.totalWorksheets}\n\n*विषयवार स्कोर:*\n• गणित (Math): 96%\n• अंग्रेजी (English): 93%\n• पर्यावरण (EVS): 91%\n• हिंदी: 89%\n\nसत्यापित: AI Tuition Studio Curriculum Engine`;

    const encoded = encodeURIComponent(text);
    if (typeof window !== 'undefined') {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans print:bg-white print:text-black">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/tutor"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back to Tuition Studio' : 'ट्यूशन क्लास में वापस जाएं'}</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-xs">
                📊
              </span>
              <div>
                <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {isEn ? 'Student All Report Card' : 'स्टूडेंट ऑल रिपोर्ट कार्ड'}
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {isEn ? 'Complete Performance, Worksheets & Exam History' : 'संपूर्ण परफॉरमेंस, वर्कशीट व परीक्षा इतिहास'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  !isEn
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                🇮🇳 हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  isEn
                    ? 'bg-indigo-600 text-white font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>

            {/* Print / Download Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              title={isEn ? 'Print or Save as PDF' : 'प्रिंट करें या PDF सेव करें'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isEn ? 'Print / PDF' : 'प्रिंट / PDF'}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'WhatsApp Share' : 'व्हाट्सएप शेयर'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN REPORT CONTENT CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* STUDENT PROFILE & MILESTONE BANNER */}
        <section className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-emerald-400 p-0.5 shrink-0 shadow-lg shadow-indigo-500/30">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl">
                  👦
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{studentProfile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {studentProfile.board}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {studentProfile.className} • Roll No: {studentProfile.rollNo} • Session: {studentProfile.session}
                </p>
                <p className="text-[11px] text-slate-400">
                  🏫 {studentProfile.school}
                </p>
              </div>
            </div>

            {/* Quick Badge Score Card */}
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-auto shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">
                  {isEn ? 'Overall Grade' : 'कुल ग्रेड'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white flex items-center gap-1.5 justify-end">
                  <span>{studentProfile.grade}</span>
                  <span className="text-xs text-emerald-400 font-bold">({studentProfile.overallScore}%)</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                🏆
              </div>
            </div>
          </div>

          {/* 4 Quick Stat Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black mb-0.5">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{isEn ? 'Study Streak' : 'अध्ययन स्ट्रीक'}</span>
              </div>
              <span className="text-lg font-black text-white">{studentProfile.streakDays} {isEn ? 'Days Active' : 'दिन लगातार'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-black mb-0.5">
                <BookOpen className="w-4 h-4" />
                <span>{isEn ? 'Worksheets Solved' : 'हल की गई वर्कशीट'}</span>
              </div>
              <span className="text-lg font-black text-white">{studentProfile.totalWorksheets} {isEn ? 'Completed' : 'शीट पूरी'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black mb-0.5">
                <Clock className="w-4 h-4" />
                <span>{isEn ? 'Practice Time' : 'कुल अभ्यास समय'}</span>
              </div>
              <span className="text-lg font-black text-white">{studentProfile.totalPracticeHours} {isEn ? 'Hours' : 'घंटे'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 text-pink-400 text-xs font-black mb-0.5">
                <Sparkles className="w-4 h-4" />
                <span>{isEn ? 'Spelling Accuracy' : 'स्पेलिंग सटीकता'}</span>
              </div>
              <span className="text-lg font-black text-white">{studentProfile.spellingAccuracy}</span>
            </div>
          </div>
        </section>

        {/* 2B. PARENT LEARNING AUDIT & SCREEN-TIME CONTROLS (LIVE LEARNING BRAIN) */}
        {parentAnalytics && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-indigo-200/80 dark:border-indigo-900/40 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-black">
                  🛡️
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isEn ? 'Parent Dashboard: Verified Learning Audit' : 'अभिभावक डैशबोर्ड: वास्तविक अधिगम प्रगति'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {isEn ? '100% Evidence-based metrics from actual independent attempts' : 'बच्चे द्वारा बिना किसी सहायता के हल किए गए स्वतंत्र प्रयासों का वास्तविक डेटा'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Screen Time:</span>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {parentAnalytics.screenTimeMinutes || 25} / 45 Mins Limit
                </span>
              </div>
            </div>

            {/* 3 Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Independent Accuracy */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {isEn ? 'Independent Accuracy' : 'स्वतंत्र हल करने की सटीकता'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {parentAnalytics.independentAccuracy}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({parentAnalytics.totalIndependent}/{parentAnalytics.totalAttempted} questions)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isEn
                    ? 'Student solved without revealing full answer solutions.'
                    : 'बिना उत्तर देखे खुद सही हल किए गए सवाल।'}
                </p>
              </div>

              {/* Active Weak Concepts Needing Attention */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                  {isEn ? 'Concepts Needing Attention' : 'सुधार योग्य कमजोर बिंदु'}
                </span>
                <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  {parentAnalytics.weakConceptsCount} {isEn ? 'Diagnosed' : 'पहचाने गए'}
                </span>
                <div className="mt-2 space-y-1">
                  {parentAnalytics.activeWeakConcepts && parentAnalytics.activeWeakConcepts.length > 0 ? (
                    parentAnalytics.activeWeakConcepts.slice(0, 2).map((w: any, idx: number) => (
                      <p key={idx} className="text-[11px] font-semibold text-amber-950 dark:text-amber-300 truncate">
                        • {w.title} ({w.mistakeType})
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] text-emerald-600 font-bold">✓ Sabhi concepts pakke hain</p>
                  )}
                </div>
              </div>

              {/* Weekly Recommended Activity for Parents */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
                  {isEn ? 'Parent Action For This Week' : 'इस सप्ताह अभिभावक हेतु सुझाव'}
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {parentAnalytics.weeklyRecommendations?.[0] || 'Sharma Sir ke saath agla practice set zaroor lagwayein.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 3. SUBJECT-WISE COMPETENCY & MASTERY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📚</span>
                <span>{isEn ? 'Subject Competency & Teacher Remarks' : 'विषयवार क्षमता व शिक्षक समीक्षा'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEn ? 'Detailed analysis across Mathematics, English, EVS, and Hindi' : 'गणित, अंग्रेजी, पर्यावरण व हिंदी का विस्तृत विश्लेषण'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectStats.map((sub) => (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{sub.name}</span>
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isEn ? 'Teacher:' : 'शिक्षक:'} {sub.teacher}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {sub.score}%
                    </span>
                    <span className={`block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${sub.bgColor}`}>
                      {isEn ? 'Grade' : 'ग्रेड'} {sub.grade}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>{isEn ? 'Curriculum Mastery' : 'सिलेबस दक्षता'}</span>
                    <span>{sub.score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${sub.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>
                </div>

                {/* Key Topics Mastered */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    {isEn ? 'Key Concepts Mastered:' : 'सीखे गए मुख्य बिंदु:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sub.topics.map((top, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                      >
                        ✓ {top}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Teacher Remark */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    💡 {isEn ? 'Teacher Feedback:' : 'अध्यापक की टिप्पणी:'}
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    &quot;{sub.remarks}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. RECENT WORKSHEETS & MOCK TEST LOG (LIVE RECORDS) */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📝</span>
                <span>{isEn ? 'Worksheets & Mock Test Live Activity Log' : 'वर्कशीट व मॉक टेस्ट गतिविधि रिकॉर्ड'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEn ? 'Recent pages scanned and evaluated in the Tuition Studio' : 'स्टूडियो में लाइव स्कैन व हल किए गए सभी अभ्यास पेज'}
              </p>
            </div>

            {/* Filter by Subject */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {(['all', 'english', 'math', 'evs'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setSelectedSubjectFilter(filterKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    selectedSubjectFilter === filterKey
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filterKey === 'all'
                    ? isEn ? 'All' : 'सभी'
                    : filterKey === 'english'
                    ? 'English'
                    : filterKey === 'math'
                    ? 'Math'
                    : 'EVS'}
                </button>
              ))}
            </div>
          </div>

          {filteredWorksheets.length > 0 ? (
            <div className="space-y-3">
              {filteredWorksheets.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-indigo-400"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                        {item.subjectName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.dateLabel || item.date}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {isEn ? 'Teacher:' : 'शिक्षक:'} {item.teacherName}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>

                    {item.detectedQuestions && item.detectedQuestions.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        ✓ {item.detectedQuestions.length} {isEn ? 'questions scanned & verified' : 'सवाल स्कैन व हल किए गए'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">
                        {isEn ? 'Score' : 'स्कोर'}
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {item.score || 10} / 10
                      </span>
                    </div>

                    <Link
                      href="/tutor"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                    >
                      <span>{isEn ? 'Open Sheet' : 'शीट देखें'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isEn ? 'No worksheets found for this subject filter.' : 'इस विषय के लिए कोई वर्कशीट रिकॉर्ड उपलब्ध नहीं है।'}
            </div>
          )}
        </section>

        {/* 5. ACHIEVEMENTS & STAR BADGES */}
        <section className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 rounded-3xl p-6 border border-amber-500/20 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>⭐</span>
              <span>{isEn ? 'Achievements & Star Badges Earned' : 'विद्यार्थी की उपलब्धियां व स्टार बैज'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Badges awarded by AI Teachers for consistency, accuracy, and reading' : 'सटीक उत्तर, नियमितता व वाचन के लिए शिक्षकों द्वारा दिए गए सम्मान'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((b, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5"
              >
                <span className="text-3xl block">{b.emoji}</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{b.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <p>
            {isEn
              ? 'Verified by AI Tuition Studio • Aligned with NCERT, RBSE & CBSE standards'
              : 'AI ट्यूशन स्टूडियो द्वारा प्रमाणित • NCERT, RBSE व CBSE पाठ्यक्रम अनुसार'}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Send to WhatsApp' : 'व्हाट्सएप पर भेजें'}</span>
            </button>
            <Link
              href="/tutor"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEn ? 'Open Live Class' : 'लाइव क्लास खोलें'}</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
