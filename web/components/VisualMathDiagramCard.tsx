'use client';

import React from 'react';
import { Sparkles, Calculator, CheckCircle2, ChevronRight, Triangle as TriangleIcon, Square, Circle, Box } from 'lucide-react';

interface VisualMathDiagramCardProps {
  question: string;
  answer: string;
  isDarkMode?: boolean;
  medium?: 'hindi' | 'english';
}

interface ParsedColumnArithmetic {
  operation: '+' | '-';
  unit1Label: string; // e.g. किलोग्राम (kg)
  unit2Label: string; // e.g. ग्राम (g)
  unit1Short: string; // e.g. kg
  unit2Short: string; // e.g. g
  val1_u1: number;
  val1_u2: number;
  val2_u1: number;
  val2_u2: number;
  borrowNeeded: boolean;
  borrowedU1?: number;
  borrowedU2?: number;
  carryU1?: number;
  ans_u1: number;
  ans_u2: number;
  steps: string[];
}

interface ParsedGeometryShape {
  type: 'triangle' | 'rectangle' | 'square' | 'circle' | 'cuboid' | 'cylinder';
  title: string;
  label1?: string;
  label2?: string;
  label3?: string;
  formula: string;
  calculation: string;
}

/**
 * Robustly parses arithmetic operations with composite units (kg & g, L & mL, m & cm, ₹ & p)
 * or multi-digit column arithmetic.
 */
