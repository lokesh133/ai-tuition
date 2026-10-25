'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Delete,
  CornerDownLeft,
  Copy,
  Check,
  X,
  Calculator as CalcIcon,
} from 'lucide-react';

export interface MathSymbolEditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  currentValue: string;
  onValueChange: (newValue: string) => void;
  isDarkMode?: boolean;
  medium?: 'hindi' | 'english';
  activeQuestionText?: string;
  isPyramidActive?: boolean;
}

interface SymbolGroup {
  id: string;
  labelHindi: string;
  labelEnglish: string;
  icon: string;
  items: {
    display: string;
    insertText: string;
    title: string;
  }[];
}

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    id: 'powers',
    labelHindi: 'घात व पावर्स (Powers)',
    labelEnglish: 'Powers & Exponents',
    icon: '⚡',
    items: [
      { display: 'x²', insertText: '²', title: 'Square (घात 2)' },
      { display: 'x³', insertText: '³', title: 'Cube (घात 3)' },
      { display: 'xⁿ (^)', insertText: '^', title: 'Caret / Power (^)' },
      { display: 'x⁰', insertText: '⁰', title: 'Power 0' },
      { display: 'x¹', insertText: '¹', title: 'Power 1' },
      { display: 'x⁴', insertText: '⁴', title: 'Power 4' },
      { display: 'x⁻¹', insertText: '⁻¹', title: 'Inverse power (-1)' },
    ],
  },
  {
    id: 'boxes',
    labelHindi: 'डिब्बे व पहेली (Boxes)',
    labelEnglish: 'Math Boxes & Patterns',
    icon: '📦',
    items: [
      { display: '[ ? ]', insertText: '[ ? ]', title: 'Empty Math Box (खाली डिब्बा)' },
      { display: '[   ] + [   ] = [   ]', insertText: '[   ] + [   ] = [   ]', title: 'Addition Box Equation' },
      { display: '[   ] × [   ] = [   ]', insertText: '[   ] × [   ] = [   ]', title: 'Multiplication Box Equation' },
      { display: '[ 4 ] [ ? ] [ 6 ] [ ? ]', insertText: '[ 4 ] [ ? ] [ 6 ] [ ? ]', title: 'Row of 4 Puzzle Boxes' },
      { display: '[ ? ] [ ? ] [ ? ]', insertText: '[ ? ] [ ? ] [ ? ]', title: 'Row of 3 Puzzle Boxes' },
      { display: 'Δ', insertText: 'Δ', title: 'Pyramid / Triangle (त्रिभुज/पिरामिड)' },
    ],
  },
  {
    id: 'operators',
    labelHindi: 'चिन्ह (Operators)',
    labelEnglish: 'Math Operators',
    icon: '➕',
    items: [
      { display: '+', insertText: ' + ', title: 'Plus (जोड़)' },
      { display: '−', insertText: ' - ', title: 'Minus (घटाव)' },
      { display: '×', insertText: ' × ', title: 'Multiply (गुणा)' },
      { display: '÷', insertText: ' ÷ ', title: 'Divide (भाग)' },
      { display: '=', insertText: ' = ', title: 'Equals (बराबर)' },
      { display: '≠', insertText: ' ≠ ', title: 'Not Equal To (बराबर नहीं)' },
      { display: '±', insertText: ' ± ', title: 'Plus-Minus' },
      { display: '≈', insertText: ' ≈ ', title: 'Approximately Equal' },
    ],
  },
  {
    id: 'roots_geo',
    labelHindi: 'रूट व कोण (Roots & Angles)',
    labelEnglish: 'Roots & Angles',
    icon: '📐',
    items: [
      { display: '√', insertText: '√', title: 'Square Root (वर्गमूल)' },
      { display: '∛', insertText: '∛', title: 'Cube Root (घनमूल)' },
      { display: '°', insertText: '°', title: 'Degree (अंश/डिग्री e.g. 90°)' },
      { display: 'π', insertText: 'π', title: 'Pi (पाई = 22/7)' },
      { display: '∠', insertText: '∠', title: 'Angle (कोण)' },
      { display: 'Δ', insertText: 'Δ', title: 'Triangle / Delta (त्रिभुज)' },
      { display: 'θ', insertText: 'θ', title: 'Theta (थीटा)' },
      { display: '⊥', insertText: ' ⊥ ', title: 'Perpendicular (लम्ब)' },
      { display: '||', insertText: ' || ', title: 'Parallel (समानांतर)' },
    ],
  },
  {
    id: 'fractions_logic',
    labelHindi: 'भिन्न व तर्क (Fractions)',
    labelEnglish: 'Fractions & Logic',
    icon: '½',
    items: [
      { display: '½', insertText: '½', title: 'Half (आधा)' },
      { display: '¼', insertText: '¼', title: 'Quarter (चौथाई)' },
      { display: '¾', insertText: '¾', title: 'Three Fourths (पौना)' },
      { display: '⁄', insertText: '/', title: 'Fraction Bar (बटा)' },
      { display: '∴', insertText: ' ∴ ', title: 'Therefore (इसलिए)' },
      { display: '∵', insertText: ' ∵ ', title: 'Since (चूँकि / क्योंकि)' },
      { display: '≤', insertText: ' ≤ ', title: 'Less Than or Equal' },
      { display: '≥', insertText: ' ≥ ', title: 'Greater Than or Equal' },
      { display: '%', insertText: '%', title: 'Percentage (प्रतिशत)' },
      { display: '( )', insertText: '()', title: 'Brackets (कोष्ठक)' },
    ],
  },
  {
    id: 'templates',
    labelHindi: 'फॉर्मूला (Formulas)',
    labelEnglish: 'Quick Formulas',
    icon: '📝',
    items: [
      { display: 'a² + b² = c²', insertText: 'c² = a² + b²', title: 'Pythagoras Theorem (पाइथागोरस प्रमेय)' },
      { display: '(a+b)²', insertText: '(a + b)² = a² + 2ab + b²', title: 'Algebra Square formula' },
      { display: '(a-b)²', insertText: '(a - b)² = a² - 2ab + b²', title: 'Algebra Minus formula' },
      { display: 'a² - b²', insertText: 'a² - b² = (a - b)(a + b)', title: 'Difference of Squares' },
      { display: 'πr²', insertText: 'Area = πr²', title: 'Area of Circle (वृत्त का क्षेत्रफल)' },
      { display: '2πr', insertText: 'Perimeter = 2πr', title: 'Circumference (वृत्त की परिधि)' },
      { display: '½ × b × h', insertText: 'Area = ½ × b × h', title: 'Area of Triangle (त्रिभुज का क्षेत्रफल)' },
    ],
  },
  {
    id: 'higher_math',
    labelHindi: '11th-12th गणित (Calculus & Trig)',
    labelEnglish: '11th-12th Higher Math',
    icon: '🎓',
    items: [
      { display: '∫', insertText: '∫ ', title: 'Integral (समाकलन)' },
      { display: 'd/dx', insertText: 'd/dx(', title: 'Derivative / Differentiation (अवकलन)' },
      { display: 'lim(x→0)', insertText: 'lim(x→0) ', title: 'Limit (सीमा)' },
      { display: '∑', insertText: '∑ ', title: 'Summation (सिग्मा / योग)' },
      { display: '∞', insertText: '∞', title: 'Infinity (अनंत)' },
      { display: 'sin θ', insertText: 'sin(θ)', title: 'Sine ratio' },
      { display: 'cos θ', insertText: 'cos(θ)', title: 'Cosine ratio' },
      { display: 'tan θ', insertText: 'tan(θ)', title: 'Tangent ratio' },
      { display: 'log', insertText: 'log(', title: 'Logarithm (लघुगणक)' },
      { display: 'ln', insertText: 'ln(', title: 'Natural Logarithm' },
      { display: 'eˣ', insertText: 'e^x', title: 'Exponential function' },
      { display: 'x = (-b±√D)/2a', insertText: 'x = (-b ± √(b² - 4ac)) / (2a)', title: 'Quadratic Formula (श्रीधराचार्य सूत्र)' },
      { display: 'sin²θ+cos²θ=1', insertText: 'sin²(θ) + cos²(θ) = 1', title: 'Trigonometric Identity' },
      { display: 'd/dx(xⁿ)=n·xⁿ⁻¹', insertText: 'd/dx(xⁿ) = n·xⁿ⁻¹', title: 'Power Rule of Derivatives' },
      { display: '∫xⁿdx=(xⁿ⁺¹)/(n+1)', insertText: '∫ xⁿ dx = (xⁿ⁺¹) / (n + 1) + C', title: 'Power Rule of Integration' },
      { display: '[A] Matrix', insertText: '[ [a, b], [c, d] ]', title: '2x2 Matrix (आव्यूह)' },
      { display: 'det(A)', insertText: '|A| = ad - bc', title: 'Determinant (सारणिक)' },
      { display: 'a⃗ · b⃗', insertText: 'a⃗ · b⃗ = |a⃗||b⃗|cos(θ)', title: 'Vector Dot Product (सदिश गुणन)' },
    ],
  },
];

