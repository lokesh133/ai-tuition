'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
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
  // 'self': 2. मैं खुद हल करूँगा (Student Practice with Empty Blanks)
  const [solveMode, setSolveMode] = useState<'teach' | 'self'>('teach');

  // Animation Stages (for Teach mode):
  // 0: Initial Board Setup (सवाल लिखा)
  // 1: Step 1 calculation (इकाई)
  // 2: Step 2 calculation (दहाई)
  // 3: Step 3 calculation (सैकड़ा / आगे)
  // 4: Final Solution & Answer Box
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMs] = useState<number>(3200);

  // Self-solve practice state (Empty boxes typed by student)
  const [userColumnDigits, setUserColumnDigits] = useState<Record<number, string>>({});
  const [userStepDigits, setUserStepDigits] = useState<Record<string, string>>({});
  const [userAns, setUserAns] = useState<string>('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showBlankHint, setShowBlankHint] = useState<boolean>(false);

  // Reset all student answers, feedback, and animation whenever a new question is loaded
  useEffect(() => {
    setUserColumnDigits({});
    setUserStepDigits({});
    setUserAns('');
    setCheckStatus('idle');
    setCurrentStage(0);
    setIsPlaying(true);
    setShowBlankHint(false);
  }, [num1, op, num2, result]);

  // Dynamic Column Place Values Calculation
  const maxVal = Math.max(Math.abs(num1), Math.abs(num2), Math.abs(result));
  const columns: Array<{ id: string; label: string; fullLabel: string; color: string }> = [];

  if (maxVal >= 10000000) {
    columns.push({ id: 'cr', label: 'करोड़ (Cr)', fullLabel: 'करोड़', color: 'text-rose-300' });
  }
  if (maxVal >= 1000000) {
    columns.push({ id: 'tl', label: '10 लाख (TL)', fullLabel: 'दस लाख', color: 'text-pink-300' });
  }
  if (maxVal >= 100000) {
    columns.push({ id: 'l', label: 'लाख (L)', fullLabel: 'लाख', color: 'text-indigo-300' });
  }
  if (maxVal >= 10000) {
    columns.push({ id: 'tth', label: '10 हज़ार (TTh)', fullLabel: 'दस हज़ार', color: 'text-fuchsia-300' });
  }
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
  const isMultiplication = op === '*';
  const multDigits = isMultiplication ? String(num2).split('').map(Number).reverse() : [];
  const isMultiStepMult = isMultiplication && multDigits.length > 1;

  // Precompute multi-step multiplication rows
  // E.g. for 1000 * 10:
  // Row 1 (unit 0): 0000
  // Row 2 (tens 1): 1000×
  const multSteps: Array<{
    digit: number;
    stepIndex: number;
    cells: string[];
    description: string;
  }> = [];

  if (isMultiStepMult) {
    const num1StrLen = String(num1).length;
    for (let k = 0; k < multDigits.length; k++) {
      const d = multDigits[k];
      const prodStr = d === 0 ? '0'.repeat(num1StrLen) : String(num1 * d);
      const rowChars = prodStr + '×'.repeat(k);
      const padded: string[] = [];
      const padLen = numCols - rowChars.length;
      for (let p = 0; p < padLen; p++) padded.push('');
      for (const ch of rowChars) padded.push(ch);

      const placeName = k === 0 ? 'इकाई' : k === 1 ? 'दहाई' : k === 2 ? 'सैकड़ा' : `${k + 1}वां स्थान`;
      multSteps.push({
        digit: d,
        stepIndex: k + 1,
        cells: padded,
        description: `चरण ${k + 1}: ${placeName} के अंक ${d} से ${num1} को गुणा किया`,
      });
    }
  }

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

    if (isMultiStepMult) {
      if (stage === 0) {
        return `बेटा, ध्यान से देखिए! ब्लैकबोर्ड पर सवाल है: ${num1} गुणा ${num2}। आइए इसे ${multSteps.length} चरणों में स्तंभ विधि से गुणा करके समझते हैं।`;
      }
      if (stage >= 1 && stage <= multSteps.length) {
        const step = multSteps[stage - 1];
        return `${step.description}!`;
      }
      if (stage >= multSteps.length + 1 || stage >= 4) {
        return `शाबाश बेटा! सभी पंक्तियों को जोड़ने पर कुल उत्तर ${result} प्राप्त हुआ! बिल्कुल सही उत्तर है!`;
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
      if (op === '*') {
        return `पहला चरण: इकाई के अंकों का गुणा करते हैं।`;
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
      return `कुल परिणाम ${result} बन गया!`;
    }
    if (stage === 4) {
      return `शाबाश बेटा! पूरा हल निकल आया है। ${num1} ${op === '+' ? 'प्लस' : op === '-' ? 'माइनस' : op === '*' ? 'गुणा' : 'भाग'} ${num2} बराबर ${result}! बिल्कुल सही उत्तर है!`;
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

  // Student Self-Solve: Check and Save Answer (Validates every box individually)
  const handleCheckAnswer = () => {
    let studentAnswer: number | null = null;
    let hasAnyInput = false;

    if (userAns.trim() !== '') {
      studentAnswer = parseInt(userAns.trim(), 10);
      hasAnyInput = true;
    }

    let isAllCorrect = true;

    if (isMultiStepMult) {
      // 1. Check partial step boxes
      for (let sIdx = 0; sIdx < multSteps.length; sIdx++) {
        const step = multSteps[sIdx];
        for (let cIdx = 0; cIdx < numCols; cIdx++) {
          const expected = step.cells[cIdx];
          if (expected && expected !== '×') {
            const cellKey = `${sIdx}_${cIdx}`;
            const typed = userStepDigits[cellKey] || '';
            if (typed.trim() !== '') hasAnyInput = true;
            if (typed !== expected) {
              isAllCorrect = false;
            }
          }
        }
      }

      // 2. Check sum row boxes
      let sumComb = '';
      for (let i = 0; i < numCols; i++) {
        const expected = dr[i];
        const sumKey = `sum_${i}`;
        const typed = userStepDigits[sumKey] || '';
        if (typed.trim() !== '') {
          hasAnyInput = true;
          sumComb += typed;
        }
        if (expected && expected.trim() !== '') {
          if (typed !== expected) {
            isAllCorrect = false;
          }
        }
      }
      if (sumComb.trim() !== '') {
        studentAnswer = parseInt(sumComb.trim(), 10);
      }
      if (studentAnswer !== result) {
        isAllCorrect = false;
      }
    } else {
      let combined = '';
      for (let i = 0; i < numCols; i++) {
        const typed = userColumnDigits[i] || '';
        const expected = dr[i];
        if (typed.trim() !== '') {
          hasAnyInput = true;
          combined += typed;
        }
        if (expected && expected.trim() !== '') {
          if (typed !== expected) {
            isAllCorrect = false;
          }
        }
      }
      if (combined.trim() !== '') {
        studentAnswer = parseInt(combined.trim(), 10);
      }
      if (studentAnswer !== null && studentAnswer !== result) {
        isAllCorrect = false;
      }
    }

    if (!hasAnyInput && (studentAnswer === null || isNaN(studentAnswer))) {
      const msg = 'बेटा, कृपया पहले अंडरलाइन के नीचे खाली डिब्बे में अपना उत्तर लिखें!';
      if (onAudioPlay && !isAudioMuted) onAudioPlay(msg);
      return;
    }

    if (isAllCorrect || studentAnswer === result) {
      setCheckStatus('correct');
      const speech = `शाबाश बेटा! आपका उत्तर ${result} और सभी डिब्बे बिल्कुल सही हैं! 🎉`;
      if (onAudioPlay && !isAudioMuted) onAudioPlay(speech);
      if (onScoreUpdate) onScoreUpdate(1);
    } else {
      setCheckStatus('wrong');
      const speech = `बेटा, लाल रंग वाले डिब्बे में गलत अंक हैं। उन्हें सही करके दोबारा कोशिश करें!`;
      if (onAudioPlay && !isAudioMuted) onAudioPlay(speech);
    }
  };

  const handleTryAgain = () => {
    setUserColumnDigits({});
    setUserStepDigits({});
    setUserAns('');
    setCheckStatus('idle');
  };

  return (
    <div
      className={`rounded-3xl p-4 sm:p-6 transition-all duration-300 shadow-2xl border-4 ${
        theme === 'green'
          ? 'bg-emerald-950/95 border-emerald-800 text-emerald-100'
          : theme === 'white'
          ? 'bg-slate-900 border-indigo-900/60 text-white'
          : 'bg-slate-950 border-amber-500/30 text-white'
      }`}
    >
      {/* 1. TOP BAR: Teacher Badge & Animation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-xl shadow-md">
            👨‍🏫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                {teacherName} का लाइव ब्लैकबोर्ड
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {solveMode === 'teach' ? 'शिक्षक समझा रहे हैं' : 'विद्यार्थी अभ्यास मोड'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              विषय: {opLabelHindi} • {num1} {opSymbol} {num2}
            </p>
          </div>
        </div>

        {/* Play / Pause / Replay Controls (Only in Teach Mode) */}
        {solveMode === 'teach' && (
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
              title={isPlaying ? 'रोकें (Pause)' : 'चलाएं (Play)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
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
              const opText = op === '+' ? 'प्लस' : op === '-' ? 'माइनस' : op === '*' ? 'गुणा' : 'भाग';
              const msg = `बेटा, ध्यान से देखिए! मैं आपको ${num1} ${opText} ${num2} स्टेप-बाय-स्टेप हल करके समझाता हूँ।`;
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
              setUserStepDigits({});
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

      {/* 3. SELF-SOLVE PRACTICE BANNER */}
      {solveMode === 'self' && (
        <div className="py-2.5 px-4 my-1 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Edit3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              अभ्यास मोड: अंडरलाइन के नीचे खाली डिब्बों <strong>[ ? ]</strong> में अंक लिखें और <strong>&quot;चेक करें व सेव करें&quot;</strong> दबाएं!
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

      {/* 4. MAIN WHITEBOARD CANVAS (Centered Clean Full Blackboard) */}
      <div className="my-3 flex flex-col items-center w-full">
        <div className="w-full bg-black/40 rounded-3xl p-5 sm:p-7 border border-white/10 flex flex-col items-center justify-center relative min-h-[340px] shadow-2xl">
          {/* Question Banner */}
          <div className="text-center mb-4">
            <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">
              बोर्ड पर लिखा सवाल
            </span>
            <div className="text-2xl sm:text-4xl font-black font-mono tracking-wider text-white">
              {num1} {opSymbol} {num2} = ?
            </div>
          </div>

          {/* DIVISION BRACKET (भाग का ढांचा) vs COLUMN ADD/SUB/MULT */}
          {isDivision ? (
            /* REAL LONG DIVISION BRACKET */
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

                {/* Division Bracket Box */}
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
                      /* Self-Solve Mode: Quotient Input Blanks */
                      <div className="flex items-center gap-1.5">
                        {dr.map((dig, i) => {
                          const typed = userColumnDigits[i] || '';
                          const isChecked = checkStatus !== 'idle';
                          const isCorrect = isChecked && typed === dig;
                          const isWrong = isChecked && typed !== dig;

                          return (
                            <input
                              key={i}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={typed}
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
                              className={`w-10 h-12 text-center rounded-xl font-black text-xl outline-none transition-all ${
                                isCorrect
                                  ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                                  : isWrong
                                  ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300 ring-2 ring-rose-400/50'
                                  : 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-300 focus:bg-amber-500/30 focus:border-solid focus:ring-2 focus:ring-amber-400'
                              }`}
                            />
                          );
                        })}
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
          ) : isMultiStepMult ? (
            /* MULTI-DIGIT MULTIPLICATION (1000 × 10 / 1000 × 200) */
            <div className="font-mono bg-black/60 p-5 sm:p-8 rounded-3xl border-2 border-white/20 shadow-2xl inline-block text-xl sm:text-2xl font-bold min-w-[300px]">
              {/* Header: Column Place Values (चिह्न, 10 हज़ार, हज़ार, सैकड़ा, दहाई, इकाई) */}
              <div
                className="grid gap-2.5 sm:gap-4 text-center pb-2 border-b border-white/20 text-xs sm:text-sm font-black"
                style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
              >
                <span className="text-slate-400">चिह्न</span>
                {columns.map((c) => (
                  <span key={c.id} className={c.color}>
                    {c.label}
                  </span>
                ))}
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
                    className={`${dig ? 'font-extrabold' : ''} ${columns[i]?.color || 'text-white'}`}
                  >
                    {dig || ''}
                  </span>
                ))}
              </div>

              {/* Row 2: Multiplication Operator & Number 2 Digits */}
              <div
                className="grid gap-2.5 sm:gap-4 text-center py-2 text-white border-b-4 border-white/80"
                style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
              >
                <span className="text-amber-400 font-extrabold text-2xl">×</span>
                {d2.map((dig, i) => (
                  <span
                    key={i}
                    className={`${dig ? 'font-extrabold' : ''} ${columns[i]?.color || 'text-white'}`}
                  >
                    {dig || ''}
                  </span>
                ))}
              </div>

              {/* MULTI-STEP PARTIAL PRODUCTS */}
              <div className="space-y-2 pt-2">
                {multSteps.map((step, idx) => {
                  const isVisible = solveMode === 'teach' ? currentStage >= idx + 1 : true;
                  const isCurrentHighlight = solveMode === 'teach' && currentStage === idx + 1;

                  return (
                    <div
                      key={idx}
                      className={`grid gap-2.5 sm:gap-4 text-center py-1 transition-all duration-300 rounded-lg items-center ${
                        isCurrentHighlight ? 'bg-amber-500/15 ring-1 ring-amber-400/50' : ''
                      }`}
                      style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
                    >
                      <span className="text-[11px] font-sans font-bold text-amber-300/80 flex items-center justify-center">
                        {idx === multSteps.length - 1 ? '+' : `चरण ${idx + 1}`}
                      </span>

                      {step.cells.map((cell, cIdx) => {
                        if (!cell) {
                          return <span key={cIdx} className="opacity-0">•</span>;
                        }
                        if (cell === '×') {
                          return (
                            <span key={cIdx} className="text-rose-400 font-black text-xl flex items-center justify-center">
                              ×
                            </span>
                          );
                        }

                        // Teach Mode: Animated calculated numbers
                        if (solveMode === 'teach') {
                          return (
                            <span
                              key={cIdx}
                              className={`transition-all duration-300 ${
                                isVisible ? 'opacity-100 scale-100 text-amber-200 font-bold' : 'opacity-0 scale-75'
                              }`}
                            >
                              {cell}
                            </span>
                          );
                        }

                        // Self-Solve Mode: Empty input box for student to type
                        const cellKey = `${idx}_${cIdx}`;
                        const userVal = userStepDigits[cellKey] || '';
                        const isChecked = checkStatus !== 'idle';
                        const isCorrect = isChecked && userVal === cell;
                        const isWrong = isChecked && userVal !== cell;

                        return (
                          <div key={cIdx} className="flex justify-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={userVal}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setUserStepDigits((prev) => ({ ...prev, [cellKey]: val }));
                                setCheckStatus('idle');
                              }}
                              placeholder="?"
                              className={`w-9 sm:w-11 h-10 sm:h-12 text-center rounded-xl font-black text-lg outline-none transition-all ${
                                isCorrect
                                  ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                                  : isWrong
                                  ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300 ring-2 ring-rose-400/50'
                                  : 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-300 focus:bg-amber-500/30 focus:border-solid focus:ring-2 focus:ring-amber-400'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* TOTAL ADDITION LINE */}
              <div className="border-b-4 border-white/90 my-2" />

              {/* FINAL SUM ROW (अंतिम कुल योग) */}
              <div
                className="grid gap-2.5 sm:gap-4 text-center pt-2 font-black text-2xl sm:text-3xl items-center"
                style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
              >
                <span className="text-amber-400 font-extrabold text-xl flex items-center justify-center">=</span>
                {dr.map((dig, i) => {
                  if (!dig) {
                    return <span key={i} className="opacity-0">•</span>;
                  }

                  // Teach Mode: Animated reveal of sum
                  if (solveMode === 'teach') {
                    const isVisible = currentStage >= multSteps.length + 1 || currentStage >= 4;
                    return (
                      <span
                        key={i}
                        className={`transition-all duration-500 ${
                          isVisible
                            ? `${columns[i]?.color || 'text-emerald-400'} scale-110 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-in zoom-in`
                            : 'opacity-0'
                        }`}
                      >
                        {dig}
                      </span>
                    );
                  }

                  // Self-Solve Mode: Empty input box for final answer digits
                  const sumKey = `sum_${i}`;
                  const userVal = userStepDigits[sumKey] || '';
                  const isChecked = checkStatus !== 'idle';
                  const isCorrect = isChecked && userVal === dig;
                  const isWrong = isChecked && userVal !== dig;

                  return (
                    <div key={i} className="flex justify-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={userVal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const updated = { ...userStepDigits, [sumKey]: val };
                          setUserStepDigits(updated);

                          let comb = '';
                          for (let k = 0; k < numCols; k++) {
                            comb += updated[`sum_${k}`] || '';
                          }
                          setUserAns(comb);
                          setCheckStatus('idle');
                        }}
                        placeholder="?"
                        className={`w-9 sm:w-11 h-11 sm:h-13 text-center rounded-xl font-black text-xl outline-none transition-all ${
                          isCorrect
                            ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                            : isWrong
                            ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300 ring-2 ring-rose-400/50'
                            : 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-300 focus:bg-amber-500/30 focus:border-solid focus:ring-2 focus:ring-amber-400'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STANDARD COLUMN ADDITION / SUBTRACTION / 1-DIGIT MULTIPLICATION */
            <div className="font-mono bg-black/60 p-5 sm:p-7 rounded-3xl border-2 border-white/20 shadow-2xl inline-block text-xl sm:text-2xl font-bold min-w-[260px]">
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
                    className={`${dig ? 'font-extrabold' : ''} ${columns[i]?.color || 'text-white'}`}
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
                    className={`${dig ? 'font-extrabold' : ''} ${columns[i]?.color || 'text-white'}`}
                  >
                    {dig || ''}
                  </span>
                ))}
              </div>

              {/* Row 3: UNDERLINE KE NICHE (उत्तर) */}
              {solveMode === 'teach' ? (
                <div
                  className="grid gap-2.5 sm:gap-4 text-center pt-3 font-black text-2xl sm:text-3xl"
                  style={{ gridTemplateColumns: `repeat(${numCols + 1}, minmax(0, 1fr))` }}
                >
                  <span className="opacity-0">•</span>
                  {dr.map((dig, i) => {
                    const stageThreshold = numCols - i;
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

                  {columns.map((c, i) => {
                    const expected = dr[i];
                    const typed = userColumnDigits[i] || '';
                    const isChecked = checkStatus !== 'idle';
                    const isCorrect = isChecked && typed === expected;
                    const isWrong = isChecked && typed !== expected;

                    return (
                      <div key={c.id} className="flex flex-col items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={typed}
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
                            isCorrect
                              ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                              : isWrong
                              ? 'bg-rose-500/30 border-2 border-rose-400 text-rose-300 ring-2 ring-rose-400/50'
                              : 'bg-amber-500/20 border-2 border-dashed border-amber-400 text-amber-300 focus:bg-amber-500/30 focus:border-solid focus:ring-2 focus:ring-amber-400'
                          }`}
                          title={`${c.fullLabel} का अंक लिखें`}
                        />
                        <span className="text-[9px] text-slate-300 font-sans mt-0.5 font-bold">
                          {c.fullLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SELF-SOLVE ACTION BAR (Check & Save, Feedback, Try Again) */}
          {solveMode === 'self' && (
            <div className="mt-5 pt-3 border-t border-white/10 flex flex-col items-center gap-3 w-full max-w-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span>या पूरा उत्तर लिखें:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={userAns}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setUserAns(val);

                    if (isMultiStepMult) {
                      const updated: Record<string, string> = { ...userStepDigits };
                      const reversedVal = val.split('').reverse();
                      for (let k = 0; k < numCols; k++) {
                        const colIdx = numCols - 1 - k;
                        updated[`sum_${colIdx}`] = reversedVal[k] || '';
                      }
                      setUserStepDigits(updated);
                    } else {
                      const updated: Record<number, string> = {};
                      const reversedVal = val.split('').reverse();
                      for (let k = 0; k < numCols; k++) {
                        const colIdx = numCols - 1 - k;
                        updated[colIdx] = reversedVal[k] || '';
                      }
                      setUserColumnDigits(updated);
                    }
                    setCheckStatus('idle');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
                  placeholder="?"
                  className="w-32 px-3 py-1.5 rounded-xl bg-black/60 border-2 border-white/30 text-white font-mono text-center text-lg font-black focus:border-amber-400 focus:outline-none ring-2 ring-amber-400/40"
                />
              </div>

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

              {checkStatus === 'wrong' && (
                <div className="w-full p-3.5 rounded-2xl bg-rose-500/20 border-2 border-rose-500/60 text-rose-200 text-center animate-in shake duration-300">
                  <div className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 text-rose-300">
                    <span>❌</span>
                    <span>लाल रंग वाले डिब्बे में गलत अंक हैं। दोबारा कोशिश करें!</span>
                  </div>
                  <p className="text-[11px] mt-1 text-rose-100">
                    सभी डिब्बों को ध्यान से चेक करें या शिक्षक का हल देखें।
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

          {/* Teacher Voice Subtitle */}
          <div className="mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-lg w-full">
            <span className="text-[10px] font-black uppercase text-amber-400 block mb-0.5">
              🗣️ {teacherName} समझा रहे हैं:
            </span>
            <p className="text-xs sm:text-sm font-semibold text-amber-100 leading-relaxed">
              {solveMode === 'teach'
                ? getStageSpeech(currentStage)
                : checkStatus === 'correct'
                ? `शाबाश बेटा! ${num1} ${op === '*' ? 'गुणा' : op === '-' ? 'में से' : 'और'} ${num2} का उत्तर ${result} बिल्कुल सही है!`
                : checkStatus === 'wrong'
                ? `बेटा, लाल रंग वाले डिब्बे में गलत अंक हैं। उन्हें सही करके दोबारा कोशिश करें!`
                : `अंडरलाइन के नीचे खाली डिब्बे में उत्तर भरें और चेक करें दबाएं!`}
            </p>
          </div>

          {/* FINAL SOLUTION BOX */}
          <div
            className={`mt-4 w-full max-w-lg p-4 rounded-2xl border-2 transition-all duration-500 ${
              (solveMode === 'self' && checkStatus === 'correct') || (solveMode === 'teach' && currentStage >= 4)
                ? 'bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/30 scale-102 animate-in zoom-in'
                : 'bg-white/5 border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-7 h-7 shrink-0 ${
                    (solveMode === 'teach' && currentStage >= 4) || (solveMode === 'self' && checkStatus === 'correct')
                      ? 'text-emerald-400 animate-bounce'
                      : 'text-slate-500'
                  }`}
                />
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider block">
                    अंतिम सही उत्तर (FINAL SOLUTION)
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {num1} {opSymbol} {num2} ={' '}
                    <span className="text-emerald-400">
                      {solveMode === 'self' && checkStatus !== 'correct' ? '?' : result}
                    </span>
                  </div>
                </div>
              </div>

              {((solveMode === 'teach' && currentStage >= 4) || (solveMode === 'self' && checkStatus === 'correct')) && (
                <div className="bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 animate-in zoom-in">
                  <Award className="w-4 h-4" />
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