function tryExtractArithmetic(question: string, answer: string): ParsedColumnArithmetic | null {
  const text = `${question} ${answer}`.replace(/\s+/g, ' ');

  // 1. Composite Measurement Pair Extractor:
  // Matches e.g. "124 kg 346 g", "35 kg 810 g", "101 किग्रा 425 ग्राम", "79 kg 586 g"
  const pairRegex = /(\d+)\s*(kg|किग्रा|कैलोग्राम|किलोग्राम|l|लीटर|m|मीटर|₹|रु|रुपये|rs\.?|km|किमी)\s*(\d+)\s*(g|ग्राम|gm|ml|मिली|मिलीलीटर|cm|सेमी|सेन्टीमीटर|पैसे|पैसा|p|m|मीटर)\b/gi;

  const pairMatches = Array.from(text.matchAll(pairRegex));

  if (pairMatches.length >= 2) {
    const rawU1 = (pairMatches[0][2] || 'kg').toLowerCase();
    const rawU2 = (pairMatches[0][4] || 'g').toLowerCase();

    let unit1Label = 'किलोग्राम (kg)';
    let unit2Label = 'ग्राम (g)';
    let unit1Short = 'kg';
    let unit2Short = 'g';
    let multiplier = 1000;

    if (rawU1.includes('l') || rawU1.includes('लीटर') || rawU2.includes('ml') || rawU2.includes('मिली')) {
      unit1Label = 'लीटर (L)';
      unit2Label = 'मिलीलीटर (mL)';
      unit1Short = 'L';
      unit2Short = 'mL';
      multiplier = 1000;
    } else if (rawU1.includes('km') || rawU1.includes('किमी')) {
      unit1Label = 'किलोमीटर (km)';
      unit2Label = 'मीटर (m)';
      unit1Short = 'km';
      unit2Short = 'm';
      multiplier = 1000;
    } else if (rawU1.includes('m') || rawU1.includes('मीटर') || rawU2.includes('cm') || rawU2.includes('सेमी')) {
      unit1Label = 'मीटर (m)';
      unit2Label = 'सेंटीमीटर (cm)';
      unit1Short = 'm';
      unit2Short = 'cm';
      multiplier = 100;
    } else if (rawU1.includes('₹') || rawU1.includes('रु') || rawU1.includes('rs') || rawU2.includes('पै') || rawU2.includes('p')) {
      unit1Label = 'रुपये (₹)';
      unit2Label = 'पैसे (p)';
      unit1Short = '₹';
      unit2Short = 'p';
      multiplier = 100;
    }

    const valA_u1 = parseInt(pairMatches[0][1], 10);
    const valA_u2 = parseInt(pairMatches[0][3], 10);
    const valB_u1 = parseInt(pairMatches[1][1], 10);
    const valB_u2 = parseInt(pairMatches[1][3], 10);

    // Detect Subtraction vs Addition
    const isSubtraction = /(?:subtract|difference|अंतर|घटा(?:एं|ओ|व)?|-|minus)/i.test(question) ||
      (/(?:subtract|difference|अंतर|घटा(?:एं|ओ|व)?|-|minus)/i.test(text) && !/(?:add|sum|total|जोड़(?:ें|ना)?|योग|\+)/i.test(question));

    const isFromStyle = /(?:from|में से)\s*\d+/i.test(question) && /(?:subtract|घटा)/i.test(question);

    if (isSubtraction) {
      let top_u1 = isFromStyle ? valB_u1 : valA_u1;
      let top_u2 = isFromStyle ? valB_u2 : valA_u2;
      let bot_u1 = isFromStyle ? valA_u1 : valB_u1;
      let bot_u2 = isFromStyle ? valA_u2 : valB_u2;

      // In elementary school subtraction, minuend (top) is the larger quantity
      if (top_u1 < bot_u1 || (top_u1 === bot_u1 && top_u2 < bot_u2)) {
        const t1 = top_u1; const t2 = top_u2;
        top_u1 = bot_u1; top_u2 = bot_u2;
        bot_u1 = t1; bot_u2 = t2;
      }

      const borrowNeeded = top_u2 < bot_u2;
      let borrowedU1 = top_u1;
      let borrowedU2 = top_u2;
      let ans_u1 = 0;
      let ans_u2 = 0;

      if (borrowNeeded) {
        borrowedU1 = top_u1 - 1;
        borrowedU2 = top_u2 + multiplier;
        ans_u2 = borrowedU2 - bot_u2;
        ans_u1 = borrowedU1 - bot_u1;
      } else {
        ans_u2 = top_u2 - bot_u2;
        ans_u1 = top_u1 - bot_u1;
      }

      const steps = [
        `कॉलम 1 (${unit2Short}): ${borrowNeeded ? `${top_u2} छोटा है ${bot_u2} से, इसलिए 1 ${unit1Short} (= ${multiplier} ${unit2Short}) उधार लिया ➔ (${top_u2} + ${multiplier} = ${borrowedU2} ${unit2Short})` : `${top_u2} − ${bot_u2} = ${ans_u2} ${unit2Short}`}`,
        borrowNeeded ? `${borrowedU2} ${unit2Short} − ${bot_u2} ${unit2Short} = ${ans_u2} ${unit2Short}` : `इकाई/ग्राम घटाव पूरा`,
        `कॉलम 2 (${unit1Short}): ${borrowNeeded ? `${top_u1} ${unit1Short} से 1 उधार देने पर ${borrowedU1} बचा ➔ ${borrowedU1} − ${bot_u1} = ${ans_u1} ${unit1Short}` : `${top_u1} − ${bot_u1} = ${ans_u1} ${unit1Short}`}`,
        `कुल अंतिम उत्तर = ${ans_u1} ${unit1Short} ${ans_u2} ${unit2Short} ✅`
      ];

      return {
        operation: '-',
        unit1Label,
        unit2Label,
        unit1Short,
        unit2Short,
        val1_u1: top_u1,
        val1_u2: top_u2,
        val2_u1: bot_u1,
        val2_u2: bot_u2,
        borrowNeeded,
        borrowedU1,
        borrowedU2,
        ans_u1,
        ans_u2,
        steps
      };
    } else {
      // Addition
      const val1_u1 = valA_u1;
      const val1_u2 = valA_u2;
      const val2_u1 = valB_u1;
      const val2_u2 = valB_u2;

      const sum_u2 = val1_u2 + val2_u2;
      const carry = Math.floor(sum_u2 / multiplier);
      const ans_u2 = sum_u2 % multiplier;
      const ans_u1 = val1_u1 + val2_u1 + carry;

      const steps = [
        `कॉलम 1 (${unit2Short}): ${val1_u2} + ${val2_u2} = ${sum_u2} ${unit2Short}`,
        carry > 0 ? `${sum_u2} ${unit2Short} = ${carry} ${unit1Short} + ${ans_u2} ${unit2Short} ➔ ${ans_u2} ${unit2Short} नीचे लिखा और ${carry} ${unit1Short} हासिल (Carry) गया` : `हासिल नहीं आई (Carry = 0)`,
        `कॉलम 2 (${unit1Short}): ${val1_u1} + ${val2_u1}${carry > 0 ? ` + ${carry} (हासिल)` : ''} = ${ans_u1} ${unit1Short}`,
        `कुल अंतिम उत्तर = ${ans_u1} ${unit1Short} ${ans_u2} ${unit2Short} ✅`
      ];

      return {
        operation: '+',
        unit1Label,
        unit2Label,
        unit1Short,
        unit2Short,
        val1_u1,
        val1_u2,
        val2_u1,
        val2_u2,
        borrowNeeded: false,
        carryU1: carry,
        ans_u1,
        ans_u2,
        steps
      };
    }
  }

  // 2. Standard 2-digit to 4-digit Column Arithmetic (e.g. 546 + 289 or 802 - 345)
  const stdMathMatch = text.match(/(\d{2,4})\s*(\+|\-)\s*(\d{2,4})/);
  if (stdMathMatch) {
    const num1 = parseInt(stdMathMatch[1], 10);
    const op = stdMathMatch[2] as '+' | '-';
    const num2 = parseInt(stdMathMatch[3], 10);

    const top = op === '-' && num1 < num2 ? num2 : num1;
    const bot = op === '-' && num1 < num2 ? num1 : num2;

    const top_u1 = Math.floor(top / 10);
    const top_u2 = top % 10;
    const bot_u1 = Math.floor(bot / 10);
    const bot_u2 = bot % 10;

    if (op === '+') {
      const sum_ones = top_u2 + bot_u2;
      const carry = Math.floor(sum_ones / 10);
      const ans_ones = sum_ones % 10;
      const ans_tens = top_u1 + bot_u1 + carry;
      const finalAns = top + bot;

      return {
        operation: '+',
        unit1Label: 'दहाई व सैकड़ा (Tens & Hundreds)',
        unit2Label: 'इकाई (Ones)',
        unit1Short: '',
        unit2Short: '',
        val1_u1: top_u1,
        val1_u2: top_u2,
        val2_u1: bot_u1,
        val2_u2: bot_u2,
        borrowNeeded: false,
        carryU1: carry,
        ans_u1: ans_tens,
        ans_u2: ans_ones,
        steps: [
          `इकाई कॉलम: ${top_u2} + ${bot_u2} = ${sum_ones} ${carry > 0 ? `➔ ${ans_ones} लिखा और ${carry} हासिल (Carry) गया` : ''}`,
          `दहाई कॉलम: ${top_u1} + ${bot_u1}${carry > 0 ? ` + ${carry} (हासिल)` : ''} = ${ans_tens}`,
          `कुल अंतिम उत्तर = ${finalAns} ✅`
        ]
      };
    } else {
      const borrowNeeded = top_u2 < bot_u2;
      const borrowedU1 = borrowNeeded ? top_u1 - 1 : top_u1;
      const borrowedU2 = borrowNeeded ? top_u2 + 10 : top_u2;
      const ans_ones = borrowedU2 - bot_u2;
      const ans_tens = borrowedU1 - bot_u1;
      const finalAns = top - bot;

      return {
        operation: '-',
        unit1Label: 'दहाई व सैकड़ा (Tens & Hundreds)',
        unit2Label: 'इकाई (Ones)',
        unit1Short: '',
        unit2Short: '',
        val1_u1: top_u1,
        val1_u2: top_u2,
        val2_u1: bot_u1,
        val2_u2: bot_u2,
        borrowNeeded,
        borrowedU1,
        borrowedU2,
        ans_u1: ans_tens,
        ans_u2: ans_ones,
        steps: [
          `इकाई कॉलम: ${borrowNeeded ? `${top_u2} छोटा है ${bot_u2} से, दहाई से 1 उधार लिया ➔ (${top_u2} + 10 = ${borrowedU2})` : `${top_u2} − ${bot_u2} = ${ans_ones}`}`,
          borrowNeeded ? `${borrowedU2} − ${bot_u2} = ${ans_ones}` : 'इकाई घटाव पूरा',
          `दहाई कॉलम: ${borrowNeeded ? `${top_u1} से 1 उधार देने पर ${borrowedU1} बचा ➔ ${borrowedU1} − ${bot_u1} = ${ans_tens}` : `${top_u1} − ${bot_u1} = ${ans_tens}`}`,
          `कुल अंतिम उत्तर = ${finalAns} ✅`
        ]
      };
    }
  }

  return null;
}

