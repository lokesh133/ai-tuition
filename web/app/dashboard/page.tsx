'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  Mic,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Calendar,
  Layers,
  ChevronRight,
  Zap,
  Target,
  Brain,
  MessageSquare,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import { StudentLearningProfile, DailyStudyAction } from '@/lib/learning-brain/types';
import MistakeDetectiveModal from '@/components/learning-brain/MistakeDetectiveModal';
import AdaptivePracticeWidget from '@/components/learning-brain/AdaptivePracticeWidget';

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<StudentLearningProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'practice' | 'mastery'>('today');

  // Mistake Detective Modal trigger
  const [detectiveOpen, setDetectiveOpen] = useState(false);
  const [sampleDiagnostic, setSampleDiagnostic] = useState<any>(null);

  // Active Practice Session
  const [practiceQuestion, setPracticeQuestion] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      let studentId = 'guest_student';
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('student_user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            if (u.id || u.phone) studentId = u.phone || u.id;
          } catch {}
        }
      }

      const res = await fetch(`/api/learning-brain/profile?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      }
    } catch (e) {
      console.error('Error loading dashboard profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchScanDiagnostic = () => {
    // Launch Mistake Detective with a verified diagnostic slice
    setSampleDiagnostic({
      success: true,
      detectedSubject: 'math',
      conceptKey: 'math_c2_subtraction_borrow',
      conceptTitle: 'Subtraction with Borrowing (घटाव और हासिल)',
      questionText: 'School Homework: 402 - 178 = ?',
      expectedFinalAnswer: '224',
      studentFinalAnswer: '334',
      workingSteps: [
        { stepNumber: 1, rawText: '402 - 178', isCorrect: true },
        { stepNumber: 2, rawText: '2 - 8 nahi ho sakta, 0 se borrow lena hai', isCorrect: true },
        {
          stepNumber: 3,
          rawText: 'Wrote 12 - 8 = 4, but forgot to decrease 40 to 39 in tens column',
          isCorrect: false,
          errorComment: 'Zero se borrow lene ke baad सैकड़ा (hundreds) column ko 4 se 3 karna bhool gaye.',
        },
        { stepNumber: 4, rawText: 'Answer written: 334 instead of 224', isCorrect: false },
      ],
      earliestWrongStepIndex: 2,
      mistakeType: 'CONCEPTUAL',
      isCorrect: false,
      whyMistakeOccurred:
        'Jab beech me 0 hota hai, toh pehle सैकड़े (400) se borrow hokar 10 banta hai aur fir 9 bachta hai. Yahan student ne 4 ko reduce nahi kiya.',
      teacherEncouragement:
        'Sharma Sir: "Beta yeh galti bohot se bachhe karte hain! Jab bhi beech me 0 aaye, toh use 9 likha karo aur pehle wale number ko 1 kam kiya karo."',
      progressiveHints: {
        level1Socratic: 'Agar 400 me se 1 borrow le liya, toh सैकड़े ke paas kitna bachega?',
        level2RuleFormula: 'Zero borrow rule: 402 = 300 + 90 + 12. Ab 178 minus karein.',
        level3FullStepSolution: 'Correct steps: 12 - 8 = 4, 9 - 7 = 2, 3 - 1 = 2 => Answer 224.',
      },
      remediationQuestion: {
        questionId: 'rem-sub-1',
        questionText: 'Ab is sawaal ko khud bina dekhe solve karein: 503 - 247 = ?',
        options: ['356', '256', '266', '366'],
        correctAnswer: '256',
        explanation: '503 me borrow lene par: 13 - 7 = 6, 9 - 4 = 5, 4 - 2 = 2. Sahi Answer = 256.',
      },
    });
    setDetectiveOpen(true);
  };

  const handleStartAdaptivePractice = async () => {
    setActiveTab('practice');
    try {
      const res = await fetch(`/api/learning-brain/practice?subjectId=math&chapterNumber=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.session?.questions?.[0]) {
          setPracticeQuestion(data.session.questions[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching adaptive practice:', e);
    }
  };

  const studentName = profile?.studentName || 'Student';
  const studyStreak = profile?.stats.studyStreakDays || 1;
  const planActions = profile?.todayStudyPlan || [];
  const weakConcepts = profile?.weakConcepts || [];
  const revisionItems = profile?.revisionSchedule || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              AI
            </span>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              AI Tuition <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold ml-1">Learning Brain</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-xs font-black shadow-sm">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{studyStreak} Day Streak</span>
            </div>

            <Link
              href="/reports"
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Parent Report
            </Link>

            <Link
              href="/tutor"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              Open AI Classroom
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {/* Welcome & Next Best Action Hero Banner */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden shadow-xl mb-6">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Class {profile?.classGrade || '4th'} • {profile?.board || 'RBSE'} Board
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
              Namaste, {studentName}! 👋
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed mb-6">
              Sharma Sir aur Neha Mam ne aapka aaj ka personalized plan taiyar kiya hai. Chaliye shuru karte hain!
            </p>

            {/* Quick Action Grid */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLaunchScanDiagnostic}
                className="py-3 px-5 rounded-2xl bg-white text-indigo-950 font-extrabold text-xs sm:text-sm shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                Scan Homework (Mistake Check)
              </button>
              <button
                type="button"
                onClick={handleStartAdaptivePractice}
                className="py-3 px-5 rounded-2xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm border border-indigo-500/40 shadow-sm transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                Practice Weak Topic (Math)
              </button>
              <Link
                href="/tutor"
                className="py-3 px-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
                Voice Ask AI Teacher
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            Today's Learning Plan
          </button>
          <button
            type="button"
            onClick={handleStartAdaptivePractice}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'practice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Brain className="w-4 h-4" />
            Adaptive Practice Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mastery')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'mastery'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            Subject Mastery & Weak Areas
          </button>
        </div>

        {/* TAB 1: TODAY'S STUDY PLAN */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left 2 Cols: Action List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  Prathmik Padhai Target (Top Recommended Actions)
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {planActions.length} Actions
                </span>
              </div>

              {planActions.map((action, idx) => (
                <div
                  key={action.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                        action.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {action.type === 'REVISION' ? '🔄' : action.type === 'PRACTICE_WEAK' ? '🎯' : '📖'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            action.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                          }`}
                        >
                          {action.priority}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          ⏱️ ~{action.estimatedMinutes} mins
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {action.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      action.type === 'PRACTICE_WEAK' && action.title.includes('Scan')
                        ? handleLaunchScanDiagnostic
                        : handleStartAdaptivePractice
                    }
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Start Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Right Col: Teacher Memory & Sunday Test Reminder */}
            <div className="space-y-6">
              {/* Teacher Memory Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-slate-900/80 rounded-3xl p-6 border border-amber-200/80 dark:border-amber-900/40 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">👨‍🏫</div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Sharma Sir's Memory Note
                    </h4>
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      Based on actual recent attempts
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {weakConcepts.length > 0
                    ? `Beta, "${weakConcepts[0].conceptTitle}" me borrowing rule ko yaad rakhna. Aaj humne aapke liye 2 guided sawaal rakhe hain!`
                    : 'Aapki arithmetic calculation bohot achhi chal rahi hai! Bas regular revision banaye rakhein.'}
                </p>
              </div>

              {/* Sunday Test Series Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
                    Aagami Pariksha
                  </span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Sunday Comprehensive Test
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                  Is hafte padhe gaye saare chapters ka 25-marks ka printable test paper taiyar hai.
                </p>
                <Link
                  href="/test-series"
                  className="w-full py-2.5 rounded-xl border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Printable Test Dekhein
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADAPTIVE PRACTICE ENGINE */}
        {activeTab === 'practice' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {practiceQuestion ? (
              <AdaptivePracticeWidget
                question={practiceQuestion}
                studentId={profile?.studentId}
                onAnswerSubmitted={(isCorrect) => {
                  loadProfile(); // Refresh live mastery points!
                }}
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">
                  Loading calibrated questions from master curriculum...
                </p>
                <button
                  type="button"
                  onClick={handleStartAdaptivePractice}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Reload Practice Questions
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBJECT MASTERY & WEAK CONCEPTS */}
        {activeTab === 'mastery' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Active Weak Concepts Diagnostic List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Diagnosed Weak Concepts & Repeated Mistakes
                </h3>
              </div>

              {weakConcepts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weakConcepts.map((weak, idx) => (
                    <div
                      key={weak.id || idx}
                      className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-amber-900 dark:text-amber-300">
                          {weak.conceptTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase">
                          {weak.mistakeType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                        {weak.misconception}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Occurrences: {weak.occurrences}x</span>
                        <button
                          type="button"
                          onClick={handleStartAdaptivePractice}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Remediate Now →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Koi active weak concept nahi hai! Shabaash, aapka concept mastery strong hai.
                </p>
              )}
            </div>

            {/* Spaced Repetition Due List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Spaced Repetition Schedule (Scientific Revision)
                </h3>
              </div>

              {revisionItems.length > 0 ? (
                <div className="space-y-3">
                  {revisionItems.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {rev.conceptTitle}
                        </h4>
                        <span className="text-xs text-slate-500">
                          Leitner Box {rev.boxLevel} • Due: {rev.nextDueDate}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          rev.isOverdue
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {rev.isOverdue ? 'Due Today' : 'Scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Aapki sabhi revisions up to date hain!
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mistake Detective Modal */}
      <MistakeDetectiveModal
        isOpen={detectiveOpen}
        onClose={() => setDetectiveOpen(false)}
        diagnostic={sampleDiagnostic}
        studentId={profile?.studentId}
        onRemediationCompleted={(isCorrect) => {
          loadProfile(); // Live evidence-based refresh!
        }}
      />
    </div>
  );
}
