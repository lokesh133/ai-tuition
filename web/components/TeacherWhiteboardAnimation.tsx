'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Award,
  HelpCircle,
  Edit3,
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
  onScoreUpdate?: (points: number) => void;
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
  onScoreUpdate,
}) => {
  // Modes:
  // 'teach': 1. शिक्षक हल करके समझाएंगे (Auto-Teach)
  // 'self': 2. मैं खुद हल करूँगा (Student Practice with Blanks)
  const [solveMode, setSolveMode] = useState<'teach' | 'self'>('teach');

  // Animation Stages (for Teach mode):
  // 0: Initial Board Setup (सवाल लिखा)
  // 1: First column calculation (इकाई)
  // 2: Second column calculation (दहाई)
  // 3: Third/Higher column calculation (सैकड़ा / हज़ार)
  // 4: Final Solution & Answer Box
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMs] = useState<number>(3200);

  // Self-solve practice state
  const [userColumnDigits, setUserColumnDigits] = useState<Record<number, string>>({});
  const [userAns, setUserAns] = useState<string>('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showBlankHint, setShowBlankHint] = useState<boolean>(false);

  // Reset all student answers, feedback, and animation whenever a new question is loaded
  useEffect(() => {
    setUserColumnDigits({});
    setUserAns('');
    setCheckStatus('idle');
    setCurrentStage(0);
    setIsPlaying(true);
    setShowBlankHint(false);
  }, [num1, op, num2, result]);

  // Dynamic Column Place Values Calculation (Supports 1-digit up to 4-digit math)
  const maxVal = Math.max(Math.abs(num1), Math.abs(num2), Math.abs(result));
  const columns: Array<{ id: string; label: string; fullLabel: string; color: string }> = [];

  if (maxVal >= 1000) {
    columns.push({ id: 'th', label: 'हज़ार (Th)', fullLabel: 'हज़ार', color: 'text-purple-300' });
  }
  if (maxVal >= 100) {
    columns.push({ id: 'h', label: 'सैकड़ा (H)', fullLabel: 'सैकड़ा', color: 'text-sky-300' });
  }
  if (maxVal >= 10) {
    columns.push({ id: 't', label: 'दहाई (T)', fullLabel: 'दहाई', color: 'text-amber-300' });
  }
  columns.push({ id: 'o', label: 'इकाई (O)', fullLabel: 'इकाई', color: 'text-emerald-300' });

  const numCols = columns.length;

  // Helper to extract aligned digits for any number (padded from the left)
  const getDigits = (n: number): string[] => {
    const s = Math.abs(n).toString();
    const arr = s.split('');
    const padded: string[] = [];
    while (padded.length + arr.length < numCols) {
      padded.push('');
    }
    return [...padded, ...arr];
  };

  const d1 = getDigits(num1);
  const d2 = getDigits(num2);
  const dr = getDigits(result);

  const isDivision = op === '/' || op === '÷';
  const opSymbol = op === '*' ? '×' : isDivision ? '÷' : op;
  const opLabelHindi =
    op === '+'
      ? 'जोड़ (Addition)'
      : op === '-'
      ? 'घटाव (Subtraction)'
      : op === '*'
      ? 'गुणा (Multiplication)'
      : 'भाग (Division)';

  // Build spoken explanations for each stage
  const getStageSpeech = (stage: number): string => {
    if (isDivision) {
      if (stage === 0) {
        return `बेटा, ध्यान से देखिए! ब्लैकबोर्ड पर भाग (Division) का ढांचा है: ${num1} भाज्य में ${num2} का भाग देना है।`;
      }
      if (stage === 1) {
        return `पहला चरण: ${num2} का पहाड़ा पढ़ेंगे और घटाकर अगला अंक नीचे उतारेंगे।`;
      }
      if (stage === 2) {
        return `दूसरा चरण: पूरा भाग देने पर भागफल ${result} आया और शेषफल ${num1 % num2} बचा!`;
      }
      if (stage >= 3) {
        return `शाबाश बेटा! भागफल = ${result} और शेषफल = ${num1 % num2}! बिल्कुल सही उत्तर है!`;
      }
      return '';
    }

    if (stage === 0) {
      return `बेटा, ध्यान से देखिए! ब्लैकबोर्ड पर सवाल है: ${num1} ${op === '+' ? 'प्लस' : op === '-' ? 'माइनस' : op === '*' ? 'गुणा' : 'भाग'} ${num2}। आइए इसे स्तंभ विधि (Column Method) से चरणबद्ध हल करते हैं।`;
    }
    if (stage === 1) {
      const u1 = d1[numCols - 1] || '0';
      const u2 = d2[numCols - 1] || '0';
      if (op === '+') {
        return `पहला चरण: सबसे पहले दाईं ओर इकाई के अंकों को जोड़ते हैं। ${u1} प्लस ${u2} बराबर ${dr[numCols - 1]} हुआ!`;
      }
      if (op === '-') {
        return `पहला चरण: इकाई के अंक घटाते हैं। ${u1} में से ${u2} घटाने पर ${dr[numCols - 1]} प्राप्त हुआ।`;
      }
      return `पहला चरण: इकाई के अंकों की गणना करते हैं।`;
    }
    if (stage === 2) {
      const t1 = d1[numCols - 2] || '0';
      const t2 = d2[numCols - 2] || '0';
      if (op === '+') {
        return `दूसरा चरण: अब दहाई के अंकों को जोड़ते हैं। ${t1} प्लस ${t2} मिलकर ${dr[numCols - 2]} बनते हैं!`;
      }
      if (op === '-') {
        if (parseInt(t1, 10) < parseInt(t2, 10)) {
          return `दूसरा चरण: दहाई में ${t1} में से ${t2} नहीं घट सकता, इसलिए हमने सैकड़ा से 1 उधार (हासिल) लिया। यह ${10 + parseInt(t1, 10)} बन गया! ${10 + parseInt(t1, 10)} में से ${t2} घटाने पर ${dr[numCols - 2]} बचा!`;
        }
        return `दूसरा चरण: दहाई के अंक घटाने पर ${dr[numCols - 2]} प्राप्त हुआ।`;
      }
      return `दूसरा चरण: दहाई के मान की गणना पूरी हुई।`;
    }
    if (stage === 3) {
      if (numCols >= 3) {
        return `तीसरा चरण: अब सैकड़ा के मान की गणना करते हैं। शेष सैकड़ा मान ${dr[numCols - 3] || '1'} आया। इस तरह कुल उत्तर ${result} प्राप्त हुआ!`;
      }
      return `आइए इसे मोतियों और गिनतियों से भी देखें! कुल परिणाम ${result} बन गया!`;
    }
    if (stage === 4) {
      return `शाबाश बेटा! पूरा हल निकल आया है। ${num1} ${op === '+' ? 'प्लस' : 'माइनस'} ${num2} बराबर ${result}! बिल्कुल सही उत्तर है!`;
    }
    return '';
  };

  // Play audio on stage transition in teach mode
  useEffect(() => {
    if (solveMode !== 'teach' || !isPlaying) return;
    const speech = getStageSpeech(currentStage);
    if (speech && onAudioPlay && !isAudioMuted) {
      onAudioPlay(speech);
    }
  }, [currentStage, isPlaying, solveMode]);

  // Auto-advance stages when playing
  useEffect(() => {
    if (solveMode !== 'teach' || !isPlaying) return;
    if (currentStage >= 4) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStage((prev) => Math.min(prev + 1, 4));
    }, speedMs);

    return () => clearTimeout(timer);
  }, [currentStage, isPlaying, speedMs, solveMode]);

  const handleReplay = () => {
    setCurrentStage(0);
    setIsPlaying(true);
  };

  const handleNextStage = () => {
    if (currentStage < 4) {
      setCurrentStage((prev) => prev + 1);
    }
  };

  // Student Self-Solve: Check and Save Answer
  const handleCheckAnswer = () => {
    let studentAnswer: number | null = null;
    if (userAns.trim() !== '') {
      studentAnswer = parseInt(userAns.trim(), 10);
    } else {
      let combined = '';
      for (let i = 0; i < numCols; i++) {
        combined += userColumnDigits[i] || '';
      }
      if (combined.trim() !== '') {
        studentAnswer = parseInt(combined.trim(), 10);
      }
    }

    if (studentAnswer === null || isNaN(studentAnswer)) {
      const msg = 'बेटा, कृपया पहले अंडरलाइन के नीचे खाली डिब्बे में अपना उत्तर लिखें!';
      if (onAudioPlay && !isAudioMuted) onAudioPlay(msg);
      return;
    }

    if (studentAnswer === result) {
      setCheckStatus('correct');
      const speech = `शाबाश बेटा! आपका उत्तर ${result} बिल्कुल सही है! आपने खुद हल करके बहुत अच्छा काम किया है!`;
      if (onAudioPlay && !isAudioMuted) onAudioPlay(speech);
      if (onScoreUpdate) onScoreUpdate(1);
    } else {
      setCheckStatus('wrong');
      const speech = `बेटा, आपका सवाल का उत्तर गलत है। दोबारा कोशिश करें (Try Again)!`;
      if (onAudioPlay && !isAudioMuted) onAudioPlay(speech);
    }
  };

  const handleTryAgain = () => {
    setCheckStatus('idle');
    setUserColumnDigits({});
    setUserAns('');
    const speech = 'कोई बात नहीं बेटा! दोबारा कोशिश करें, आप जरूर हल कर लेंगे!';
    if (onAudioPlay && !isAudioMuted) onAudioPlay(speech);
  };

  // Blackboard Themes
  const boardBg =
    theme === 'green'
      ? 'bg-[#1b3d2f] border-[#2e5944] text-[#f4edd6]'
      : theme === 'white'
      ? 'bg-slate-50 border-slate-300 text-slate-800'
      : 'bg-[#0f172a] border-slate-700 text-slate-100';

  return (
    <div className={`rounded-3xl border-4 p-4 sm:p-6 md:p-7 shadow-2xl relative overflow-hidden transition-all duration-300 ${boardBg}`}>
      {/* 1. TOP HEADER & PROMINENT MODE QUESTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
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
                {solveMode === 'teach' ? 'शिक्षक समझा रहे हैं' : 'विद्यार्थी अभ्यास मोड'}
              </span>
            </div>
            <p className="text-xs font-bold opacity-80">
              विषय: {opLabelHindi} • {num1} {opSymbol} {num2}
            </p>
          </div>
        </div>

        {/* Teach Mode Animation Controls */}
        {solveMode === 'teach' && (
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xs">
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
        )}
      </div>

      {/* 2. PROMINENT 2-CHOICE DECISION CARD (खुद करोगे या मैं करके दे दूँ?) */}
      <div className="w-full my-3 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-indigo-600/15 to-emerald-500/15 border-2 border-amber-400/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-left w-full md:w-auto">
          <span className="text-2xl sm:text-3xl">🤔</span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>आप क्या चाहते हैं: खुद से करोगे या मैं करके समझा दूँ?</span>
            </h3>
            <p className="text-[11px] text-amber-200">
              नीचे से विकल्प चुनें — शिक्षक का एनीमेशन देखें या खुद अंडरलाइन के नीचे खाली डिब्बे भरें!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              setSolveMode('teach');
              setIsPlaying(true);
              const msg = `बेटा, ध्यान से देखिए! मैं आपको ${num1} ${op === '-' ? 'माइनस' : 'प्लस'} ${num2} स्टेप-बाय-स्टेप हल करके समझाता हूँ।`;
              if (onAudioPlay && !isAudioMuted) onAudioPlay(msg);
            }}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
              solveMode === 'teach'
                ? 'bg-amber-500 text-slate-950 scale-102 ring-2 ring-amber-300'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>👨‍🏫</span>
            <span>1. मैं (शिक्षक) करके समझाता हूँ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSolveMode('self');
              setIsPlaying(false);
              setCheckStatus('idle');
              setUserColumnDigits({});
              setUserAns('');
              const msg = `बहुत बढ़िया बेटा! अब आप खुद अंडरलाइन के नीचे खाली डिब्बे में उत्तर लिखकर चेक करें!`;
              if (onAudioPlay && !isAudioMuted) onAudioPlay(msg);
            }}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
              solveMode === 'self'
                ? 'bg-emerald-600 text-white scale-102 ring-2 ring-emerald-300'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>✍️</span>
            <span>2. मैं खुद हल करूँगा</span>
          </button>
        </div>
      </div>

      {/* 3. TEACH MODE STAGES PROGRESS BAR */}
      {solveMode === 'teach' && (
        <div className="grid grid-cols-5 gap-1.5 py-2">
          {['1. सवाल', '2. इकाई (Ones)', '3. दहाई (Tens)', '4. सैकड़ा/मोती', '5. सही उत्तर ✅'].map(
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
      )}

      {/* 4. SELF-SOLVE PRACTICE BANNER */}
      {solveMode === 'self' && (
        <div className="py-2.5 px-4 my-1 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              अभ्यास मोड: अंडरलाइन के नीचे खाली डिब्बों में अंक लिखें और <strong>&quot;चेक करें व सेव करें&quot;</strong> दबाएं!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowBlankHint(!showBlankHint)}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-[11px] shrink-0 flex items-center gap-1 transition-all"
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showBlankHint ? 'हिंट छुपाएं' : '💡 हिंट'}</span>
          </button>
        </div>
      )}

      {/* 5. MAIN WHITEBOARD CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-3">
        {/* LEFT / CENTER: COLUMN MATH BLACKBOARD */}
        <div className="lg:col-span-7 bg-black/40 rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col items-center justify-center relative min-h-[320px]">
          {/* Question Banner */}
          <div className="text-center mb-3">
            <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">
              बोर्ड पर लिखा सवाल
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
              {num1} {opSymbol} {num2} = ?
            </div>
          </div>

          {/* DIVISION BRACKET (भाग का ढांचा) vs COLUMN ADD/SUB */}
          {isDivision ? (
            /* REAL LONG DIVISION BRACKET (भाग का ढांचा: Divisor ) Dividend ) */
            <div className="font-mono bg-black/60 p-6 sm:p-8 rounded-3xl border-2 border-white/20 shadow-2xl flex flex-col items-center min-w-[300px]">
              <div className="flex items-start justify-center gap-3 text-xl sm:text-2xl font-bold">
                {/* Divisor (भाजक) on the Left */}
                <div className="flex flex-col items-end pt-10">
                  <span className="text-amber-300 text-3xl sm:text-4xl font-black">
                    {num2}
                  </span>
                  <span className="text-[10px] font-sans text-slate-400 uppercase font-extrabold mt-1">
                    भाजक (Divisor)
                  </span>
                </div>

                {/* Division Bracket Box (Top horizontal line + Left vertical line) */}
                <div className="flex flex-col">
                  {/* Top: Quotient (भागफल) */}
                  <div className="pb-2.5 pl-4 min-h-[50px] flex items-center gap-2">
                    <span className="text-xs font-sans text-emerald-400 font-bold uppercase">
                      भागफल:
                    </span>
                    {solveMode === 'teach' ? (
                      <span
                        className={`text-3xl sm:text-4xl font-black text-emerald-300 tracking-wider ${
                          currentStage >= 1
                            ? 'animate-in zoom-in duration-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                            : 'opacity-0'
                        }`}
                      >
                        {result}
                      </span>
                    ) : (
                      /* Self-Solve Mode: Quotient Input Blanks Above the Division Line */
                      <div className="flex items-center gap-1.5">
                        {dr.map((_, i) => (
                          <input
                            key={i}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={userColumnDigits[i] || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              const updated = { ...userColumnDigits, [i]: val };
                              setUserColumnDigits(updated);
                              let comb = '';
                              for (let k = 0; k < dr.length; k++) {
                                comb += updated[k] || '';
                              }
                              setUserAns(comb);
                              setCheckStatus('idle');
                            }}
                            placeholder="?"
                            className={`w-10 sm:w-12 h-12 text-center rounded-xl font-black text-xl sm:text-2xl outline-none transition-all ${
                              checkStatus === 'correct'
                                ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300'
                                : checkStatus === 'wrong'
                                ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300'
                                : 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-300 focus:bg-amber-500/30 focus:border-solid focus:ring-2 focus:ring-amber-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real Division Corner Lines: Top Border + Left Border */}
                  <div className="border-t-4 border-l-4 border-white/90 rounded-tl-2xl pl-5 pr-8 pt-3 pb-4 bg-white/5 shadow-inner">
                    {/* Dividend (भाज्य) */}
                    <div className="flex items-baseline justify-between gap-6">
                      <span className="text-3xl sm:text-4xl font-black text-sky-300 tracking-widest">
                        {num1}
                      </span>
                      <span className="text-[10px] font-sans text-slate-400 uppercase font-extrabold">
                        भाज्य (Dividend)
                      </span>
                    </div>

                    {/* Step-by-Step Long Division Subtraction Steps */}
                    {solveMode === 'teach' && currentStage >= 1 && (
                      <div className="mt-3 pt-2 border-t border-dashed border-white/20 text-lg sm:text-xl text-slate-300 font-mono space-y-1">
                        <div className="text-rose-300">
                          - {num2 * (Math.floor(result / 10) > 0 ? Math.floor(result / 10) * 10 : result)}
                        </div>
                        <div className="border-b border-white/40 my-1" />
                        <div className="text-amber-300">
                          = {num1 - num2 * (Math.floor(result / 10) > 0 ? Math.floor(result / 10) * 10 : result)}
                        </div>
                        {currentStage >= 2 && (
                          <div className="pt-2 text-emerald-400 font-bold flex items-center justify-between text-sm sm:text-base">
                            <span>शेषफल (Remainder):</span>
                            <span className="text-lg">{num1 % num2} ✅</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DYNAMIC FORMAL COLUMN ADDITION / SUBTRACTION STRUCTURE */
            <div className="font-mono bg-black/50 p-5 sm:p-6 rounded-2xl border-2 border-white/20 shadow-2xl inline-block text-xl sm:text-2xl font-bold min-w-[260px]">
              {/* Header: Column Place Values (चिह्न, सैकड़ा, दहाई, इकाई) */}
              <div
                className="grid gap-2.5 sm:gap-4 text-center pb-2 border-b border-white/20 text-xs sm:text-sm font-black"
                style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
              >
                <span className="text-slate-400">चिह्न</span>
                {columns.map((c, i) => {
                  const activeColIdx = numCols - 1 - (currentStage === 1 ? 0 : currentStage === 2 ? 1 : 2);
                  const isHighlight = solveMode === 'teach' && i === activeColIdx;
                  return (
                    <span
                      key={c.id}
                      className={`transition-all rounded-md px-1 ${
                        isHighlight
                          ? 'bg-amber-500/30 text-amber-300 font-extrabold ring-2 ring-amber-400 animate-pulse'
                          : c.color
                      }`}
                    >
                      {c.label}
                    </span>
                  );
                })}
              </div>

              {/* Row 1: Number 1 Digits */}
              <div
                className="grid gap-2.5 sm:gap-4 text-center py-2 text-white"
                style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
              >
                <span className="opacity-0">•</span>
                {d1.map((dig, i) => (
                  <span
                    key={i}
                    className={`${dig ? 'font-extrabold' : ''} ${
                      columns[i]?.id === 'o' ? 'text-emerald-300' : columns[i]?.id === 't' ? 'text-amber-300' : 'text-sky-300'
                    }`}
                  >
                    {dig || ''}
                  </span>
                ))}
              </div>

              {/* Row 2: Operator & Number 2 Digits */}
              <div
                className="grid gap-2.5 sm:gap-4 text-center py-2 text-white border-b-4 border-white/80"
                style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
              >
                <span className="text-amber-400 font-extrabold">{opSymbol}</span>
                {d2.map((dig, i) => (
                  <span
                    key={i}
                    className={`${dig ? 'font-extrabold' : ''} ${
                      columns[i]?.id === 'o' ? 'text-emerald-300' : columns[i]?.id === 't' ? 'text-amber-300' : 'text-sky-300'
                    }`}
                  >
                    {dig || ''}
                  </span>
                ))}
              </div>

              {/* Row 3: UNDERLINE KE NICHE (अंडरलाइन के नीचे उत्तर) */}
              {solveMode === 'teach' ? (
                /* Auto-Teach Mode: Animated Calculated Result Column by Column */
                <div
                  className="grid gap-2.5 sm:gap-4 text-center pt-3 font-black text-2xl sm:text-3xl"
                  style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
                >
                  <span className="opacity-0">•</span>
                  {dr.map((dig, i) => {
                    const stageThreshold = numCols - i; // o: stage>=1, t: stage>=2, h: stage>=3
                    const isVisible = currentStage >= stageThreshold;
                    return (
                      <span
                        key={i}
                        className={`transition-all duration-500 ${
                          isVisible
                            ? `${columns[i]?.color || 'text-white'} scale-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-in zoom-in`
                            : 'opacity-0'
                        }`}
                      >
                        {dig}
                      </span>
                    );
                  })}
                </div>
              ) : (
                /* Self-Solve Mode: Interactive Blank Boxes Under the Underline */
                <div
                  className="grid gap-2 sm:gap-3 text-center pt-3 font-black"
                  style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
                >
                  <span className="text-xs text-emerald-400 flex items-center justify-center font-bold">उत्तर:</span>

                  {columns.map((c, i) => (
                    <div key={c.id} className="flex flex-col items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={userColumnDigits[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const updated = { ...userColumnDigits, [i]: val };
                          setUserColumnDigits(updated);

                          let comb = '';
                          for (let k = 0; k < numCols; k++) {
                            comb += updated[k] || '';
                          }
                          setUserAns(comb);
                          setCheckStatus('idle');
                        }}
                        placeholder="?"
                        className={`w-10 sm:w-12 h-12 sm:h-14 text-center rounded-xl font-black text-xl sm:text-2xl outline-none transition-all ${
                          checkStatus === 'correct'
                            ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300'
                            : checkStatus === 'wrong'
                            ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300'
                            : 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-300 focus:bg-amber-500/30 focus:border-solid focus:ring-2 focus:ring-amber-400'
                        }`}
                        title={`${c.fullLabel} का अंक लिखें`}
                      />
                      <span className="text-[9px] text-slate-300 font-sans mt-0.5 font-bold">
                        {c.fullLabel}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SELF-SOLVE ACTION BAR (Check & Save, Feedback, Try Again) */}
          {solveMode === 'self' && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center gap-3 w-full max-w-sm">
              {/* Unified full answer box */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span>या पूरा उत्तर लिखें:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={userAns}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setUserAns(val);
                    // auto-fill column digits from right to left
                    const updated: Record<number, string> = {};
                    const reversedVal = val.split('').reverse();
                    for (let k = 0; k < numCols; k++) {
                      const colIdx = numCols - 1 - k;
                      updated[colIdx] = reversedVal[k] || '';
                    }
                    setUserColumnDigits(updated);
                    setCheckStatus('idle');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                  placeholder="?"
                  className="w-28 px-3 py-1.5 rounded-xl bg-black/60 border-2 border-white/30 text-white font-mono text-center text-lg font-black focus:border-amber-400 focus:outline-none ring-2 ring-amber-400/40"
                />
              </div>

              {/* Check & Save Button */}
              {checkStatus !== 'correct' && (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>चेक करें व सेव करें (Check & Save)</span>
                </button>
              )}

              {/* Correct Feedback Box */}
              {checkStatus === 'correct' && (
                <div className="w-full p-3.5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 text-center animate-in zoom-in duration-300">
                  <div className="text-sm font-black flex items-center justify-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                    <span>शाबाश बेटा! आपका उत्तर बिल्कुल सही है! 🎉</span>
                  </div>
                  <p className="text-xs mt-1 text-emerald-100 font-mono">
                    {num1} {opSymbol} {num2} = <span className="font-black text-white text-base">{result}</span> (आपको +5 अंक मिले ⭐)
                  </p>
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="mt-2.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    नया प्रयास करें
                  </button>
                </div>
              )}

              {/* Wrong Feedback Box with Try Again Option */}
              {checkStatus === 'wrong' && (
                <div className="w-full p-3.5 rounded-2xl bg-rose-500/20 border-2 border-rose-500/60 text-rose-200 text-center animate-in shake duration-300">
                  <div className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 text-rose-300">
                    <span>❌</span>
                    <span>आपका सवाल/उत्तर गलत है। दोबारा कोशिश करें!</span>
                  </div>
                  <p className="text-[11px] mt-1 text-rose-100">
                    {num1} में से {num2} घटाने पर यह उत्तर नहीं आता।
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={handleTryAgain}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>फिर से कोशिश करें (Try Again)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSolveMode('teach');
                        setIsPlaying(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <span>👨‍🏫 शिक्षक का हल देखें</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teacher Voice Subtitle at Bottom */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-md w-full">
            <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">
              🗣️ {teacherName} समझा रहे हैं:
            </span>
            <p className="text-xs sm:text-sm font-semibold text-amber-100 leading-relaxed">
              {solveMode === 'teach'
                ? getStageSpeech(currentStage)
                : checkStatus === 'correct'
                ? `शाबाश बेटा! ${num1} ${op === '-' ? 'में से' : 'और'} ${num2} का उत्तर ${result} बिल्कुल सही है!`
                : checkStatus === 'wrong'
                ? `बेटा, आपका सवाल का उत्तर गलत है। दोबारा कोशिश करें (Try Again)!`
                : `अंडरलाइन के नीचे खाली डिब्बे में उत्तर भरें और चेक करें दबाएं!`}
            </p>
          </div>
        </div>

        {/* RIGHT: VISUAL BEADS & PLACE-VALUE REPRESENTATION */}
        <div className="lg:col-span-5 bg-black/30 rounded-3xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                स्थानीय मान व चित्रमय रूप (Visual Place Values)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {num1} {opSymbol} {num2} = {solveMode === 'self' && checkStatus !== 'correct' ? '?' : result}
              </span>
            </div>

            {isDivision ? (
              /* Division Components & Formula */
              <div className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300 pb-2 border-b border-white/10">
                  <span className="text-emerald-400 font-extrabold">📐 भाग का सूत्र (Division Formula):</span>
                </div>
                <div className="text-xs sm:text-sm font-mono text-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold">
                  भाज्य = (भाजक × भागफल) + शेषफल
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">भाज्य (Dividend)</span>
                    <span className="text-lg font-black text-sky-300">{num1}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">भाजक (Divisor)</span>
                    <span className="text-lg font-black text-amber-300">{num2}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">भागफल (Quotient)</span>
                    <span className="text-lg font-black text-emerald-300">
                      {solveMode === 'self' && checkStatus !== 'correct' ? '?' : result}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-400/30">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">शेषफल (Remainder)</span>
                    <span className="text-lg font-black text-purple-300">
                      {solveMode === 'self' && checkStatus !== 'correct' ? '?' : num1 % num2}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Row 1 Value breakdown for Addition / Subtraction */
              <>
                <div className="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                    <span>पहला मान ({num1}):</span>
                    <span className="font-mono bg-sky-500/20 px-2 py-0.5 rounded-full">{num1}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {num1 >= 100 && (
                      <span className="px-2 py-1 rounded-xl bg-sky-600/30 border border-sky-400 text-sky-200 font-bold">
                        📦 सैकड़ा: {Math.floor(num1 / 100)} × 100
                      </span>
                    )}
                    {num1 >= 10 && (
                      <span className="px-2 py-1 rounded-xl bg-amber-600/30 border border-amber-400 text-amber-200 font-bold">
                        🔟 दहाई: {Math.floor((num1 % 100) / 10)} × 10
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-xl bg-emerald-600/30 border border-emerald-400 text-emerald-200 font-bold">
                      🟢 इकाई: {num1 % 10}
                    </span>
                  </div>
                </div>

                {/* Row 2 Value breakdown */}
                <div className="mt-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>दूसरा मान ({num2}):</span>
                    <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded-full">{num2}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {num2 >= 100 && (
                      <span className="px-2 py-1 rounded-xl bg-sky-600/30 border border-sky-400 text-sky-200 font-bold">
                        📦 सैकड़ा: {Math.floor(num2 / 100)} × 100
                      </span>
                    )}
                    {num2 >= 10 && (
                      <span className="px-2 py-1 rounded-xl bg-amber-600/30 border border-amber-400 text-amber-200 font-bold">
                        🔟 दहाई: {Math.floor((num2 % 100) / 10)} × 10
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-xl bg-emerald-600/30 border border-emerald-400 text-emerald-200 font-bold">
                      🟢 इकाई: {num2 % 10}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* FINAL CELEBRATION BOX */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all duration-500 ${
              solveMode === 'self' && checkStatus === 'correct'
                ? 'bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/30 scale-102'
                : solveMode === 'teach' && currentStage >= 4
                ? 'bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-102'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-6 h-6 ${
                    (solveMode === 'teach' && currentStage >= 4) || (solveMode === 'self' && checkStatus === 'correct')
                      ? 'text-emerald-400 animate-bounce'
                      : 'text-slate-500'
                  }`}
                />
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-400 block">
                    अंतिम सही उत्तर (Final Solution)
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    {num1} {opSymbol} {num2} ={' '}
                    <span className="text-emerald-400">
                      {solveMode === 'self' && checkStatus !== 'correct' ? '?' : result}
                    </span>
                  </div>
                </div>
              </div>

              {((solveMode === 'teach' && currentStage >= 4) || (solveMode === 'self' && checkStatus === 'correct')) && (
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
