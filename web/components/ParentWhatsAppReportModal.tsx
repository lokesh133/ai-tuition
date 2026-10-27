'use client';

import React from 'react';
import {
  X,
  Share2,
  CheckCircle2,
  AlertCircle,
  Award,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Printer,
  Heart,
  TrendingUp,
} from 'lucide-react';

interface ParentReportProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  className?: string;
  board?: string;
  teacherName?: string;
  subjectName?: string;
  score?: number;
  totalQuestions?: number;
  topicsCovered?: string[];
  mistakesFixed?: number;
  studyMinutes?: number;
}

export default function ParentWhatsAppReportModal({
  isOpen,
  onClose,
  studentName = 'Student',
  className = 'Class 4th',
  board = 'RBSE',
  teacherName = 'शर्मा सर',
  subjectName = 'सामान्य अध्ययन (General Studies)',
  score = 9,
  totalQuestions = 10,
  topicsCovered = [
    'दैनिक अभ्यास व प्रश्नोत्तरी (Daily Practice & Problem Solving)',
    'व्हाइटबोर्ड स्टेप-बाय-स्टेप हल (Step-by-step Whiteboard Concept)',
  ],
  mistakesFixed = 2,
  studyMinutes = 25,
}: ParentReportProps) {
  if (!isOpen) return null;

  const todayDate = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const percentage = Math.round((score / Math.max(1, totalQuestions)) * 100);

  // Generate WhatsApp Message Text
  const waText = encodeURIComponent(
    `🎓 *दैनिक ट्यूशन प्रगति रिपोर्ट कार्ड (Daily Tuition Report)*\n\n` +
      `👤 *छात्र का नाम:* ${studentName}\n` +
      `🏫 *कक्षा व बोर्ड:* ${className} (${board})\n` +
      `📅 *तारीख:* ${todayDate}\n` +
      `⏱️ *अध्ययन समय:* ${studyMinutes} मिनट\n` +
      `👨‍🏫 *मार्गदर्शक शिक्षक:* ${teacherName}\n` +
      `📚 *विषय:* ${subjectName}\n\n` +
      `⭐ *आज का स्कोर:* ${score}/${totalQuestions} अंक (${percentage}% - A+ ग्रेड)\n` +
      `✅ *सुधारी गई गलतियाँ:* ${mistakesFixed} गलतियों को व्हाइटबोर्ड पर सही किया गया\n\n` +
      `📖 *आज सीखे गए मुख्य अध्याय:*\n` +
      topicsCovered.map((t) => `• ${t}`).join('\n') +
      `\n\n💬 *शिक्षक की टिप्पणी:*\n` +
      `"शाबाश! बच्चे ने आज बहुत ध्यान से पढ़ाई की और हासिल वाले जोड़ में बहुत अच्छा सुधार दिखाया है। ऑफ़लाइन ट्यूशन से बेहतर सीख रहा है!"\n\n` +
      `🚀 *AI Tuition India - No Offline Tuition Needed!*`
  );

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative my-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              📱
            </div>
            <div>
              <h3 className="text-sm font-black text-white">दैनिक प्रगति रिपोर्ट कार्ड</h3>
              <p className="text-[10px] text-emerald-300 font-medium">पेरेंट्स के लिए प्रमाणित रिपोर्ट</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Card Body */}
        <div className="p-6 space-y-4 text-slate-200">
          {/* Student Profile Ribbon */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                विद्यार्थी का नाम
              </span>
              <h4 className="text-base font-black text-white">{studentName}</h4>
              <p className="text-xs text-indigo-300 font-semibold mt-0.5">
                {className} • {board} Board • {subjectName}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                {todayDate}
              </span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 mt-1 inline-block">
                उपस्थिति: उपस्थित ✅
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
              <div className="text-xl font-black text-amber-400 font-mono">
                {score}/{totalQuestions}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">आज का स्कोर ({percentage}%)</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
              <div className="text-xl font-black text-emerald-400 font-mono">
                {mistakesFixed}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">गलतियाँ सुधारीं</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
              <div className="text-xl font-black text-indigo-400 font-mono">
                {studyMinutes}m
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">अध्ययन समय</span>
            </div>
          </div>

          {/* Topics Covered */}
          <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/80 space-y-2">
            <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              आज सीखे गए मुख्य अध्याय व नियम:
            </span>
            <div className="space-y-1.5 pl-1">
              {topicsCovered.map((topic, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher's Voice Note */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 p-4 rounded-2xl border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">👨‍🏫</span>
              <span className="text-xs font-black text-indigo-300">{teacherName} की व्यक्तिगत टिप्पणी:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic font-medium">
              "शाबाश! {studentName} ने आज बहुत अनुशासन से ट्यूशन ली और {subjectName} में बहुत अच्छा प्रयास किया। घर पर 10 मिनट अभ्यास ज़रूर करवाएं!"
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform hover:scale-[1.02]"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp पर शेयर करें (1-Click)</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
