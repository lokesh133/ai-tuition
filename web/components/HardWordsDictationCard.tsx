'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles, BookOpen, Headphones } from 'lucide-react';

export interface HardWordItem {
  num: number;
  word: string;
  meaning: string;
}

export interface HardWordsDictationCardProps {
  formula: string;
  stepTitle?: string;
  annotation?: string;
  isDarkMode?: boolean;
  chalkboardTheme?: string;
  medium?: string;
  initialMode?: 'dictation' | 'study';
  onSpeak: (text: string) => void;
  onScoreUpdate?: (points: number) => void;
}

export const parseHardWords = (formula: string): HardWordItem[] => {
  if (!formula) return [];
  const lines = formula.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: HardWordItem[] = [];

  lines.forEach((line, idx) => {
    // Regex for: "1. Evaporation (वाष्पीकरण)" or "1. Evaporation - meaning" or "Evaporation (वाष्पीकरण)"
    const match = line.match(/^(?:([0-9]+)[\.\:\)]\s*)?([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(?:\((.*?)\)|[-–—:]\s*(.*))?$/);
    if (match) {
      const num = match[1] ? parseInt(match[1], 10) : idx + 1;
      const word = match[2].trim();
      const meaning = (match[3] || match[4] || '').trim();
      if (word.length >= 2) {
        items.push({ num, word, meaning });
      }
    }
  });

  // If line format didn't catch, try comma separated
  if (items.length === 0 && formula.includes(',')) {
    const rawWords = formula.split(',');
    rawWords.forEach((rw, idx) => {
      const clean = rw.replace(/^[0-9]+[\.\:\)]\s*/, '').trim();
      if (clean && /^[A-Za-z]+/.test(clean)) {
        const parts = clean.split(/\s*\((.*?)\)/);
        items.push({
          num: idx + 1,
          word: parts[0].trim(),
          meaning: parts[1] || '',
        });
      }
    });
  }

  return items;
};

