'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Loader2,
  Zap,
} from 'lucide-react';
import { AdaptivePracticeQuestion } from '@/lib/learning-brain/types';

interface AdaptivePracticeWidgetProps {
  question: AdaptivePracticeQuestion;
  studentId?: string;
  onAnswerSubmitted?: (isCorrect: boolean, updatedScore?: number) => void;
}

export default function AdaptivePracticeWidget({
  question,
  studentId = 'guest',
  onAnswerSubmitted,
}: AdaptivePracticeWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    explanation: string;
    score?: number;
  } | null>(null);

  const handleSubmit = async () => {
    const answer = selectedOption || typedAnswer.trim();
    if (!answer) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/learning-brain/submit-remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          conceptKey: question.conceptKey,
          conceptTitle: question.conceptTitle,
          subjectId: question.subjectId,
          chapterNumber: question.chapterNumber,
          questionText: question.question,
          expectedAnswer: question.correctAnswer,
          studentAnswer: answer,
          hintsUsedCount: showHint ? hintIndex + 1 : 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({
          submitted: true,
          isCorrect: data.isCorrect,
          explanation: question.explanation,
          score: data.updatedConceptScore?.score,
        });

        if (onAnswerSubmitted) {
          onAnswerSubmitted(data.isCorrect, data.updatedConceptScore?.score);
        }
      }
    } catch (err) {
      console.error('Error submitting adaptive practice answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'HARD':
        return 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'EASY':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
            <Zap className="w-4 h-4" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Adaptive Practice
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {question.conceptTitle}
            </h4>
          </div>
        </div>

        <span
          className={`text-xs font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${getDifficultyBadge(
            question.difficulty
          )}`}
        >
          {question.difficulty} Level
        </span>
      </div>

      {/* Prerequisite Refresher alert if present */}
      {question.prerequisiteRefresher && (
        <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/50 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
            {question.prerequisiteRefresher}
          </p>
        </div>
      )}

      {/* Question Text */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-5">
        <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options if MCQ */}
      {question.options && question.options.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={result?.submitted}
              onClick={() => setSelectedOption(opt)}
              className={`p-3.5 rounded-2xl text-sm font-bold text-left border transition-all ${
                selectedOption === opt
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/30'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <span className="inline-block w-5 text-slate-400 text-xs mr-2 font-mono">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-5">
          <input
            type="text"
            disabled={result?.submitted}
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Apna uttar likhein..."
            className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Hints Bar */}
      {question.hints && question.hints.length > 0 && !result?.submitted && (
        <div className="mb-5">
          {!showHint ? (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Sawaal samajh nahi aa raha? Hint dekhein
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-950 dark:text-amber-200 font-medium">
              <span className="font-bold text-amber-700 dark:text-amber-400">💡 Hint: </span>
              {question.hints[hintIndex] || question.hints[0]}
            </div>
          )}
        </div>
      )}

      {/* Action / Result */}
      {!result?.submitted ? (
        <button
          type="button"
          disabled={submitting || (!selectedOption && !typedAnswer.trim())}
          onClick={handleSubmit}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Jaanch Rahe Hain...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Check Answer
            </>
          )}
        </button>
      ) : (
        <div
          className={`p-4 rounded-2xl border text-sm font-medium animate-fadeIn ${
            result.isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-1.5">
            {result.isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Shabaash! Bilkul Sahi Answer!
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Chook hui! Sahi uttar dekhein:
              </>
            )}
          </div>
          <p className="text-xs leading-relaxed opacity-90">{result.explanation}</p>
        </div>
      )}
    </div>
  );
}
