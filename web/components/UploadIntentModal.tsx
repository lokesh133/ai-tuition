'use client';

import React from 'react';
import {
  X,
  BookOpen,
  HelpCircle,
  Sparkles,
  FileText,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Layers,
  GraduationCap,
  ListOrdered,
  FileCheck,
} from 'lucide-react';

export type UploadOptionMode = 'reading' | 'teach' | 'both' | 'check' | 'quiz';

interface UploadIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileThumbnail?: string | null;
  fileType?: string;
  totalFilesCount?: number;
  onSelectMode: (mode: UploadOptionMode) => void;
  isDarkMode?: boolean;
  language?: 'hi' | 'en';
}

export const UploadIntentModal: React.FC<UploadIntentModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileThumbnail,
  fileType,
  totalFilesCount = 1,
  onSelectMode,
  isDarkMode = false,
  language = 'hi',
}) => {
  if (!isOpen) return null;

  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn font-reader">
      <div
        className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border transition-all duration-300 max-h-[92vh] overflow-y-auto scrollbar-thin ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-indigo-500/10'
            : 'bg-white border-slate-200 text-slate-800 shadow-xl'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-full transition-all ${
            isDarkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title={isEn ? 'Close' : 'बंद करें'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title with Kid-Friendly Emoji */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 text-2xl shrink-0 font-heading">
            📸
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 font-heading">
              <span>{isEn ? 'Page Uploaded Successfully!' : 'पेज अपलोड हो गया!'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {isEn ? '100% Scanned' : '100% स्कैन सफल'}
              </span>
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isEn
                ? 'What would you like to study on this page? Choose your mode below:'
                : 'बेटा, आप इस पेज में क्या करना चाहते हैं? नीचे से अपना पसंदीदा विकल्प चुनें:'}
            </p>
          </div>
        </div>

        {/* Uploaded File Snapshot Strip */}
        <div
          className={`mt-4 mb-6 p-3 rounded-2xl flex items-center gap-3 border ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {fileThumbnail ? (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileThumbnail} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
              <FileText className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black truncate max-w-[280px]">
                {fileName || (isEn ? 'Uploaded Document' : 'अपलोड किया गया पेज')}
              </span>
              {totalFilesCount > 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold shrink-0">
                  {totalFilesCount} {isEn ? 'pages' : 'पेज'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn
                ? 'Tip: Choose "Read Lesson" for stories/poems, or "Solve Questions" for exercises!'
                : "सुझाव: अगर पेज में कहानी या पाठ है तो 'पाठ पढ़ना' चुनें, अगर अभ्यास प्रश्न हैं तो 'सवाल हल' चुनें!"}
            </p>
          </div>
        </div>

        {/* 3 Main Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          {/* Option 1: Reading Mode */}
          <button
            type="button"
            onClick={() => onSelectMode('reading')}
            className={`group text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
              isDarkMode
                ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-900'
                : 'bg-emerald-50/60 border-emerald-300/80 hover:border-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <div className="absolute top-2 right-2 text-2xl group-hover:scale-125 transition-transform duration-200">
              📖
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 mb-2">
                {isEn ? 'Story / Poem / Lesson' : 'कहानी / कविता / पाठ'}
              </span>
              <h3 className="text-base font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 font-heading">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isEn ? 'Read & Learn' : 'पाठ पढ़ना व समझना'}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                {isEn
                  ? 'Teacher reads aloud with clear phonetics, explains key vocabulary words, and shares the core moral.'
                  : 'शिक्षक पूरा पाठ शुद्ध उच्चारण से बोलकर पढ़ाएंगे, कठिन शब्दार्थ समझाएंगे और सारांश बताएंगे।'}
              </p>

              <div className="mt-3 space-y-1 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Guided Audio Reading' : 'बोलकर वाचन (Audio Reading)'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Word Meanings & Usage' : 'कठिन शब्दार्थ (Word Meanings)'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs font-black text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600">
              <span>{isEn ? 'Start Reading' : 'पाठ पढ़ाएं'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 2: Questions Only Mode */}
          <button
            type="button"
            onClick={() => onSelectMode('teach')}
            className={`group text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
              isDarkMode
                ? 'bg-slate-950/80 border-indigo-500/40 hover:border-indigo-400 hover:bg-slate-900'
                : 'bg-indigo-50/60 border-indigo-300/80 hover:border-indigo-500 hover:bg-indigo-50'
            }`}
          >
            <div className="absolute top-2 right-2 text-2xl group-hover:scale-125 transition-transform duration-200">
              ❓
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 mb-2">
                {isEn ? 'Worksheet / Questions' : 'वर्कशीट / अभ्यास'}
              </span>
              <h3 className="text-base font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 font-heading">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isEn ? 'Solve Questions' : 'सवाल हल करना'}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                {isEn
                  ? 'Extract all questions dynamically and teach Question 1 step-by-step on the whiteboard.'
                  : 'पेज के सभी अभ्यास सवाल पहचानेंगे और व्हाइटबोर्ड पर स्टेप-बाय-स्टेप हल सिखाएंगे।'}
              </p>

              <div className="mt-3 space-y-1 text-[11px] text-indigo-800 dark:text-indigo-300 font-semibold">
                <div className="flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? '1-Click Question Switcher' : 'सभी सवाल 1-क्लिक लिस्ट'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Step-by-Step Solution' : 'स्टेप-दर-स्टेप व्हाइटबोर्ड हल'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between text-xs font-black text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-600">
              <span>{isEn ? 'Solve Question 1' : 'सवाल हल कराएं'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 3: Both (Reading + Questions) */}
          <button
            type="button"
            onClick={() => onSelectMode('both')}
            className={`group text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between relative overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
              isDarkMode
                ? 'bg-slate-950/80 border-amber-500/50 hover:border-amber-400 hover:bg-slate-900 ring-2 ring-amber-500/20'
                : 'bg-amber-50/70 border-amber-300/90 hover:border-amber-500 hover:bg-amber-50 ring-2 ring-amber-400/20'
            }`}
          >
            <div className="absolute top-2 right-2 text-2xl group-hover:scale-125 transition-transform duration-200">
              🌟
            </div>
            <div>
              <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 mb-2">
                {isEn ? 'Super Combo ⭐' : 'सुपर कॉम्बो ⭐'}
              </span>
              <h3 className="text-base font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5 font-heading">
                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{isEn ? 'Both (Lesson + Questions)' : 'दोनों (पाठ + सवाल)'}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                {isEn
                  ? 'If the page contains both a story and exercise questions, teacher explains the lesson first, then solves questions.'
                  : 'अगर पेज में पाठ भी है और नीचे प्रश्न भी — शिक्षक पहले पाठ समझाएंगे और फिर सवालों का अभ्यास कराएंगे।'}
              </p>

              <div className="mt-3 space-y-1 text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Lesson Overview & Vocabulary' : 'पहले पाठ का सारांश व शब्दार्थ'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? 'Exercise Practice Solutions' : 'फिर अभ्यास प्रश्नों का हल'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-300 group-hover:text-amber-600">
              <span>{isEn ? 'Start Both ⭐' : 'दोनों शुरू करें ⭐'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Secondary Options Strip (Copy Check & Mock Test) */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-xs">
            <span>{isEn ? 'Other Options:' : 'अन्य विकल्प:'}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onSelectMode('check')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 shadow-2xs'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isEn ? '✍️ Master Answer Key' : '✍️ सभी उत्तर चेक (Answer Key)'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('quiz')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-600 shadow-2xs'
              }`}
            >
              <span>{isEn ? '🎯 Practice Quiz' : '🎯 मॉक टेस्ट (Interactive Quiz)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadIntentModal;