export const HardWordsDictationCard: React.FC<HardWordsDictationCardProps> = ({
  formula,
  stepTitle = '',
  annotation = '',
  isDarkMode = false,
  chalkboardTheme = 'slate',
  medium = 'hindi',
  initialMode,
  onSpeak,
  onScoreUpdate,
}) => {
  const words = parseHardWords(formula);
  const [mode, setMode] = useState<'dictation' | 'study'>(initialMode || 'dictation');
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [results, setResults] = useState<Record<number, { user: string; isCorrect: boolean }>>({});
  const [showMeaningHint, setShowMeaningHint] = useState<boolean>(false);
  const [isTestComplete, setIsTestComplete] = useState<boolean>(false);

  if (words.length === 0) {
    return null;
  }

  const currentWord = words[activeIdx] || words[0];
  const totalWords = words.length;
  const currentResult = results[activeIdx];

  const handleSpeakCurrentWord = () => {
    const isEn = medium === 'english';
    const speech = isEn
      ? `Word number ${currentWord.num}. ${currentWord.word}. Please type the correct spelling.`
      : `शब्द नंबर ${currentWord.num}: ${currentWord.word}। ध्यान से सुनकर नीचे बॉक्स में सही स्पेलिंग लिखें।`;
    onSpeak(speech);
  };

  const handleCheckAnswer = () => {
    if (!userInput.trim()) return;
    const cleanUser = userInput.trim().toLowerCase();
    const cleanTarget = currentWord.word.trim().toLowerCase();
    const isCorrect = cleanUser === cleanTarget;

    setResults((prev) => ({
      ...prev,
      [activeIdx]: { user: userInput.trim(), isCorrect },
    }));

    if (isCorrect) {
      if (onScoreUpdate) onScoreUpdate(10);
      onSpeak(medium === 'english' ? `Excellent! Correct spelling of ${currentWord.word}!` : `शाबाश बेटा! बिल्कुल सही स्पेलिंग: ${currentWord.word}!`);
    } else {
      const spelledOut = currentWord.word.toUpperCase().split('').join('-');
      onSpeak(
        medium === 'english'
          ? `Not quite right. The correct spelling is: ${spelledOut}. ${currentWord.word}.`
          : `थोड़ी गलती हो गई बेटा। सही स्पेलिंग है: ${spelledOut} यानी ${currentWord.word}!`
      );
    }
  };

  const handleNextWord = () => {
    if (activeIdx < totalWords - 1) {
      setActiveIdx((prev) => prev + 1);
      setUserInput('');
      setShowMeaningHint(false);
      // Automatically prompt the next word after 300ms
      setTimeout(() => {
        const nextWord = words[activeIdx + 1];
        if (nextWord) {
          const isEn = medium === 'english';
          onSpeak(isEn ? `Next word: ${nextWord.word}` : `अगला शब्द: ${nextWord.word}`);
        }
      }, 350);
    } else {
      setIsTestComplete(true);
      const score = Object.values(results).filter((r) => r.isCorrect).length + (currentResult?.isCorrect ? 1 : 0);
      onSpeak(
        medium === 'english'
          ? `Congratulations! You scored ${score} out of ${totalWords} in the spelling test!`
          : `बधाई हो बेटा! आपने कठिन शब्द टेस्ट में ${totalWords} में से ${score} शब्द सही लिखे!`
      );
    }
  };

  const handleResetTest = () => {
    setActiveIdx(0);
    setUserInput('');
    setResults({});
    setShowMeaningHint(false);
    setIsTestComplete(false);
  };

  const correctCount = Object.values(results).filter((r) => r.isCorrect).length;

  return (
    <div className={`mt-3 rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
      isDarkMode || chalkboardTheme === 'green'
        ? 'bg-slate-900/95 border-indigo-500/30 text-white'
        : 'bg-gradient-to-b from-indigo-50/60 to-white border-indigo-200 text-slate-900'
    }`}>
      {/* Top Bar: Mode Switcher & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-indigo-200/50 dark:border-indigo-800/40">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Headphones className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
              <span>{medium === 'english' ? 'Spelling Dictation Test' : 'कठिन शब्द श्रुतलेख (Spelling Test)'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-500/20">
                {totalWords} {medium === 'english' ? 'Words' : 'शब्द'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {mode === 'dictation'
                ? (medium === 'english' ? 'Spelling is hidden! Listen carefully and type.' : 'स्पेलिंग छुपी हुई है! ध्यान से सुनकर सही स्पेलिंग लिखें।')
                : (medium === 'english' ? 'Study all spellings & Hindi meanings' : 'सभी स्पेलिंग व उनके हिंदी अर्थ याद करें')}
            </p>
          </div>
        </div>

        {/* Toggle between Dictation Test and Study View */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMode('dictation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'dictation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <Headphones className="w-3 h-3" />
            <span>{medium === 'english' ? 'Dictation Test' : 'श्रुतलेख टेस्ट'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('study')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mode === 'study'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>{medium === 'english' ? 'Word Table' : 'शब्दार्थ तालिका'}</span>
          </button>
        </div>
      </div>

      {/* MODE 1: INTERACTIVE DICTATION TEST (SPELLINGS ARE HIDDEN!) */}
      {mode === 'dictation' ? (
        <div className="mt-4 space-y-4">
          {!isTestComplete ? (
            <>
              {/* Word Progress Tracker */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>
                  {medium === 'english' ? `Word ${activeIdx + 1} of ${totalWords}` : `शब्द #${activeIdx + 1} (कुल ${totalWords})`}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{correctCount}/{totalWords} {medium === 'english' ? 'Correct' : 'सही'}</span>
                </span>
              </div>

              {/* Central Voice & Listening Card */}
              <div className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${
                isDarkMode || chalkboardTheme === 'green'
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-white border-indigo-100 shadow-xs'
              }`}>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  🎧 {medium === 'english' ? 'Listen to Teacher Pronounce the Word' : 'शिक्षिका से शब्द का सही उच्चारण सुनें'}
                </span>

                <button
                  type="button"
                  onClick={handleSpeakCurrentWord}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm flex items-center gap-2.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all group"
                >
                  <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{medium === 'english' ? '🔊 Speak Word (बोलकर सुनें)' : '🔊 शब्द बोलकर सुनाएं'}</span>
                </button>

                {/* Meaning Hint Toggle */}
                {currentWord.meaning && (
                  <div className="mt-1">
                    {!showMeaningHint ? (
                      <button
                        type="button"
                        onClick={() => setShowMeaningHint(true)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <span>💡 {medium === 'english' ? 'Show Hindi Meaning Hint' : 'हिंदी अर्थ का संकेत (Hint) देखें'}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 inline-block animate-fade-in">
                        अर्थ (Meaning): {currentWord.meaning}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Student Input Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {medium === 'english' ? 'Type the exact spelling below:' : 'यहाँ सुनकर अंग्रेजी स्पेलिंग टाइप करें:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (!currentResult) handleCheckAnswer();
                        else handleNextWord();
                      }
                    }}
                    disabled={Boolean(currentResult)}
                    placeholder={medium === 'english' ? 'Type spelling here (e.g. Evaporation)...' : 'यहाँ स्पेलिंग टाइप करें (e.g. Evaporation)...'}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all focus:outline-none focus:ring-2 ${
                      isDarkMode || chalkboardTheme === 'green'
                        ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-600'
                    }`}
                  />

                  {!currentResult ? (
                    <button
                      type="button"
                      onClick={handleCheckAnswer}
                      disabled={!userInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{medium === 'english' ? 'Check' : 'जाँचें'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextWord}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>{activeIdx < totalWords - 1 ? (medium === 'english' ? 'Next Word' : 'अगला शब्द') : (medium === 'english' ? 'Finish' : 'परिणाम देखें')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback Display */}
              {currentResult && (
                <div className={`p-3.5 rounded-xl border animate-fade-in flex items-start gap-2.5 ${
                  currentResult.isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                }`}>
                  {currentResult.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    {currentResult.isCorrect ? (
                      <p className="font-black text-sm">
                        🎉 {medium === 'english' ? 'Awesome! Correct spelling:' : 'शाबाश! बिल्कुल सही उत्तर:'} <span className="underline">{currentWord.word}</span>
                        {currentWord.meaning ? ` (${currentWord.meaning})` : ''}
                      </p>
                    ) : (
                      <div>
                        <p className="font-bold">
                          ❌ {medium === 'english' ? 'Your spelling:' : 'आपकी लिखी स्पेलिंग:'} <span className="line-through">{currentResult.user}</span>
                        </p>
                        <p className="font-black text-sm mt-0.5">
                          ✅ {medium === 'english' ? 'Correct Spelling:' : 'सही स्पेलिंग है:'} <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentWord.word}</span>
                          {currentWord.meaning ? ` (${currentWord.meaning})` : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Test Complete Celebration Summary */
            <div className={`p-5 rounded-2xl border text-center space-y-3 ${
              isDarkMode || chalkboardTheme === 'green' ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-indigo-200'
            }`}>
              <span className="text-4xl block">🏆</span>
              <h3 className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                {medium === 'english' ? 'Dictation Test Completed!' : 'कठिन शब्द टेस्ट पूरा हुआ!'}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {medium === 'english'
                  ? `You got ${correctCount} out of ${totalWords} words correct!`
                  : `आपने ${totalWords} में से ${correctCount} शब्द बिल्कुल सही लिखे!`}
              </p>

              <button
                type="button"
                onClick={handleResetTest}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 mx-auto transition-all shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{medium === 'english' ? 'Retake Test' : 'दोबारा टेस्ट दें'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: STUDY TABLE (Shows all words with meanings and speech buttons) */
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {words.map((w, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xs ${
                  isDarkMode || chalkboardTheme === 'green'
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                    {w.num}
                  </span>
                  <div>
                    <h5 className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300">
                      {w.word}
                    </h5>
                    {w.meaning && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {w.meaning}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSpeak(`${w.word}. ${w.meaning ? `यानी ${w.meaning}` : ''}`)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all shrink-0"
                  title="बोलकर सुनें"
                >
                  <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
