'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Volume2,
  BookOpen,
  Award,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';

export interface WhiteboardStep {
  step: string;
  formula: string;
  annotation: string;
  isMistake?: boolean;
}

export interface PracticeQuestion {
  question: string;
  type: 'mcq' | 'solve';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  whiteboardSteps?: WhiteboardStep[];
}

interface InteractiveMathWhiteboardProps {
  currentChapterTitle: string;
  topicName?: string;
  steps: WhiteboardStep[];
  practiceQuestions?: PracticeQuestion[];
  onSpeak?: (text: string) => void;
}

export default function InteractiveMathWhiteboard({
  currentChapterTitle,
  topicName = 'Class 4th Mathematics',
  steps = [],
  practiceQuestions = [],
  onSpeak,
}: InteractiveMathWhiteboardProps) {
  // Step reveal state: show step 1 first, then reveal next steps
  const [revealedStepCount, setRevealedStepCount] = useState<number>(1);

  // Active question index
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const currentQ = practiceQuestions[activeQuestionIdx] || null;

  // Selected MCQ or typed answer
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userTypedAnswer, setUserTypedAnswer] = useState<string>('');
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState<number>(0);

  const handleNextStep = () => {
    if (revealedStepCount < steps.length) {
      setRevealedStepCount((prev) => prev + 1);
      const nextStep = steps[revealedStepCount];
      if (nextStep && onSpeak) {
        onSpeak(`${nextStep.step}. ${nextStep.annotation}`);
      }
    }
  };

  const handleResetSteps = () => {
    setRevealedStepCount(1);
  };

  const handleCheckMCQ = (option: string) => {
    if (!currentQ) return;
    setSelectedOption(option);
    const isCorrect = option.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
    if (isCorrect) {
      setAnswerStatus('correct');
      setScore((s) => s + 1);
      if (onSpeak) onSpeak('शाबाश बेटा! आपका उत्तर बिल्कुल सही है! बहुत बढ़िया!');
    } else {
      setAnswerStatus('wrong');
      if (onSpeak) onSpeak('थोड़ा सा ध्यान दो बेटा, एक बार फिर से सोचकर कोशिश करो!');
    }
  };

  const handleCheckTypedAnswer = () => {
    if (!currentQ || !userTypedAnswer.trim()) return;
    const cleanUser = userTypedAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCorrect = currentQ.correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isMatch = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    if (isMatch) {
      setAnswerStatus('correct');
      setScore((s) => s + 1);
      if (onSpeak) onSpeak('अरे वाह! बिल्कुल सही उत्तर लिखा है आपने!');
    } else {
      setAnswerStatus('wrong');
      if (onSpeak) onSpeak('गलत हो गया बेटा, हिंट देखो और दोबारा लिखो!');
    }
  };

  const handleNextQuestion = () => {
    if (activeQuestionIdx + 1 < practiceQuestions.length) {
      setActiveQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setUserTypedAnswer('');
      setAnswerStatus('idle');
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Whiteboard Bar */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
            Digital Math Whiteboard
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-300 font-bold">{currentChapterTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {steps.length > 1 && (
            <button
              onClick={handleResetSteps}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Steps</span>
            </button>
          )}

          <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black">
            Score: {score} ⭐
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Step-by-Step Whiteboard Surface */}
        <div className="bg-slate-950/70 rounded-2xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>स्टेप-बाय-स्टेप हल (Step-by-Step Solution):</span>
            <span>
              Showing {Math.min(revealedStepCount, steps.length)} of {steps.length} steps
            </span>
          </div>

          <div className="space-y-3">
            {steps.slice(0, revealedStepCount).map((stepItem, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  stepItem.isMistake
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : idx === revealedStepCount - 1
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    {stepItem.step}
                  </span>
                  <button
                    onClick={() => onSpeak && onSpeak(`${stepItem.step}: ${stepItem.formula}. ${stepItem.annotation}`)}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                    title="सुनें"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-lg md:text-xl font-mono font-black text-white mt-1.5 tracking-wide bg-slate-950/60 px-3 py-2 rounded-lg border border-white/5">
                  {stepItem.formula}
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  💡 <span className="font-semibold">{stepItem.annotation}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Reveal Next Step Button */}
          {revealedStepCount < steps.length && (
            <button
              onClick={handleNextStep}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <span>अगला कदम समझें (Next Step)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Interactive Practice Question & Answer Box */}
        {currentQ && (
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 rounded-2xl p-5 border border-indigo-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                अभ्यास प्रश्न #{activeQuestionIdx + 1}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                Question {activeQuestionIdx + 1} of {practiceQuestions.length}
              </span>
            </div>

            <h4 className="text-base md:text-lg font-bold text-white leading-relaxed">
              {currentQ.question}
            </h4>

            {/* Type 1: MCQ Options */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isCorrect = answerStatus === 'correct' && isSelected;
                  const isWrong = answerStatus === 'wrong' && isSelected;

                  return (
                    <button
                      key={i}
                      onClick={() => handleCheckMCQ(opt)}
                      className={`p-3.5 rounded-xl border text-left font-bold text-xs md:text-sm transition-all flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                          : isWrong
                          ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                          : isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-white'
                          : 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                      {isWrong && <X className="w-4 h-4 text-rose-400" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Type 2: Direct Type-in Answer Box */}
            {currentQ.type === 'solve' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userTypedAnswer}
                    onChange={(e) => setUserTypedAnswer(e.target.value)}
                    placeholder="अपना उत्तर यहाँ टाइप करें (उदा. 14 cm)..."
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckTypedAnswer()}
                  />
                  <button
                    onClick={handleCheckTypedAnswer}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>जांचें</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Answer Status Feedback Banner */}
            {answerStatus === 'correct' && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">
                    बिल्कुल सही! {currentQ.explanation}
                  </span>
                </div>
                {activeQuestionIdx + 1 < practiceQuestions.length && (
                  <button
                    onClick={handleNextQuestion}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all ml-2"
                  >
                    Next Question →
                  </button>
                )}
              </div>
            )}

            {answerStatus === 'wrong' && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">
                  गलत उत्तर। हिंट: {currentQ.explanation}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