/**
 * Detects Geometry Shapes (Triangle, 3D Box/Cuboid, Rectangle, Square, Circle, Cylinder)
 */
function tryExtractGeometry(question: string, answer: string): ParsedGeometryShape | null {
  const combined = `${question} ${answer}`.toLowerCase();

  // 1. 3D Box / Cuboid (घनाभ / डिब्बा / बक्सा / कमरा / संदूक)
  const isBoxOrCuboid = /cuboid|घनाभ|बक्सा|डिब्बा|डिब्बे|कमरा|कमरे|box|room|tank|carton|संदूक|volume of (?:a )?(?:box|room|cuboid)|आयतन/i.test(combined) &&
    (/लंबाई|length/i.test(combined) || /चौड़ाई|breadth|width/i.test(combined) || /ऊँचाई|height/i.test(combined) || (combined.match(/\d+(?:\.\d+)?/g) || []).length >= 3);

  if (isBoxOrCuboid) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const length = numbers[0] || 10;
    const breadth = numbers[1] || 6;
    const height = numbers[2] || 4;
    const unitMatch = question.match(/cm|सेमी|m|मीटर|mm|मिमी/i);
    const unit = unitMatch ? unitMatch[0] : 'cm';
    const volume = length * breadth * height;
    const tsa = 2 * (length * breadth + breadth * height + height * length);

    return {
      type: 'cuboid',
      title: '3D डिब्बा / घनाभ रेखाचित्र (Cuboid Box Diagram)',
      label1: `लम्बाई (Length l) = ${length} ${unit}`,
      label2: `चौड़ाई (Breadth b) = ${breadth} ${unit}`,
      label3: `ऊँचाई (Height h) = ${height} ${unit}`,
      formula: 'आयतन (Volume) = l × b × h  |  कुल पृष्ठीय क्षेत्रफल = 2(lb + bh + hl)',
      calculation: `आयतन = ${length} × ${breadth} × ${height} = ${volume} ${unit}³  |  पृष्ठीय क्षेत्रफल = ${tsa} ${unit}²`
    };
  }

  // 2. Triangle (त्रिभुज)
  if (combined.includes('triangle') || combined.includes('त्रिभुज') || combined.includes('समकोण') || combined.includes('hypotenuse') || combined.includes('karn') || combined.includes('a2+b2') || combined.includes('पाइथागोरस')) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const base = numbers[0] || 6;
    const height = numbers[1] || 8;
    const hyp = numbers[2] || Math.round(Math.sqrt(base * base + height * height));
    const unitMatch = question.match(/cm|सेमी|m|मीटर/i);
    const unit = unitMatch ? unitMatch[0] : 'cm';

    return {
      type: 'triangle',
      title: 'त्रिभुज रेखाचित्र (Triangle Geometry)',
      label1: `आधार (Base) = ${base} ${unit}`,
      label2: `लम्ब (Height) = ${height} ${unit}`,
      label3: `कर्ण (Hypotenuse) = ${hyp} ${unit}`,
      formula: 'क्षेत्रफल (Area) = 1/2 × आधार × ऊँचाई  |  परिमाप = तीनों भुजाओं का योग',
      calculation: `क्षेत्रफल = 1/2 × ${base} × ${height} = ${(0.5 * base * height)} ${unit}²  |  परिमाप = ${base + height + hyp} ${unit}`
    };
  }

  // 3. Cylinder (बेलन / पाइप / ड्रम)
  if (combined.includes('cylinder') || combined.includes('बेलन') || combined.includes('ड्रम') || combined.includes('पाइप')) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const radius = numbers[0] || 7;
    const height = numbers[1] || 10;
    const unitMatch = question.match(/cm|सेमी|m|मीटर/i);
    const unit = unitMatch ? unitMatch[0] : 'cm';
    const volume = Math.round((22 / 7) * radius * radius * height);

    return {
      type: 'cylinder',
      title: 'बेलन रेखाचित्र (Cylinder Geometry)',
      label1: `त्रिज्या (Radius r) = ${radius} ${unit}`,
      label2: `ऊँचाई (Height h) = ${height} ${unit}`,
      formula: 'आयतन (Volume) = πr²h  |  वक्र पृष्ठ = 2πrh',
      calculation: `आयतन = 22/7 × ${radius}² × ${height} = ${volume} ${unit}³`
    };
  }

  // 4. Rectangle / Square (आयत / वर्ग)
  if (combined.includes('rectangle') || combined.includes('आयत') || combined.includes('square') || combined.includes('वर्ग') || combined.includes('perimeter of field') || combined.includes('area of room') || (combined.includes('लंबाई') && combined.includes('चौड़ाई'))) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const length = numbers[0] || 10;
    const breadth = numbers[1] || 6;
    const isSquare = combined.includes('square') || combined.includes('वर्ग') || length === breadth;
    const unitMatch = question.match(/cm|सेमी|m|मीटर/i);
    const unit = unitMatch ? unitMatch[0] : 'm';

    return {
      type: isSquare ? 'square' : 'rectangle',
      title: isSquare ? 'वर्ग रेखाचित्र (Square Shape)' : 'आयत रेखाचित्र (Rectangle Shape)',
      label1: isSquare ? `भुजा (Side) = ${length} ${unit}` : `लंबाई (Length) = ${length} ${unit}`,
      label2: isSquare ? `भुजा (Side) = ${length} ${unit}` : `चौड़ाई (Breadth) = ${breadth} ${unit}`,
      formula: isSquare ? 'क्षेत्रफल = भुजा²  |  परिमाप = 4 × भुजा' : 'क्षेत्रफल = लंबाई × चौड़ाई  |  परिमाप = 2(लंबाई + चौड़ाई)',
      calculation: isSquare
        ? `क्षेत्रफल = ${length} × ${length} = ${length * length} ${unit}²  |  परिमाप = 4 × ${length} = ${4 * length} ${unit}`
        : `क्षेत्रफल = ${length} × ${breadth} = ${length * breadth} ${unit}²  |  परिमाप = 2(${length} + ${breadth}) = ${2 * (length + breadth)} ${unit}`
    };
  }

  // 5. Circle (वृत्त)
  if (combined.includes('circle') || combined.includes('वृत्त') || combined.includes('radius') || combined.includes('त्रिज्या') || combined.includes('diameter') || combined.includes('व्यास')) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const radius = numbers[0] || 7;
    const unitMatch = question.match(/cm|सेमी|m|मीटर/i);
    const unit = unitMatch ? unitMatch[0] : 'cm';
    const circum = Math.round(2 * (22 / 7) * radius);
    const area = Math.round((22 / 7) * radius * radius);

    return {
      type: 'circle',
      title: 'वृत्त रेखाचित्र (Circle Diagram)',
      label1: `त्रिज्या (Radius r) = ${radius} ${unit}`,
      label2: `व्यास (Diameter d) = ${radius * 2} ${unit}`,
      formula: 'परिधि (Circumference) = 2πr  |  क्षेत्रफल (Area) = πr²',
      calculation: `परिधि = 2 × 22/7 × ${radius} = ${circum} ${unit}  |  क्षेत्रफल = ${area} ${unit}²`
    };
  }

  return null;
}

