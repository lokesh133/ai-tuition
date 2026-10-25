'use client';

import React, { useState } from 'react';
import { Sparkles, Plus, Copy, Check, RotateCcw } from 'lucide-react';

export interface MathPyramidWidgetProps {
  initialValues?: { [key: string]: string };
  isEditable?: boolean;
  onInsertToAnswer?: (formattedText: string) => void;
  onAutoUpdate?: (formattedText: string) => void;
  isDarkMode?: boolean;
  medium?: 'hindi' | 'english';
  presetType?: 'pyramid1' | 'pyramid2' | 'empty4' | 'empty3' | 'empty2' | 'boxesRow';
}

export const PRESET_PYRAMIDS = {
  pyramid1: {
    title: 'पहेली पिरामिड 1 (50, 22, 4, 6)',
    titleEn: 'Number Pyramid 1 (50, 22, 4, 6)',
    rows: 4,
    // [row-col]
    initial: {
      '0-0': '50', // top
      '1-1': '22',
      '3-0': '4',
      '3-2': '6',
    },
    locked: ['0-0', '1-1', '3-0', '3-2'],
  },
  pyramid2: {
    title: 'पहेली पिरामिड 2 (40, 9, 5, 7)',
    titleEn: 'Number Pyramid 2 (40, 9, 5, 7)',
    rows: 4,
    initial: {
      '1-0': '40',
      '2-2': '9',
      '3-0': '5',
      '3-2': '7',
    },
    locked: ['1-0', '2-2', '3-0', '3-2'],
  },
  empty4: {
    title: 'नया 4-मंज़िला पिरामिड (Custom 4-tier)',
    titleEn: 'Custom 4-tier Pyramid',
    rows: 4,
    initial: {},
    locked: [],
  },
  empty3: {
    title: '3-मंज़िला पिरामिड (3-tier)',
    titleEn: 'Custom 3-tier Pyramid',
    rows: 3,
    initial: {},
    locked: [],
  },
  empty2: {
    title: '2-मंज़िला बॉक्स (2-tier)',
    titleEn: 'Custom 2-tier Box',
    rows: 2,
    initial: {},
    locked: [],
  },
};

