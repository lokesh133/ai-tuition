'use client';

import React, { useState } from 'react';
import { Check, X, Sparkles, HelpCircle, CheckCircle2, RotateCcw, Volume2, Award } from 'lucide-react';

export interface EstimationItem {
  id: string;
  num: string; // e.g. '(i)', '(ii)'
  label: string; // e.g. 'बिस्कुट का डिब्बा (Box of Crackers)'
  labelEn: string;
  icon: string; // emoji or visual icon e.g. '🍪', '📖', '🎲'
  options: string[]; // e.g. ['2000 g', '20 g', '200 g']
  correctOption: string; // e.g. '200 g'
  reasonHindi: string; // e.g. '2000 g बहुत भारी है और 20 g बहुत हल्का, इसलिए सही वजन 200 g है।'
  reasonEn: string;
}

export interface VisualEstimationWidgetProps {
  questionTitle?: string;
  items?: EstimationItem[];
  mode?: 'teach' | 'practice'; // 'teach' = solutions highlighted, 'practice' = student selects
  isDarkMode?: boolean;
  medium?: 'hindi' | 'english';
  onAnswerChange?: (selectedAnswers: Record<string, string>) => void;
  onAudioPlay?: (text: string) => void;
}

// Default items based on NCERT / School standard weight estimation worksheet
export const DEFAULT_WEIGHT_ITEMS: EstimationItem[] = [
  {
    id: 'crackers',
    num: '(i)',
    label: 'बिस्कुट का डिब्बा (Crackers Box)',
    labelEn: 'Box of Crackers',
    icon: '🍪',
    options: ['2000 g', '20 g', '200 g'],
    correctOption: '200 g',
    reasonHindi: '2000 g (2 kg) बहुत भारी है और 20 g बहुत कम। एक सामान्य बिस्कुट के डिब्बे का वजन लगभग 200 g होता है।',
    reasonEn: '2000 g (2 kg) is too heavy and 20 g is too light for a full pack. 200 g is the most realistic weight.',
  },
  {
    id: 'book',
    num: '(ii)',
    label: 'किताब (Book)',
    labelEn: 'Reading Book',
    icon: '📖',
    options: ['320 g', '10 g', '6 kg'],
    correctOption: '320 g',
    reasonHindi: '6 kg बहुत भारी है और 10 g सिर्फ 1-2 पन्ने होते हैं। स्कूल की किताब का वजन लगभग 320 g होता है।',
    reasonEn: '6 kg is way too heavy for a single book, and 10 g is just 1-2 leaves. 320 g is accurate.',
  },
  {
    id: 'dice',
    num: '(iii)',
    label: 'पासा / गोटी (Dice)',
    labelEn: 'Playing Dice',
    icon: '🎲',
    options: ['1/2 kg', '40 g', '250 g'],
    correctOption: '40 g',
    reasonHindi: 'पासा (Dice) छोटा व हल्का होता है। 1/2 kg (500 g) और 250 g बहुत भारी हैं, इसलिए सही वजन 40 g है।',
    reasonEn: 'A playing dice is small and plastic/wooden. 500 g or 250 g is too heavy. 40 g is correct.',
  },
  {
    id: 'pencil_box',
    num: '(iv)',
    label: 'पेंसिल / ज्योमेट्री बॉक्स (Pencil Box)',
    labelEn: 'Pencil / Geometry Box',
    icon: '✏️',
    options: ['1/2 kg', '3 kg', '100 g'],
    correctOption: '100 g',
    reasonHindi: 'पेंसिल बॉक्स हल्का होता है। 3 kg या 1/2 kg (500 g) बहुत भारी हैं। सही वजन लगभग 100 g होता है।',
    reasonEn: 'A pencil box with pens weighs around 100 g. 3 kg or 500 g is way too heavy.',
  },
  {
    id: 'tshirt',
    num: '(v)',
    label: 'टी-शर्ट (T-Shirt)',
    labelEn: 'Cotton T-Shirt',
    icon: '👕',
    options: ['1 kg', '750 g', '130 g'],
    correctOption: '130 g',
    reasonHindi: 'कॉटन टी-शर्ट बहुत हल्की होती है। 1 kg या 750 g बहुत भारी कपड़े का वजन है, इसलिए सही वजन 130 g है।',
    reasonEn: 'A light cotton t-shirt weighs about 130 g. 1 kg or 750 g is too heavy.',
  },
  {
    id: 'school_bag',
    num: '(vi)',
    label: 'स्कूल बस्ता (School Bag)',
    labelEn: 'School Bag with Books',
    icon: '🎒',
    options: ['400 g', '4 kg', '40 kg'],
    correctOption: '4 kg',
    reasonHindi: '400 g सिर्फ खाली कपड़े का बैग होता है और 40 kg एक इंसान का वजन होता है! किताबों से भरा स्कूल बैग लगभग 4 kg का होता है।',
    reasonEn: '400 g is just an empty thin bag, and 40 kg is human weight! A packed school bag weighs approx 4 kg.',
  },
];

