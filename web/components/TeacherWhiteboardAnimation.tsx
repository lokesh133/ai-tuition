'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Award,
} from 'lucide-react';

export interface TeacherWhiteboardAnimationProps {
  num1: number;
  op: string; // '+', '-', '*', '/'
  num2: number;
  result: number;
  teacherName?: string;
  theme?: 'slate' | 'green' | 'white';
  onAudioPlay?: (text: string) => void;
  isAudioMuted?: boolean;
}

export const TeacherWhiteboardAnimation: React.FC<TeacherWhiteboardAnimationProps> = ({
  num1,
  op,
  num2,
  result,
  teacherName = 'Sharma Sir',
  theme = 'slate',
  onAudioPlay,
  isAudioMuted = false,
}) => {
  // Animation Stages:
  // 0: Initial Board Setup (Writing Question)
  // 1: Column Breakdown (इकाई / Units focus)
  // 2: Column Breakdown (दहाई / Tens focus)
  // 3: Visual Counting Objects / Beads
  // 4: Final Celebration & Answer Box
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(3200);

  // Breakdown for 2-digit numbers
  const u1 = num1 % 10;
  const t1 = Math.floor((num1 % 100) / 10);
  const h1 = Math.floor(num1 / 100);

  const u2 = num2 % 10;
  const t2 = Math.floor((num2 % 100) / 10);
  const h2 = Math.floor(num2 / 100);

  const ur = result % 10;
  const tr = Math.floor((result % 100) / 10);
  const hr = Math.floor(result / 100);

  const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op;
  const opLabelHindi =
    op === '+'
      ? 'जोड़ (Addition)'
      : op === '-'
      ? 'घटाव (Subtraction)'
      : op === '*'
      ? 'गुणा (Multiplication)'
      : 'भाग (Division)';

  // Speech for each stage
  const getStageSpeech = (stage: number): string => {
    if (stage === 0) {
      return `बेटा, ध्यान से देखिए! ब्लैकबोर्ड पर सवाल है: ${num1} ${op === '+' ? 'प्लस' : op === '-' ? 'माइनस' : op === '*' ? 'गुणा' : 'भाग'} ${num2}। आइए इसे चरण-दर-चरण हल करते हैं।`;
    }
    if (stage === 1) {
      if (op === '+') {
        return `पहला कदम: दाईं ओर इकाई के अंकों को जोड़ते हैं। ${u1} प्लस ${u2} बराबर ${u1 + u2} हुआ!`;
      }
      if (op === '-') {
        return `पहला कदम: इकाई के अंक घटाते हैं। ${u1} में से ${u2} गया, बचा ${u1 - u2 < 0 ? 'हासिल लेकर हल' : u1 - u2}।`;
      }
      return `पहला कदम: पहले भाग की गणना करते हैं।`;
    }
    if (stage === 2) {
      if (op === '+') {
        return `दूसरा कदम: अब बाईं ओर दहाई के अंकों को जोड़ते हैं। ${t1} प्लस ${t2} बराबर ${t1 + t2} हुआ!`;
      }
      return `दूसरा कदम: दहाई के अंकों की गणना पूरी हुई।`;
    }
    if (stage === 3) {
      return `आइए इसे मोतियों और गिनतियों से भी देखें! ${num1} और ${num2} मिलकर कुल ${result} बन गए!`;
    }
    if (stage === 4) {
      return `शाबाश बेटा! पूरा हल निकल आया है। सही उत्तर है ${result}! बहुत बढ़िया!`;
    }
    return '';
  };

  // Play audio when stage changes
  useEffect(() => {
    if (!isPlaying) return;
    const speech = getStageSpeech(currentStage);
    if (speech && onAudioPlay && !isAudioMuted) {
      onAudioPlay(speech);
    }
  }, [currentStage, isPlaying]);

  // Auto-advance stages when playing
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStage >= 4) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStage((prev) => Math.min(prev + 1, 4));
    }, speedMs);

    return () => clearTimeout(timer);
  }, [currentStage, isPlaying, speedMs]);

  const handleReplay = () => {
    setCurrentStage(0);
    setIsPlaying(true);
  };

  const handleNextStage = () => {
    if (currentStage < 4) {
      setCurrentStage((prev) => prev + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 0) {
      setCurrentStage((prev) => prev - 1);
    }
  };

  // Blackboard Themes
  const boardBg =
    theme === 'green'
      ? 'bg-[#1b3d2f] border-[#2e5944] text-[#f4edd6]'
      : theme === 'white'
      ? 'bg-slate-50 border-slate-300 text-slate-800'
      : 'bg-[#0f172a] border-slate-700 text-slate-100';

  return (
    <div className={`rounded-3xl border-4 p-5 md:p-7 shadow-2xl relative overflow-hidden transition-all duration-300 ${boardBg}`}>
      {/* Chalk / Dry-erase Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
            👨‍🏫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {teacherName} का लाइव ब्लैकबोर्ड
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                लाइव एनीमेशन
              </span>
            </div>
            <p className="text-xs font-bold opacity-80">
              विषय: {opLabelHindi} • चरण {currentStage + 1} / 5
            </p>
          </div>
        </div>

        {/* Animation Control Bar */}
        <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xs">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
            title={isPlaying ? 'रोकें (Pause)' : 'चलाएं (Play)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleReplay}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="शुरू से देखें (Replay)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleNextStage}
            disabled={currentStage >= 4}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1"
          >
            <span>अगला</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* STAGE PROGRESS BAR */}
      <div className="grid grid-cols-5 gap-1.5 py-3">
        {['1. सवाल', '2. इकाई (Ones)', '3. दहाई (Tens)', '4. मोतियों से गिनती', '5. सही उत्तर ✅'].map(
          (label, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStage(idx);
                setIsPlaying(false);
              }}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all truncate text-center ${
                currentStage === idx
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
                  : currentStage > idx
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* MAIN WHITEBOARD ANIMATION CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
        {/* LEFT / CENTER: COLUMN MATH BLACKBOARD */}
        <div className="lg:col-span-7 bg-black/40 rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-center relative min-h-[300px]">
          {/* Animated Chalk Hand / Pointer */}
          <div
            className={`absolute transition-all duration-700 ease-out z-20 pointer-events-none flex items-center gap-2 ${
              currentStage === 0
                ? 'top-4 right-8'
                : currentStage === 1
                ? 'top-[42%] right-[28%]'
                : currentStage === 2
                ? 'top-[42%] left-[28%]'
                : currentStage === 3
                ? 'bottom-6 left-8'
                : 'bottom-4 right-12'
            }`}
          >
            <div className="text-3xl animate-bounce drop-shadow-lg">👆</div>
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              {currentStage === 0
                ? 'सवाल लिखा'
                : currentStage === 1
                ? 'इकाई जोड़ें (0+0)'
                : currentStage === 2
                ? 'दहाई जोड़ें (1+1)'
                : currentStage === 3
                ? 'मोतियों से समझें'
                : 'उत्तर मिला!'}
            </span>
          </div>

          {/* Question Banner */}
          <div className="text-center mb-4">
            <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">
              बोर्ड पर लिखा सवाल
            </span>
            <div className="text-2xl md:text-3xl font-black font-mono tracking-wider text-white">
              {num1} {opSymbol} {num2} = ?
            </div>
          </div>

          {/* Formal Column Addition / Math Structure */}
          <div className="font-mono bg-black/50 p-6 rounded-2xl border-2 border-white/20 shadow-2xl inline-block text-xl md:text-2xl font-bold min-w-[220px]">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-3 text-center pb-2 border-b border-white/20 text-xs md:text-sm font-black">
              <span className="text-slate-400">चिह्न</span>
              <span
                className={`transition-all rounded-md px-1 ${
                  currentStage === 2
                    ? 'bg-amber-500/30 text-amber-300 font-extrabold ring-2 ring-amber-400 animate-pulse'
                    : 'text-slate-400'
                }`}
              >
                दहाई (T)
              </span>
              <span
                className={`transition-all rounded-md px-1 ${
                  currentStage === 1
                    ? 'bg-emerald-500/30 text-emerald-300 font-extrabold ring-2 ring-emerald-400 animate-pulse'
                    : 'text-slate-400'
                }`}
              >
                इकाई (O)
              </span>
            </div>

            {/* Row 1: Num 1 */}
            <div className="grid grid-cols-3 gap-3 text-center py-2 text-white">
              <span className="opacity-0">•</span>
              <span className={`${currentStage >= 2 ? 'text-amber-300 font-extrabold' : ''}`}>
                {num1 >= 10 ? t1 : ''}
              </span>
              <span className={`${currentStage >= 1 ? 'text-emerald-300 font-extrabold' : ''}`}>
                {u1}
              </span>
            </div>

            {/* Row 2: Operator & Num 2 */}
            <div className="grid grid-cols-3 gap-3 text-center py-2 text-white border-b-4 border-white/70">
              <span className="text-amber-400 font-extrabold">{opSymbol}</span>
              <span className={`${currentStage >= 2 ? 'text-amber-300 font-extrabold' : ''}`}>
                {num2 >= 10 ? t2 : ''}
              </span>
              <span className={`${currentStage >= 1 ? 'text-emerald-300 font-extrabold' : ''}`}>
                {u2}
              </span>
            </div>

            {/* Row 3: Animated Calculated Result */}
            <div className="grid grid-cols-3 gap-3 text-center pt-3 font-black text-2xl md:text-3xl">
              <span className="opacity-0">•</span>

              {/* Tens result column */}
              <span
                className={`transition-all duration-500 ${
                  currentStage >= 2
                    ? 'text-amber-400 scale-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-in zoom-in'
                    : 'opacity-0'
                }`}
              >
                {result >= 10 ? tr : ''}
              </span>

              {/* Units result column */}
              <span
                className={`transition-all duration-500 ${
                  currentStage >= 1
                    ? 'text-emerald-400 scale-110 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-in zoom-in'
                    : 'opacity-0'
                }`}
              >
                {ur}
              </span>
            </div>
          </div>

          {/* Teacher Voice Subtitle at Bottom */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-md w-full">
            <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">
              🗣️ {teacherName} समझा रहे हैं:
            </span>
            <p className="text-xs md:text-sm font-semibold text-amber-100 leading-relaxed">
              {getStageSpeech(currentStage)}
            </p>
          </div>
        </div>

        {/* RIGHT: VISUAL BEADS / OBJECTS COUNTING REPRESENTATION */}
        <div className="lg:col-span-5 bg-black/30 rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                चित्रमय गिनती (Visual Beads)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {num1} + {num2} = {result}
              </span>
            </div>

            {/* Row 1 Beads */}
            <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                <span>पहला समूह ({num1}):</span>
                <span className="font-mono bg-sky-500/20 px-2 py-0.5 rounded-full">{num1} मोती</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {Array.from({ length: Math.min(num1, 20) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 border border-sky-300 shadow-sm flex items-center justify-center text-[9px] font-bold text-white transition-all animate-in zoom-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {i + 1}
                  </div>
                ))}
                {num1 > 20 && (
                  <span className="text-[10px] text-sky-300 font-bold self-center">
                    +{num1 - 20} और
                  </span>
                )}
              </div>
            </div>

            {/* Row 2 Beads */}
            <div className="mt-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span>दूसरा समूह ({num2}):</span>
                <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded-full">{num2} मोती</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {Array.from({ length: Math.min(num2, 20) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-amber-300 shadow-sm flex items-center justify-center text-[9px] font-bold text-slate-950 transition-all animate-in zoom-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {i + 1}
                  </div>
                ))}
                {num2 > 20 && (
                  <span className="text-[10px] text-amber-300 font-bold self-center">
                    +{num2 - 20} और
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FINAL CELEBRATION BOX */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all duration-500 ${
              currentStage >= 4
                ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-102'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-6 h-6 ${currentStage >= 4 ? 'text-emerald-400 animate-bounce' : 'text-slate-500'}`}
                />
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-400 block">
                    अंतिम परिणाम (Final Solution)
                  </span>
                  <div className="text-xl md:text-2xl font-black text-white">
                    {num1} {opSymbol} {num2} = <span className="text-emerald-400">{result}</span>
                  </div>
                </div>
              </div>

              {currentStage >= 4 && (
                <div className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-black shadow-md flex items-center gap-1 animate-in zoom-in">
                  <Award className="w-3.5 h-3.5" />
                  <span>सही उत्तर ✅</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherWhiteboardAnimation;
