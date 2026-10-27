'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import { MistakeDetectiveResult } from '@/lib/learning-brain/types';

interface MistakeDetectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostic: MistakeDetectiveResult | null;
  studentId?: string;
  onRemediationCompleted?: (isCorrect: boolean, masteryLevel: string) => void;
}

export default function MistakeDetectiveModal({
  isOpen,
  onClose,
  diagnostic,
  studentId = 'guest',
  onRemediationCompleted,
}: MistakeDetectiveModalProps) {
  const [hintLevel, setHintLevel] = useState<number>(0); // 0 = none, 1 = socratic, 2 = formula, 3 = full
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [submittingRemediation, setSubmittingRemediation] = useState(false);
  const [remediationFeedback, setRemediationFeedback] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    message: string;
    score?: number;
  } | null>(null);

  if (!isOpen || !diagnostic) return null;

  const isMistakeFound = !diagnostic.isCorrect && diagnostic.earliestWrongStepIndex !== -1;

  const handleRevealHint = (level: number) => {
    if (level > hintLevel) {
      setHintLevel(level);
    }
  };

  const handleSubmitRemediation = async () => {
    const answer = selectedOption || typedAnswer.trim();
    if (!answer) return;

    setSubmittingRemediation(true);
    try {
      const res = await fetch('/api/learning-brain/submit-remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          conceptKey: diagnostic.conceptKey,
          conceptTitle: diagnostic.conceptTitle,
          subjectId: diagnostic.detectedSubject,
          questionText: diagnostic.remediationQuestion.questionText,
          expectedAnswer: diagnostic.remediationQuestion.correctAnswer,
          studentAnswer: answer,
          hintsUsedCount: hintLevel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRemediationFeedback({
          submitted: true,
          isCorrect: data.isCorrect,
          message: data.feedback,
          score: data.updatedConceptScore?.score,
        });

        if (onRemediationCompleted) {
          onRemediationCompleted(data.isCorrect, data.updatedConceptScore?.masteryLevel || 'DEVELOPING');
        }
      }
    } catch (err) {
      console.error('Error submitting remediation:', err);
    } finally {
      setSubmittingRemediation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          title="Band karein"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${
              isMistakeFound
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isMistakeFound ? '🕵️‍♂️' : '🌟'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AI Mistake Detective
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {diagnostic.conceptTitle}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isMistakeFound ? 'Galti Kahan Hui? Step-by-Step Diagnostic' : 'Shabaash! Bilkul Sahi Solution'}
            </h3>
          </div>
        </div>

        {/* Handwriting Clarification Needed Warning */}
        {diagnostic.clarificationNeeded && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold">Photo thodi dhundhli ya andhere me hai:</p>
              <p className="mt-1">{diagnostic.clarificationPrompt || 'Kripya thodi achhi roshni me seedhi photo kheechein taaki Sharma Sir ek-ek step saaf dekh sakein.'}</p>
            </div>
          </div>
        )}

        {/* Working Steps Breakdown */}
        {diagnostic.workingSteps && diagnostic.workingSteps.length > 0 && (
          <div className="mb-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Aapke Notebook Ke Steps Ki Jaanch:
            </h4>
            <div className="space-y-2">
              {diagnostic.workingSteps.map((step, idx) => {
                const isEarliestWrong = idx === diagnostic.earliestWrongStepIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isEarliestWrong
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md shrink-0 ${
                        isEarliestWrong
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Step {step.stepNumber}
                    </span>
                    <div className="flex-1 text-sm font-mono font-medium">
                      {step.rawText}
                      {step.errorComment && (
                        <p className="text-xs font-sans text-rose-600 dark:text-rose-400 font-semibold mt-1">
                          ⚠️ {step.errorComment}
                        </p>
                      )}
                    </div>
                    {isEarliestWrong ? (
                      <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-full shrink-0">
                        Pehli Chook
                      </span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Why this mistake occurred */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              {isMistakeFound ? 'Kyun Hui Galti? (Teacher Diagnostic)' : 'Teacher Note'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
            {diagnostic.whyMistakeOccurred}
          </p>
          {diagnostic.teacherEncouragement && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-2">
              💬 {diagnostic.teacherEncouragement}
            </p>
          )}
        </div>

        {/* Progressive Hints Section */}
        {isMistakeFound && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Seekhne Ke 3 Step Hints:
              </h4>
              <span className="text-xs text-slate-500">
                Hint Level: {hintLevel}/3
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleRevealHint(1)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  hintLevel >= 1
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Hint 1: Socho
              </button>
              <button
                type="button"
                onClick={() => handleRevealHint(2)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  hintLevel >= 2
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Hint 2: Niyam / Formula
              </button>
              <button
                type="button"
                onClick={() => handleRevealHint(3)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  hintLevel >= 3
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hint 3: Poora Solution
              </button>
            </div>

            {/* Revealed Hint Box */}
            {hintLevel > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-sm text-slate-800 dark:text-slate-200 animate-fadeIn">
                {hintLevel >= 1 && (
                  <div className="mb-2">
                    <span className="font-bold text-amber-700 dark:text-amber-400">💡 Hint 1: </span>
                    {diagnostic.progressiveHints.level1Socratic}
                  </div>
                )}
                {hintLevel >= 2 && (
                  <div className="mb-2">
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">📐 Formula/Rule: </span>
                    {diagnostic.progressiveHints.level2RuleFormula}
                  </div>
                )}
                {hintLevel >= 3 && (
                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">✅ Sahi Hal: </span>
                    {diagnostic.progressiveHints.level3FullStepSolution}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Similar Remediation Question Section */}
        {diagnostic.remediationQuestion && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                ★
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Independent Mastery Challenge (खुद Solve Karein)
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Is milte-julte sawaal ko bina kisi hint ke solve karein taaki aapka concept score pakka ho sake:
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-4">
              <p className="font-bold text-base text-slate-900 dark:text-white">
                {diagnostic.remediationQuestion.questionText}
              </p>

              {/* Options if MCQ */}
              {diagnostic.remediationQuestion.options && diagnostic.remediationQuestion.options.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {diagnostic.remediationQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={remediationFeedback?.submitted}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 rounded-xl text-sm font-semibold text-left border transition-all ${
                        selectedOption === opt
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    disabled={remediationFeedback?.submitted}
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Apna uttar yahan type karein..."
                    className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Submit Remediation Button */}
            {!remediationFeedback?.submitted ? (
              <button
                type="button"
                disabled={submittingRemediation || (!selectedOption && !typedAnswer.trim())}
                onClick={handleSubmitRemediation}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingRemediation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Jaanch Rahe Hain...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Answer Submit Karein & Mastery Earn Karein
                  </>
                )}
              </button>
            ) : (
              <div
                className={`p-4 rounded-2xl border text-sm font-medium animate-fadeIn ${
                  remediationFeedback.isCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {remediationFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      100% Sahi! Independent Mastery Verified!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      Koi baat nahi! Practice jari rakhein.
                    </>
                  )}
                </div>
                <p>{remediationFeedback.message}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Theek Hai, Aage Badhein
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