export const VisualMathDiagramCard: React.FC<VisualMathDiagramCardProps> = ({
  question,
  answer,
  isDarkMode = false,
  medium = 'hindi'
}) => {
  const columnMath = tryExtractArithmetic(question, answer);
  const geometry = tryExtractGeometry(question, answer);

  return (
    <div className={`mt-2.5 rounded-2xl border transition-all overflow-hidden ${
      isDarkMode
        ? 'bg-slate-950/90 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
    }`}>
      {/* 1. If Column Arithmetic Detected (kg & g, L & mL, m & cm, etc.) */}
      {columnMath ? (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Calculator className="w-3.5 h-3.5" />
              <span>स्कूल कॉपी जैसी कॉलम विधि (Notebook Column Method):</span>
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              {columnMath.operation === '-' ? 'घटाव (Subtraction)' : 'जोड़ (Addition)'}
            </span>
          </div>

          {/* Authentic Clean School Notebook Grid (Standard Education Workbook Aesthetic) */}
          <div className="relative rounded-2xl border-2 border-indigo-100 dark:border-slate-800 bg-[#fbfdff] dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm overflow-hidden">
            {/* Subtle Notebook Blue Horizontal Ruled Lines Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)',
                backgroundPosition: '0 12px'
              }}
            />

            {/* Notebook Red Margin Line on Far Left */}
            <div className="absolute top-0 bottom-0 left-4 sm:left-6 w-0.5 bg-rose-400/40 pointer-events-none" />

            <div className="relative z-10 pl-4 sm:pl-6 max-w-lg mx-auto font-mono text-base sm:text-lg font-black">
              {/* Unit Headers */}
              <div className="grid grid-cols-2 text-center pb-2 border-b-2 border-slate-800 dark:border-slate-200 text-xs sm:text-sm font-sans text-indigo-900 dark:text-indigo-200 font-extrabold uppercase tracking-wide">
                <div className="border-r-2 border-slate-300 dark:border-slate-700 pb-1">
                  {columnMath.unit1Label}
                </div>
                <div className="pb-1">
                  {columnMath.unit2Label}
                </div>
              </div>

              {/* Subtraction Borrow Row (उधार पंक्ति) */}
              {columnMath.operation === '-' && columnMath.borrowNeeded && (
                <div className="grid grid-cols-2 text-center py-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/15 rounded-lg my-1.5 border border-amber-300 dark:border-amber-800">
                  <div className="border-r-2 border-slate-300 dark:border-slate-700 flex items-center justify-end pr-8 gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-300 dark:bg-amber-900/90 font-black text-amber-950 dark:text-amber-100 shadow-2xs">
                      {columnMath.borrowedU1}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through font-semibold">{columnMath.val1_u1}</span>
                  </div>
                  <div className="flex items-center justify-end pr-6 gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-300 dark:bg-amber-900/90 font-black text-amber-950 dark:text-amber-100 shadow-2xs">
                      {columnMath.borrowedU2}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through font-semibold">{columnMath.val1_u2}</span>
                  </div>
                </div>
              )}

              {/* Addition Carry Row (हासिल पंक्ति) */}
              {columnMath.operation === '+' && (columnMath.carryU1 ?? 0) > 0 && (
                <div className="grid grid-cols-2 text-center py-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/15 rounded-lg my-1.5 border border-amber-300 dark:border-amber-800">
                  <div className="border-r-2 border-slate-300 dark:border-slate-700 flex items-center justify-end pr-8">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-300 dark:bg-amber-900/90 font-black text-xs text-amber-950 dark:text-amber-100 shadow-2xs">
                      +{columnMath.carryU1} (हासिल)
                    </span>
                  </div>
                  <div className="flex items-center justify-end pr-6 text-slate-400 text-xs">
                    —
                  </div>
                </div>
              )}

              {/* Operand 1 Row */}
              <div className="grid grid-cols-2 text-right py-2 px-4 tracking-[0.2em] text-slate-900 dark:text-slate-100 text-xl sm:text-2xl font-black">
                <div className="border-r-2 border-slate-300 dark:border-slate-700 pr-8">
                  {columnMath.val1_u1}
                </div>
                <div className="pr-6">
                  {columnMath.val1_u2}
                </div>
              </div>

              {/* Operand 2 Row with Sign */}
              <div className="grid grid-cols-2 text-right py-2 px-4 tracking-[0.2em] text-slate-900 dark:text-slate-100 text-xl sm:text-2xl font-black relative">
                <span className="absolute left-2 sm:left-4 top-2 text-2xl font-black text-rose-600">
                  {columnMath.operation}
                </span>
                <div className="border-r-2 border-slate-300 dark:border-slate-700 pr-8">
                  {columnMath.val2_u1}
                </div>
                <div className="pr-6">
                  {columnMath.val2_u2}
                </div>
              </div>

              {/* Main Division Horizontal Line */}
              <div className="border-b-2 border-slate-800 dark:border-slate-200 my-1" />

              {/* Final Answer Row with Double Underline */}
              <div className="grid grid-cols-2 text-right py-2 px-4 tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-black text-xl sm:text-2xl bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl my-1">
                <div className="border-r-2 border-emerald-300 dark:border-emerald-800 pr-8">
                  {columnMath.ans_u1} <span className="text-xs font-sans font-bold">{columnMath.unit1Short}</span>
                </div>
                <div className="pr-6">
                  {columnMath.ans_u2} <span className="text-xs font-sans font-bold">{columnMath.unit2Short}</span>
                </div>
              </div>
              <div className="border-b-4 border-double border-emerald-600/80 my-1" />
            </div>

            {/* Step-by-Step Teacher Explanation in Clean Card */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 font-sans text-xs bg-white dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="font-extrabold text-indigo-700 dark:text-indigo-300 uppercase text-[11px] flex items-center gap-1.5">
                <span>💡</span>
                <span>{medium === 'english' ? "Teacher's Step-by-Step Solution:" : "शर्मा सर की चरणबद्ध समझ (Step Solution):"}</span>
              </span>
              <div className="space-y-1.5">
                {columnMath.steps.map((st, sIdx) => (
                  <p key={sIdx} className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-600 font-black shrink-0">✓</span>
                    <span>{st}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : geometry ? (
        /* 2. Geometry Shape Detected (Triangle, 3D Box, Rectangle, Square, Circle, Cylinder) */
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              {geometry.type === 'cuboid' ? (
                <Box className="w-3.5 h-3.5" />
              ) : (
                <TriangleIcon className="w-3.5 h-3.5" />
              )}
              <span>{geometry.title}</span>
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              गणित रेखाचित्र (Geometry Shape)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Left: Authentic SVG Diagram */}
            <div className="md:col-span-5 flex items-center justify-center p-2">
              {/* 3D Box / Cuboid */}
              {geometry.type === 'cuboid' && (
                <svg viewBox="0 0 220 160" className="w-52 h-38">
                  {/* Top Face */}
                  <polygon points="35,55 80,25 185,25 140,55" fill="rgba(99, 102, 241, 0.25)" stroke="#4f46e5" strokeWidth="2.5" />
                  {/* Front Face */}
                  <polygon points="35,55 140,55 140,120 35,120" fill="rgba(99, 102, 241, 0.15)" stroke="#4f46e5" strokeWidth="2.5" />
                  {/* Right Face */}
                  <polygon points="140,55 185,25 185,90 140,120" fill="rgba(99, 102, 241, 0.35)" stroke="#4f46e5" strokeWidth="2.5" />
                  {/* Dashed hidden back lines */}
                  <polyline points="35,120 80,90 185,90" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1="80" y1="25" x2="80" y2="90" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                  {/* Dimension Labels */}
                  <text x="87" y="138" textAnchor="middle" className="text-[10px] font-black fill-indigo-700 dark:fill-indigo-300 font-mono">
                    {geometry.label1 || 'लम्बाई (l)'}
                  </text>
                  <text x="135" y="18" textAnchor="middle" className="text-[10px] font-black fill-emerald-600 dark:fill-emerald-400 font-mono">
                    {geometry.label2 || 'चौड़ाई (b)'}
                  </text>
                  <text x="195" y="60" textAnchor="middle" className="text-[10px] font-black fill-amber-600 dark:fill-amber-400 font-mono">
                    {geometry.label3 || 'ऊँचाई (h)'}
                  </text>
                </svg>
              )}

              {/* Triangle Shape */}
              {geometry.type === 'triangle' && (
                <svg viewBox="0 0 200 160" className="w-48 h-36">
                  {/* Triangle Path */}
                  <polygon
                    points="30,130 170,130 170,30"
                    fill="rgba(99, 102, 241, 0.15)"
                    stroke="#4f46e5"
                    strokeWidth="3"
                  />
                  {/* Right Angle Corner Square */}
                  <rect x="155" y="115" width="15" height="15" fill="none" stroke="#4f46e5" strokeWidth="2" />
                  {/* Vertices */}
                  <circle cx="30" cy="130" r="4" fill="#ef4444" />
                  <text x="15" y="145" className="text-xs font-bold fill-slate-700 dark:fill-slate-200">A</text>
                  <circle cx="170" cy="130" r="4" fill="#ef4444" />
                  <text x="178" y="145" className="text-xs font-bold fill-slate-700 dark:fill-slate-200">B</text>
                  <circle cx="170" cy="30" r="4" fill="#ef4444" />
                  <text x="175" y="25" className="text-xs font-bold fill-slate-700 dark:fill-slate-200">C</text>
                  {/* Side Labels */}
                  <text x="90" y="148" textAnchor="middle" className="text-[10px] font-black fill-indigo-700 dark:fill-indigo-300 font-mono">
                    {geometry.label1 || 'आधार (Base)'}
                  </text>
                  <text x="188" y="85" textAnchor="middle" className="text-[10px] font-black fill-emerald-600 font-mono" transform="rotate(90, 188, 85)">
                    {geometry.label2 || 'लम्ब (Height)'}
                  </text>
                  <text x="90" y="70" textAnchor="middle" className="text-[10px] font-black fill-amber-600 font-mono">
                    {geometry.label3 || 'कर्ण (Hypotenuse)'}
                  </text>
                </svg>
              )}

              {/* Cylinder Shape */}
              {geometry.type === 'cylinder' && (
                <svg viewBox="0 0 200 160" className="w-48 h-36">
                  <path d="M 50 40 L 50 120 A 50 15 0 0 0 150 120 L 150 40 Z" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2.5" />
                  <ellipse cx="100" cy="40" rx="50" ry="15" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2.5" />
                  <path d="M 50 120 A 50 15 0 0 1 150 120" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1="100" y1="40" x2="150" y2="40" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2,2" />
                  <circle cx="100" cy="40" r="3" fill="#ef4444" />
                  <text x="125" y="34" textAnchor="middle" className="text-[10px] font-black fill-amber-600 dark:fill-amber-400 font-mono">r</text>
                  <text x="32" y="85" textAnchor="middle" className="text-[10px] font-black fill-emerald-700 dark:fill-emerald-300 font-mono" transform="rotate(-90, 32, 85)">
                    {geometry.label2 || 'ऊँचाई (h)'}
                  </text>
                </svg>
              )}

              {/* Rectangle / Square Shape */}
              {(geometry.type === 'rectangle' || geometry.type === 'square') && (
                <svg viewBox="0 0 200 140" className="w-48 h-32">
                  <rect
                    x="25"
                    y="25"
                    width={geometry.type === 'square' ? 90 : 150}
                    height="90"
                    fill="rgba(16, 185, 129, 0.15)"
                    stroke="#10b981"
                    strokeWidth="3"
                    rx="4"
                  />
                  {/* Corner right-angles */}
                  <path d="M 35 25 L 35 35 L 25 35" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <path d="M 165 25 L 165 35 L 175 35" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <path d="M 35 115 L 35 105 L 25 105" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <path d="M 165 115 L 165 105 L 175 105" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  {/* Labels */}
                  <text x="100" y="16" textAnchor="middle" className="text-[11px] font-black fill-emerald-700 dark:fill-emerald-300 font-mono">
                    {geometry.label1 || 'लंबाई (Length)'}
                  </text>
                  <text x="15" y="75" textAnchor="middle" className="text-[11px] font-black fill-emerald-700 dark:fill-emerald-300 font-mono" transform="rotate(-90, 15, 75)">
                    {geometry.label2 || 'चौड़ाई (Breadth)'}
                  </text>
                </svg>
              )}

              {/* Circle Shape */}
              {geometry.type === 'circle' && (
                <svg viewBox="0 0 160 160" className="w-36 h-36">
                  <circle cx="80" cy="80" r="60" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="3" />
                  <circle cx="80" cy="80" r="4" fill="#ef4444" />
                  <text x="75" y="75" className="text-xs font-bold fill-slate-700 dark:fill-slate-200">O</text>
                  {/* Radius line */}
                  <line x1="80" y1="80" x2="140" y2="80" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
                  <text x="110" y="73" textAnchor="middle" className="text-[11px] font-black fill-amber-700 dark:fill-amber-300 font-mono">
                    {geometry.label1 || 'त्रिज्या r'}
                  </text>
                </svg>
              )}
            </div>

            {/* Right: Formulas & Values */}
            <div className="md:col-span-7 space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
                <span className="font-extrabold text-indigo-700 dark:text-indigo-300 text-[10px] uppercase block mb-0.5">
                  📐 मुख्य सूत्र (Formula):
                </span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{geometry.formula}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-[10px] uppercase block mb-0.5">
                  ✅ हल व मान (Calculation & Solution):
                </span>
                <p className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">{geometry.calculation}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Standard Textbook Answer (Full Width, No Squishing!) */
        <div className="p-3.5 sm:p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{medium === 'english' ? 'Standard Textbook Solution:' : 'किताब के अनुसार सही हल व उत्तर:'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualMathDiagramCard;