export const VisualEstimationWidget: React.FC<VisualEstimationWidgetProps> = ({
  questionTitle = 'Estimate the nearest weight (निकटतम वजन का सही अनुमान लगाइए)',
  items = DEFAULT_WEIGHT_ITEMS,
  mode = 'practice',
  isDarkMode = false,
  medium = 'hindi',
  onAnswerChange,
  onAudioPlay,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [activeHintId, setActiveHintId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  const handleSelect = (itemId: string, opt: string) => {
    const updated = { ...selectedAnswers, [itemId]: opt };
    setSelectedAnswers(updated);
    if (onAnswerChange) onAnswerChange(updated);
  };

  const calculateScore = () => {
    let score = 0;
    items.forEach((item) => {
      if (selectedAnswers[item.id] === item.correctOption) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();
  const allAnswered = items.every((item) => Boolean(selectedAnswers[item.id]));

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-all shadow-sm ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800 text-white'
          : 'bg-gradient-to-b from-amber-50/40 via-white to-blue-50/30 border-amber-200/80 text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-xl shrink-0">
            ⚖️
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
              {questionTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {medium === 'english'
                ? 'Tap on the most realistic estimated weight for each item below.'
                : 'हर वस्तु के लिए नीचे दिए गए 3 विकल्पों में से सही अनुमानित वजन चुनें।'}
            </p>
          </div>
        </div>

        {/* Score & Replay Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {mode === 'practice' && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                showResult
                  ? score === items.length
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>⭐</span>
              <span>
                {medium === 'english' ? 'Score:' : 'स्कोर:'} {score} / {items.length}
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setSelectedAnswers({});
              setShowResult(false);
              setActiveHintId(null);
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
            title={medium === 'english' ? 'Reset answers' : 'उत्तर रीसेट करें'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of 6 Items (Exactly like the textbook layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {items.map((item) => {
          const userChoice = selectedAnswers[item.id];
          const isCorrect = userChoice === item.correctOption;
          const showItemHint = activeHintId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                isDarkMode
                  ? 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                  : 'bg-white border-slate-200/90 shadow-2xs hover:border-blue-300'
              } ${
                showResult && userChoice
                  ? isCorrect
                    ? 'ring-2 ring-emerald-400/40 border-emerald-400'
                    : 'ring-2 ring-rose-400/40 border-rose-400'
                  : ''
              }`}
            >
              {/* Item Top: Icon + Title + Hint Button */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl w-8 h-8 rounded-xl bg-amber-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
                      {item.icon}
                    </span>
                    <div>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                        {item.num}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {medium === 'english' ? item.labelEn : item.label}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onAudioPlay && (
                      <button
                        type="button"
                        onClick={() =>
                          onAudioPlay(
                            medium === 'english'
                              ? `Question ${item.num}: ${item.labelEn}. Estimate nearest weight.`
                              : `सवाल ${item.num}: ${item.label}। सही वजन का अनुमान लगाएं।`
                          )
                        }
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="बोलकर सुनें"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveHintId(showItemHint ? null : item.id)}
                      className={`p-1 rounded-md transition-colors ${
                        showItemHint
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800'
                      }`}
                      title={medium === 'english' ? 'View reason / hint' : 'कारण व हिंट देखें'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Teacher Reason Box (Collapsible / Toggleable) */}
                {(showItemHint || mode === 'teach' || (showResult && userChoice)) && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] leading-relaxed mb-2.5 animate-in fade-in duration-200 ${
                      mode === 'teach' || (showResult && isCorrect)
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : showResult && !isCorrect
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold shrink-0">💡</span>
                      <div>
                        <span className="font-black block mb-0.5">
                          {medium === 'english' ? 'Teacher Reason:' : 'शर्मा सर का कारण:'}
                        </span>
                        <span>{medium === 'english' ? item.reasonEn : item.reasonHindi}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 Option Clickable Buttons (Exactly like the textbook 3-box strip) */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {item.options.map((opt) => {
                  const isSelected = userChoice === opt;
                  const isThisCorrect = opt === item.correctOption;
                  const highlightAsTeacher = mode === 'teach' && isThisCorrect;

                  let btnStyle = isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-50 hover:bg-blue-50 border-slate-200 text-slate-800';

                  if (highlightAsTeacher) {
                    btnStyle = 'bg-emerald-500 text-white font-black border-emerald-500 shadow-xs ring-1 ring-emerald-400';
                  } else if (isSelected) {
                    if (showResult) {
                      btnStyle = isCorrect
                        ? 'bg-emerald-600 text-white font-black border-emerald-600 shadow-sm'
                        : 'bg-rose-600 text-white font-black border-rose-600 shadow-sm';
                    } else {
                      btnStyle = 'bg-blue-600 text-white font-black border-blue-600 shadow-xs ring-2 ring-blue-300';
                    }
                  } else if (showResult && isThisCorrect) {
                    btnStyle =
                      'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-black';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelect(item.id, opt)}
                      className={`py-2 px-1 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer transform active:scale-95 ${btnStyle}`}
                    >
                      <span className="truncate max-w-full">{opt}</span>
                      {isSelected && (
                        <span className="text-[10px]">
                          {showResult ? (isCorrect ? '✓' : '✕') : '✓'}
                        </span>
                      )}
                      {!isSelected && showResult && isThisCorrect && (
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold">
                          {medium === 'english' ? 'Correct' : 'सही'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Controls: Check Answers Button & Success Banner */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/5 dark:border-white/10">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {items.filter((item) => Boolean(selectedAnswers[item.id])).length} / {items.length}{' '}
          {medium === 'english' ? 'items selected' : 'वस्तुओं का उत्तर चुना गया'}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!showResult ? (
            <button
              type="button"
              onClick={() => setShowResult(true)}
              disabled={items.filter((item) => Boolean(selectedAnswers[item.id])).length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{medium === 'english' ? 'Check Answers' : 'उत्तर चेक करें'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Award className="w-4 h-4" />
                <span>
                  {score === items.length
                    ? medium === 'english'
                      ? '⭐ Perfect 100%! All estimates correct!'
                      : '⭐ शाबाश बेटा! सभी अनुमान 100% सही हैं!'
                    : medium === 'english'
                    ? `Great try! You got ${score}/${items.length} correct.`
                    : `शानदार प्रयास! ${items.length} में से ${score} सही उत्तर!`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                {medium === 'english' ? 'Try Again' : 'दोबारा प्रयास करें'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualEstimationWidget;