export function MathPyramidWidget({
  initialValues,
  isEditable = true,
  onInsertToAnswer,
  onAutoUpdate,
  isDarkMode = false,
  medium = 'hindi',
  presetType = 'pyramid1',
}: MathPyramidWidgetProps) {
  const [activePreset, setActivePreset] = useState<keyof typeof PRESET_PYRAMIDS>(
    presetType in PRESET_PYRAMIDS ? (presetType as keyof typeof PRESET_PYRAMIDS) : 'pyramid1'
  );

  React.useEffect(() => {
    if (presetType in PRESET_PYRAMIDS) {
      const pKey = presetType as keyof typeof PRESET_PYRAMIDS;
      setActivePreset(pKey);
      setBoxValues({
        ...PRESET_PYRAMIDS[pKey].initial,
        ...(initialValues || {}),
      });
    }
  }, [presetType, initialValues]);

  const presetConfig = PRESET_PYRAMIDS[activePreset] || PRESET_PYRAMIDS.pyramid1;

  const [boxValues, setBoxValues] = useState<{ [key: string]: string }>({
    ...presetConfig.initial,
    ...(initialValues || {}),
  });

  const [copied, setCopied] = useState(false);

  // Format pyramid to neat text representation for textarea
  const generateFormattedText = (values = boxValues) => {
    const rows = presetConfig.rows;
    const lines: string[] = [];

    lines.push(`--- [${medium === 'english' ? 'Math Pyramid Solution' : 'गणित पिरामिड हल'}] ---`);

    for (let r = 0; r < rows; r++) {
      const indent = '  '.repeat(rows - 1 - r);
      const cells: string[] = [];
      for (let c = 0; c <= r; c++) {
        const val = (values[`${r}-${c}`] || '?').trim();
        cells.push(`[ ${val} ]`);
      }
      lines.push(indent + cells.join(' '));
    }

    // Add brief sum step note
    lines.push(
      medium === 'english'
        ? '(Rule: Each upper box = Sum of two boxes directly below it)'
        : '(नियम: ऊपर का प्रत्येक डिब्बा नीचे के दो डिब्बों का योग है)'
    );

    return lines.join('\n');
  };

  // Switch preset
  const handleSelectPreset = (key: keyof typeof PRESET_PYRAMIDS) => {
    setActivePreset(key);
    const newVals = { ...PRESET_PYRAMIDS[key].initial };
    setBoxValues(newVals);
    if (onAutoUpdate) {
      onAutoUpdate(generateFormattedText(newVals));
    }
  };

  const handleCellChange = (key: string, val: string) => {
    const newVals = {
      ...boxValues,
      [key]: val,
    };
    setBoxValues(newVals);
    if (onAutoUpdate) {
      onAutoUpdate(generateFormattedText(newVals));
    }
  };

  const handleReset = () => {
    const newVals = { ...PRESET_PYRAMIDS[activePreset].initial };
    setBoxValues(newVals);
    if (onAutoUpdate) {
      onAutoUpdate(generateFormattedText(newVals));
    }
  };

  const handleInsert = () => {
    const text = generateFormattedText();
    if (onInsertToAnswer) {
      onInsertToAnswer(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-xl'
          : 'bg-white border-blue-200/90 text-slate-900 shadow-xs ring-1 ring-blue-50/50'
      }`}
    >
      {/* Header with Title and Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-black shrink-0 border border-amber-300 dark:border-amber-700">
            🔺
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{medium === 'english' ? 'Visual Number Pyramid & Boxes' : 'सचित्र संख्या पिरामिड व डिब्बे (Number Pyramid)'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {medium === 'english' ? 'Interactive' : 'लाइव भरें'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {medium === 'english'
                ? 'Rule: Upper box = Sum of the 2 boxes directly below it'
                : 'नियम: नीचे के 2 डिब्बों को जोड़ने पर उनके ऊपर वाला डिब्बा बनता है'}
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(Object.keys(PRESET_PYRAMIDS) as Array<keyof typeof PRESET_PYRAMIDS>).map((key) => {
            const p = PRESET_PYRAMIDS[key];
            const isCurrent = activePreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {medium === 'english' ? p.titleEn : p.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Pyramid Rows */}
      <div className="py-5 flex flex-col items-center justify-center gap-2 sm:gap-2.5 select-none">
        {Array.from({ length: presetConfig.rows }).map((_, rIdx) => {
          return (
            <div key={rIdx} className="flex items-center justify-center gap-2 sm:gap-3">
              {Array.from({ length: rIdx + 1 }).map((_, cIdx) => {
                const cellKey = `${rIdx}-${cIdx}`;
                const val = boxValues[cellKey] ?? '';
                const isLocked = presetConfig.locked.includes(cellKey);

                return (
                  <div
                    key={cellKey}
                    className="flex flex-col items-center justify-center relative group"
                  >
                    {isEditable ? (
                      <input
                        type="text"
                        value={val}
                        disabled={isLocked}
                        onChange={(e) => handleCellChange(cellKey, e.target.value)}
                        placeholder="?"
                        className={`w-11 h-11 sm:w-14 sm:h-14 text-center font-mono font-black text-sm sm:text-base rounded-xl border-2 transition-all outline-none shadow-xs ${
                          isLocked
                            ? isDarkMode
                              ? 'bg-slate-800/90 text-amber-300 border-amber-500/60 shadow-inner'
                              : 'bg-slate-200/90 text-slate-900 border-slate-400 shadow-inner font-extrabold'
                            : val.trim()
                            ? isDarkMode
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500 focus:ring-2 focus:ring-emerald-400'
                              : 'bg-emerald-50 text-emerald-950 border-emerald-500 focus:ring-2 focus:ring-emerald-300 font-extrabold'
                            : isDarkMode
                            ? 'bg-slate-950 text-white border-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40'
                            : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                        title={
                          isLocked
                            ? medium === 'english' ? 'Given in question' : 'सवाल में दिया गया'
                            : medium === 'english' ? 'Type your answer here' : 'यहाँ अपना उत्तर लिखें'
                        }
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center font-mono font-black text-sm sm:text-base rounded-xl border-2 ${
                          isLocked
                            ? isDarkMode
                              ? 'bg-slate-800 text-amber-300 border-amber-500/60'
                              : 'bg-slate-200 text-slate-900 border-slate-400'
                            : val.trim()
                            ? isDarkMode
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-500'
                            : isDarkMode
                            ? 'bg-slate-950 text-slate-500 border-slate-700'
                            : 'bg-white text-slate-400 border-slate-300'
                        }`}
                      >
                        {val || '?'}
                      </div>
                    )}
                    {isLocked && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-slate-400 text-white text-[8px] font-black flex items-center justify-center shadow-xs">
                        🔒
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Action Footer: Insert to Answer, Reset, Hint */}
      <div className="pt-3 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{medium === 'english' ? 'Reset' : 'रीसेट'}</span>
          </button>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            💡 {medium === 'english' ? 'Gray boxes 🔒 are given from question' : 'ग्रे डिब्बे 🔒 सवाल में दिए गए हैं'}
          </span>
        </div>

        {onInsertToAnswer && (
          <button
            type="button"
            onClick={handleInsert}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>
              {copied
                ? (medium === 'english' ? '✓ Added to Answer!' : '✓ उत्तर में जुड़ गया!')
                : (medium === 'english' ? '📥 Insert Pyramid in Answer' : '📥 उत्तर में पिरामिड जोड़ें')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