export function MathSymbolEditorToolbar({
  textareaRef,
  currentValue,
  onValueChange,
  isDarkMode = false,
  medium = 'hindi',
  activeQuestionText,
  isPyramidActive = false,
}: MathSymbolEditorToolbarProps) {
  const [activeTab, setActiveTab] = useState<string>('powers');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Kid Calculator State
  const [calcExpr, setCalcExpr] = useState<string>('');
  const [calcResult, setCalcResult] = useState<string>('');
  const [calcCopied, setCalcCopied] = useState<boolean>(false);
  const [isCalcPopupOpen, setIsCalcPopupOpen] = useState<boolean>(false);

  // Auto-grow textarea height helper
  const triggerAutoGrow = () => {
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.max(140, el.scrollHeight)}px`;
      }
    }, 15);
  };

  // Helper to insert symbol at cursor position in textarea
  const handleInsertSymbol = (textToInsert: string) => {
    const el = textareaRef.current;
    if (!el) {
      onValueChange(currentValue + textToInsert);
      triggerAutoGrow();
      return;
    }

    const start = el.selectionStart ?? currentValue.length;
    const end = el.selectionEnd ?? currentValue.length;
    const before = currentValue.substring(0, start);
    const after = currentValue.substring(end);

    const updated = before + textToInsert + after;
    onValueChange(updated);
    triggerAutoGrow();

    // Reposition cursor smoothly right after inserted symbol
    setTimeout(() => {
      el.focus();
      const newCursorPos = start + textToInsert.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Simple safe student math evaluation
  const evaluateCalc = (expression: string): string => {
    try {
      if (!expression.trim()) return '';
      // Sanitize expression
      let clean = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**');

      // Support square root like sqrt(25) or √25
      clean = clean.replace(/√(\d+(\.\d+)?)/g, 'Math.sqrt($1)');

      // Allow only safe math characters
      if (/[^0-9+\-*/().%\sMath.sqrt]/.test(clean)) {
        return 'Error';
      }

      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${clean})`)();
      if (typeof res === 'number') {
        if (!isFinite(res) || isNaN(res)) return 'Error';
        // Round cleanly to 4 decimal places if float
        return Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(4)).toString();
      }
      return '';
    } catch {
      return '';
    }
  };

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcExpr('');
      setCalcResult('');
    } else if (val === '⌫') {
      const next = calcExpr.slice(0, -1);
      setCalcExpr(next);
      setCalcResult(evaluateCalc(next));
    } else if (val === '=') {
      const res = evaluateCalc(calcExpr);
      if (res && res !== 'Error') {
        setCalcResult(res);
      }
    } else {
      const next = calcExpr + val;
      setCalcExpr(next);
      const res = evaluateCalc(next);
      if (res && res !== 'Error') {
        setCalcResult(res);
      }
    }
  };

  const handleInsertCalcResult = (withExpr: boolean = false) => {
    const res = calcResult || evaluateCalc(calcExpr);
    if (!res || res === 'Error') return;

    const toInsert = withExpr ? `${calcExpr} = ${res}` : res;
    handleInsertSymbol(toInsert);
    setCalcCopied(true);
    setTimeout(() => setCalcCopied(false), 2000);
  };

  // Convert raw power notations (^2, ^3, etc.) or plain c2 to readable formatted preview
  const formatMathPreview = (raw: string): string => {
    if (!raw.trim()) return '';
    return raw
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/\^4/g, '⁴')
      .replace(/\^0/g, '⁰')
      .replace(/\^1/g, '¹')
      .replace(/\^n/g, 'ⁿ')
      .replace(/!=/g, '≠')
      .replace(/<=/g, '≤')
      .replace(/>=/g, '≥')
      .replace(/\+-/g, '±')
      .replace(/\* /g, '× ')
      .replace(/sqrt/gi, '√')
      .replace(/pi\b/gi, 'π');
  };

  const previewText = formatMathPreview(currentValue);
  const hasMathNotation =
    previewText !== currentValue ||
    /[²³⁴ⁿ⁰¹√∛π°∠Δθ≠±≈≤≥∴∵\[\]]/.test(currentValue) ||
    /\^|[a-zA-Z]\d+/.test(currentValue);

  const activeGroup = SYMBOL_GROUPS.find((g) => g.id === activeTab) || SYMBOL_GROUPS[0];

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-700 shadow-lg'
          : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-200/90 shadow-2xs'
      }`}
    >
      {/* Header bar with toggle */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
            🧮
          </span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>{medium === 'english' ? 'Math Assistant, Calculator & Symbols' : 'गणित कैलकुलेटर व चिन्ह टूलबार'}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {medium === 'english' ? 'Tap to Insert' : 'क्लिक करके जोड़ें'}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all"
        >
          <span>{isExpanded ? (medium === 'english' ? 'Hide' : 'छुपाएं') : (medium === 'english' ? 'Show Symbols' : 'चिन्ह दिखाएं')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5">
          {/* Category Tabs (Cleanly Styled - NO UGLY SCROLLBAR) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* 1. Calculator Button (Toggles Side Popup Only) */}
            <button
              type="button"
              onClick={() => setIsCalcPopupOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isCalcPopupOpen
                  ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/50'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-bold'
              }`}
            >
              <span>🧮</span>
              <span>{medium === 'english' ? 'Calculator Popup' : 'कैलकुलेटर साइड पॉपअप'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {isCalcPopupOpen ? 'खुला है ✓' : 'खोलें ↗'}
              </span>
            </button>

            {/* Symbol Groups Tabs */}
            {SYMBOL_GROUPS.map((grp) => {
              const isActive = activeTab === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setActiveTab(grp.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                      : isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <span>{grp.icon}</span>
                  <span>{medium === 'english' ? grp.labelEnglish : grp.labelHindi}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT: STANDARD SYMBOLS IN ACTIVE CATEGORY */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {activeGroup.items.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertSymbol(item.insertText)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm font-mono transition-all transform active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer ${
                    activeGroup.id === 'powers'
                      ? isDarkMode
                        ? 'bg-amber-950/60 hover:bg-amber-900 border border-amber-600/40 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold hover:border-amber-400'
                      : activeGroup.id === 'boxes'
                      ? isDarkMode
                        ? 'bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300'
                        : 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-black'
                      : activeGroup.id === 'templates'
                      ? isDarkMode
                        ? 'bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-300'
                        : 'bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-black'
                      : isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100'
                      : 'bg-white hover:bg-blue-50 border border-slate-200 text-slate-800 hover:border-blue-300 font-extrabold'
                  }`}
                  title={item.title}
                >
                  <span>{item.display}</span>
                </button>
              ))}
            </div>

          {/* Quick Common Power Pills (Always visible for quick access) */}
          {activeTab !== 'powers' && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/5 text-[11px] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <span className="font-bold text-slate-400 shrink-0">
                {medium === 'english' ? 'Quick Powers:' : 'त्वरित पावर्स:'}
              </span>
              {['²', '³', '^', '√', '≠', '°', 'π', '[ ? ]'].map((sym, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleInsertSymbol(sym)}
                  className={`px-2 py-0.5 rounded-lg border font-mono font-black transition-all shrink-0 ${
                    isDarkMode
                      ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                      : 'bg-white text-blue-700 border-slate-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}

          {/* Live Formatted Math Preview if student typed formulas */}
          {hasMathNotation && (
            <div
              className={`p-3 rounded-xl border space-y-1 transition-all ${
                isDarkMode
                  ? 'bg-slate-950/70 border-emerald-500/30 text-emerald-200'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {medium === 'english' ? 'Live Formatted Formula Preview' : '✨ लाइव गणितीय रूप (Formatted Formula Preview)'}
                  </span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {medium === 'english' ? 'Correctly Formatted' : 'सही गणितीय प्रारूप'}
                </span>
              </div>
              <div className="font-mono text-sm sm:text-base font-black whitespace-pre-wrap leading-relaxed tracking-wider">
                {previewText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🌟 FLOATING CALCULATOR SIDE POPUP WITH CROSS CLOSE BUTTON 🌟 */}
      {isCalcPopupOpen && (
        <div
          role="dialog"
          aria-label="Calculator"
          className={`fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 w-[94vw] sm:w-88 max-w-sm rounded-3xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 sm:slide-in-from-right-5 duration-200 ${
            isDarkMode
              ? 'bg-slate-900/98 border-amber-500/50 text-white shadow-2xl shadow-black/80 ring-1 ring-amber-500/30'
              : 'bg-white/98 border-amber-300 text-slate-900 shadow-2xl ring-1 ring-amber-200'
          }`}
        >
          {/* Side Popup Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10 bg-amber-50/70 dark:bg-amber-950/40 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-xs">
                🧮
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-amber-300">
                  {medium === 'english' ? 'Student Math Calculator' : 'गणित कैलकुलेटर (Kid Calc)'}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                  {medium === 'english' ? 'Side Popup • 1-click insert answer' : 'साइड पॉपअप • गणना कर उत्तर जोड़ें'}
                </p>
              </div>
            </div>

            {/* Cross Close Button */}
            <button
              type="button"
              onClick={() => setIsCalcPopupOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black transition-all cursor-pointer shadow-xs"
              title={medium === 'english' ? 'Close calculator (Cross ✕)' : 'कैलकुलेटर बंद करें (Cross ✕)'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 space-y-3">
            {/* Calculator Display */}
            <div
              className={`p-3 rounded-xl border flex flex-col items-end justify-center min-h-[58px] ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-full">
                {calcExpr || '0'}
              </div>
              <div className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">
                {calcResult ? `= ${calcResult}` : calcExpr ? `= ${evaluateCalc(calcExpr) || '...'}` : '0'}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: 'C', val: 'C', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' },
                { label: '⌫', val: '⌫', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
                { label: '(', val: '(', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
                { label: ')', val: ')', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
                { label: '÷', val: ' ÷ ', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },

                { label: '7', val: '7' },
                { label: '8', val: '8' },
                { label: '9', val: '9' },
                { label: '×', val: ' × ', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
                { label: '√', val: '√', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },

                { label: '4', val: '4' },
                { label: '5', val: '5' },
                { label: '6', val: '6' },
                { label: '−', val: ' - ', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
                { label: '^', val: '^', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },

                { label: '1', val: '1' },
                { label: '2', val: '2' },
                { label: '3', val: '3' },
                { label: '+', val: ' + ', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
                { label: '%', val: '%', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },

                { label: '0', val: '0' },
                { label: '.', val: '.' },
                { label: '00', val: '00' },
                { label: '=', val: '=', color: 'bg-amber-500 text-slate-950 font-black col-span-2 shadow-xs' },
              ].map((btn, bIdx) => (
                <button
                  key={bIdx}
                  type="button"
                  onClick={() => handleCalcClick(btn.val)}
                  className={`h-9 sm:h-10 rounded-xl font-mono text-sm sm:text-base font-bold flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                    btn.color ||
                    (isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs')
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Quick 1-Click Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleInsertCalcResult(false)}
                disabled={!calcResult && !calcExpr}
                className="px-2.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              >
                {calcCopied ? <Check className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{medium === 'english' ? 'Insert Result' : 'उत्तर जोड़ें'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertCalcResult(true)}
                disabled={!calcResult && !calcExpr}
                className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              >
                <span>📥</span>
                <span>{medium === 'english' ? 'Full Step' : 'समीकरण जोड़ें'}</span>
              </button>
            </div>

            {/* Bottom Cross / Hide Bar */}
            <button
              type="button"
              onClick={() => setIsCalcPopupOpen(false)}
              className="w-full py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{medium === 'english' ? 'Hide Calculator' : 'कैलकुलेटर छुपाएं (Cross ✕)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating launcher button when popup is closed */}
      {!isCalcPopupOpen && (
        <button
          type="button"
          onClick={() => setIsCalcPopupOpen(true)}
          className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-2 border-white dark:border-slate-800 ring-2 ring-amber-400/50"
          title={medium === 'english' ? 'Open Calculator Popup' : 'कैलकुलेटर साइड पॉपअप खोलें'}
        >
          <span className="text-lg">🧮</span>
          <span className="text-xs font-black">
            {medium === 'english' ? 'Calculator' : 'कैलकुलेटर'}
          </span>
        </button>
      )}
    </div>
  );
}
