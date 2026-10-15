'use client';

import React, { useState } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Share2,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ExamPreparationCenterProps {
  board: 'RBSE' | 'CBSE';
  className: string;
  subject: string;
  onStartExam: (examType: 'half_yearly' | 'annual') => void;
}

export default function ExamPreparationCenter({
  board,
  className,
  subject,
  onStartExam,
}: ExamPreparationCenterProps) {
  const [selectedExam, setSelectedExam] = useState<'half_yearly' | 'annual'>('half_yearly');

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> मिशन 100% परीक्षा तैयारी
            </span>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full">
              {board} {className}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            अर्धवार्षिक और वार्षिक मुख्य परीक्षा केंद्र
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            स्कूल के असली पेपर पैटर्न पर आधारित मॉक टेस्ट और रिज़ल्ट कार्ड
          </p>
        </div>

        {/* Exam Type Toggle */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setSelectedExam('half_yearly')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedExam === 'half_yearly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            अर्धवार्षिक (Half-Yearly)
          </button>
          <button
            onClick={() => setSelectedExam('annual')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedExam === 'annual'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            वार्षिक मुख्य (Annual Main)
          </button>
        </div>
      </div>

      {/* Blueprint Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase mb-1">
            <BookOpen className="w-4 h-4" />
            <span>सिलेबस कवरेज</span>
          </div>
          <div className="text-lg font-black text-white">
            {selectedExam === 'half_yearly' ? 'Chapter 1 से 7' : 'पूरे 14 Chapters'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedExam === 'half_yearly'
              ? 'पहले 7 मुख्य अध्यायों का गहन अभ्यास'
              : 'पूरी पाठ्यपुस्तक से महत्वपूर्ण प्रश्न'}
          </p>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase mb-1">
            <Clock className="w-4 h-4" />
            <span>समय और अंक</span>
          </div>
          <div className="text-lg font-black text-white">
            {selectedExam === 'half_yearly' ? '40 मिनट | 30 अंक' : '60 मिनट | 50 अंक'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            MCQs + रिक्त स्थान + स्टेप-बाय-स्टेप हल
          </p>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>अभिभावक रिपोर्ट</span>
          </div>
          <div className="text-lg font-black text-white">
            Instant WhatsApp Card
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            कमज़ोर टॉपिक की पहचान और सुधार टिप्स
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 p-5 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-sm text-white">
            क्या आप आज का {selectedExam === 'half_yearly' ? 'अर्धवार्षिक' : 'वार्षिक'} मॉक टेस्ट देने के लिए तैयार हैं?
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            शर्मा सर आपके हर प्रश्न की जांच करेंगे और कॉपी चेक करके नंबर देंगे।
          </p>
        </div>

        <button
          onClick={() => onStartExam(selectedExam)}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 whitespace-nowrap"
        >
          <span>मॉक टेस्ट शुरू करें (Start Test)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
