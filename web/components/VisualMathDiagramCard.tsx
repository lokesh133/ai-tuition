'use client';

import React, { useState } from 'react';
import { Sparkles, Calculator, CheckCircle2, ChevronRight, Triangle as TriangleIcon, Square, Circle, Box, ZoomIn, X, Shapes, Eye } from 'lucide-react';

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
  type:
    | 'triangle'
    | 'rectangle'
    | 'square'
    | 'circle'
    | 'cuboid'
    | 'cylinder'
    | 'pyramid'
    | 'table'
    | 'pentagon'
    | 'hexagon'
    | 'cube'
    | 'cone'
    | 'angle'
    | 'fraction';
  title: string;
  label1?: string;
  label2?: string;
  label3?: string;
  formula: string;
  calculation: string;
  tableData?: { headers: string[]; rows: string[][] };
  pyramidData?: { tiers: number[][] };
  fractionData?: { numerator: number; denominator: number };
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

  // 6. Math Number Pyramid (संख्या पिरामिड / पहेली टॉवर)
  if (combined.includes('pyramid') || combined.includes('पिरामिड') || combined.includes('number tower') || combined.includes('संख्या टॉवर') || combined.includes('ब्लॉक') || combined.includes('tower')) {
    const numbers = (question.match(/\d+/g) || answer.match(/\d+/g) || []).map(Number);
    const n1 = numbers[0] || 5;
    const n2 = numbers[1] || 10;
    const n3 = numbers[2] || 15;
    const mid1 = n1 + n2;
    const mid2 = n2 + n3;
    const top = mid1 + mid2;

    return {
      type: 'pyramid',
      title: 'गणित संख्या पिरामिड (Number Pyramid Diagram)',
      label1: `आधार ब्लॉक: ${n1}, ${n2}, ${n3}`,
      label2: `मध्यम ब्लॉक: ${mid1}, ${mid2}`,
      label3: `शीर्ष ब्लॉक = ${top}`,
      formula: 'नियम: नीचे के दो पास-पास वाले ब्लॉकों को जोड़कर ऊपर का ब्लॉक बनता है।',
      calculation: `नीचे: [${n1}] + [${n2}] = [${mid1}]  तथा  [${n2}] + [${n3}] = [${mid2}] ➔ शीर्ष: [${mid1}] + [${mid2}] = ${top} ✅`,
      pyramidData: {
        tiers: [
          [top],
          [mid1, mid2],
          [n1, n2, n3]
        ]
      }
    };
  }

  // 7. Table Format (तालिका / सारणी / Data Table)
  if (combined.includes('table') || combined.includes('तालिका') || combined.includes('सारणी') || combined.includes('frequency') || combined.includes('chart') || combined.includes('आँकड़े') || combined.includes('data')) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const v1 = numbers[0] || 12;
    const v2 = numbers[1] || 18;
    const v3 = numbers[2] || 24;
    const total = v1 + v2 + v3;

    return {
      type: 'table',
      title: 'गणित तालिका / सारणी (Data Table Diagram)',
      label1: 'क्रमबद्ध आँकड़े (Tabular Data)',
      label2: `कुल प्रविष्टियाँ: ${Math.max(3, numbers.length)}`,
      formula: 'सारणी नियम: मद (Item) और मान (Value) का क्रमबद्ध विश्लेषण',
      calculation: `तालिका मान: ${v1}, ${v2}, ${v3} ➔ कुल योग (Total Sum) = ${total} ✅`,
      tableData: {
        headers: ['क्र.सं. (S.No)', 'मद / विवरण (Item)', 'संख्या / मान (Value)'],
        rows: [
          ['1', 'प्रथम मद (Item 1)', `${v1}`],
          ['2', 'द्वितीय मद (Item 2)', `${v2}`],
          ['3', 'तृतीय मद (Item 3)', `${v3}`],
          ['कुल (Total)', 'कुल योग (Sum)', `${total}`]
        ]
      }
    };
  }

  // 8. Pentagon (पंचभुज - 5 sides)
  if (combined.includes('pentagon') || combined.includes('पंचभुज') || (combined.includes('5 भुजा') || combined.includes('5 sides'))) {
    return {
      type: 'pentagon',
      title: 'पंचभुज रेखाचित्र (Regular Pentagon Shape)',
      label1: '5 समान भुजाएँ (5 Equal Sides)',
      label2: '5 शीर्ष (5 Vertices) व 5 आंतरिक कोण',
      formula: 'आंतरिक कोणों का योग = (5 - 2) × 180° = 540° | प्रत्येक कोण = 108°',
      calculation: 'भुजाओं की संख्या = 5 | परिमाप = 5 × भुजा (Side)',
    };
  }

  // 9. Hexagon (षट्भुज - 6 sides)
  if (combined.includes('hexagon') || combined.includes('षट्भुज') || combined.includes('6 भुजा') || combined.includes('6 sides')) {
    return {
      type: 'hexagon',
      title: 'षट्भुज रेखाचित्र (Regular Hexagon Shape)',
      label1: '6 समान भुजाएँ (6 Equal Sides)',
      label2: '6 शीर्ष (6 Vertices)',
      formula: 'आंतरिक कोणों का योग = (6 - 2) × 180° = 720° | प्रत्येक कोण = 120°',
      calculation: 'भुजाओं की संख्या = 6 | परिमाप = 6 × भुजा (Side)',
    };
  }

  // 10. Cube (घन - 3D Cube)
  if (combined.includes('cube') || combined.includes('घन') || combined.includes('पासा') || combined.includes('dice')) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const side = numbers[0] || 5;
    const unitMatch = question.match(/cm|सेमी|m|मीटर/i);
    const unit = unitMatch ? unitMatch[0] : 'cm';
    const volume = side * side * side;
    const tsa = 6 * side * side;

    return {
      type: 'cube',
      title: '3D घन रेखाचित्र (Cube Geometry)',
      label1: `भुजा (Side a) = ${side} ${unit}`,
      label2: `6 वर्गाकार फलक (Faces), 12 किनारे (Edges)`,
      formula: 'आयतन = a³ | कुल पृष्ठीय क्षेत्रफल = 6a²',
      calculation: `आयतन = ${side}³ = ${volume} ${unit}³ | पृष्ठीय क्षेत्रफल = 6 × ${side}² = ${tsa} ${unit}²`,
    };
  }

  // 11. Cone (शंकु)
  if (combined.includes('cone') || combined.includes('शंकु') || combined.includes('जोकर की टोपी') || combined.includes('आइसक्रीम')) {
    const numbers = (question.match(/\d+(?:\.\d+)?/g) || answer.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const radius = numbers[0] || 3;
    const height = numbers[1] || 4;
    const unitMatch = question.match(/cm|सेमी|m|मीटर/i);
    const unit = unitMatch ? unitMatch[0] : 'cm';
    const slant = Math.round(Math.sqrt(radius * radius + height * height));
    const volume = Math.round((1 / 3) * (22 / 7) * radius * radius * height);

    return {
      type: 'cone',
      title: 'शंकु रेखाचित्र (Cone Geometry)',
      label1: `त्रिज्या (r) = ${radius} ${unit}`,
      label2: `ऊँचाई (h) = ${height} ${unit}`,
      label3: `तिर्यक ऊँचाई (l) = ${slant} ${unit}`,
      formula: 'आयतन = 1/3 πr²h | तिर्यक ऊँचाई l = √(r² + h²)',
      calculation: `आयतन ≈ ${volume} ${unit}³ | तिर्यक ऊँचाई = ${slant} ${unit}`,
    };
  }

  // 12. Angle (कोण)
  if (combined.includes('angle') || combined.includes('कोण') || combined.includes('न्यूनकोण') || combined.includes('अधिककोण') || combined.includes('समकोण') || combined.includes('डिग्री') || combined.includes('°')) {
    const numbers = (question.match(/\d+/g) || answer.match(/\d+/g) || []).map(Number);
    const deg = numbers[0] || 90;
    const angleType = deg === 90 ? 'समकोण (Right Angle)' : deg < 90 ? 'न्यूनकोण (Acute Angle)' : 'अधिककोण (Obtuse Angle)';

    return {
      type: 'angle',
      title: `कोण रेखाचित्र (${angleType})`,
      label1: `माप = ${deg}°`,
      label2: angleType,
      formula: 'न्यूनकोण < 90° | समकोण = 90° | अधिककोण > 90° व < 180°',
      calculation: `दिया गया कोण = ${deg}° ➔ यह एक ${angleType} है ✅`,
    };
  }

  // 13. Fraction (भिन्न)
  if (combined.includes('fraction') || combined.includes('भिन्न') || combined.includes('अंश') || combined.includes('हर') || /\b\d+\/\d+\b/.test(combined)) {
    const fMatch = combined.match(/(\d+)\s*\/\s*(\d+)/);
    const num = fMatch ? parseInt(fMatch[1], 10) : 1;
    const den = fMatch ? parseInt(fMatch[2], 10) : 4;

    return {
      type: 'fraction',
      title: 'भिन्न रेखाचित्र (Visual Fraction Diagram)',
      label1: `अंश (Numerator) = ${num}`,
      label2: `हर (Denominator) = ${den}`,
      formula: 'भिन्न = छायांकित भाग (Shaded) / कुल बराबर भाग (Total Parts)',
      calculation: `${den} बराबर भागों में से ${num} भाग रंगे हुए ➔ भिन्न = ${num}/${den} ✅`,
      fractionData: { numerator: num, denominator: den },
    };
  }

  return null;
}


const PERIMETER_FIGURES = [
  {
    id: 'a',
    titleHi: 'आकृति (a): T-आकार बहुभुज (8 भुजाएँ)',
    titleEn: 'Figure (a): T-Shaped Polygon (8 sides)',
    imgSrc: '/worksheet-diagrams/q6_a.jpg',
    sidesHi: '8 cm, 5 cm, 2 cm, 3 cm, 2 cm, 3 cm, 2 cm, 4 cm',
    sidesEn: '8 cm, 5 cm, 2 cm, 3 cm, 2 cm, 3 cm, 2 cm, 4 cm',
    formulaHi: 'परिमाप = सभी 8 बाहरी भुजाओं का कुल योग',
    formulaEn: 'Perimeter = Sum of all 8 outer sides',
    calcHi: '8 cm + 5 cm + 2 cm + 3 cm + 2 cm + 3 cm + 2 cm + 4 cm = 29 cm',
    calcEn: '8 cm + 5 cm + 2 cm + 3 cm + 2 cm + 3 cm + 2 cm + 4 cm = 29 cm',
    ans: '29 cm',
    descHi: 'सभी 8 बाहरी भुजाओं को जोड़ने पर: 8 + 5 + 2 + 3 + 2 + 3 + 2 + 4 = 29 cm कुल परिमाप आता है।',
    descEn: 'Adding all 8 outer sides: 8 + 5 + 2 + 3 + 2 + 3 + 2 + 4 = 29 cm total perimeter.',
  },
  {
    id: 'b',
    titleHi: 'आकृति (b): स्वास्तिक बहुभुज (20 भुजाएँ / 4 समान शाखाएँ)',
    titleEn: 'Figure (b): Swastik Polygon (20 sides / 4 symmetric arms)',
    imgSrc: '/worksheet-diagrams/q6_b.jpg',
    sidesHi: 'प्रत्येक शाखा: 5 cm + 1 cm + 4 cm + 3 cm + 4 cm = 17 cm',
    sidesEn: 'Each arm: 5 cm + 1 cm + 4 cm + 3 cm + 4 cm = 17 cm',
    formulaHi: 'परिमाप = 4 समान शाखाओं का योग = 4 × 17 cm',
    formulaEn: 'Perimeter = 4 symmetric arms = 4 × 17 cm',
    calcHi: '4 × (5 + 1 + 4 + 3 + 4) cm = 4 × 17 cm = 68 cm',
    calcEn: '4 × (5 + 1 + 4 + 3 + 4) cm = 4 × 17 cm = 68 cm',
    ans: '68 cm',
    descHi: 'चारों शाखाएँ समान हैं, प्रत्येक शाखा का योग 17 cm है। कुल परिमाप 4 × 17 = 68 cm है।',
    descEn: 'Four symmetric arms of 17 cm each. Total perimeter = 4 × 17 = 68 cm.',
  },
  {
    id: 'c',
    titleHi: 'आकृति (c): षट्भुज (Hexagon - 6 भुजाएँ)',
    titleEn: 'Figure (c): Hexagon (6-sided Polygon)',
    imgSrc: '/worksheet-diagrams/q6_c.jpg',
    sidesHi: '16 m, 12 m, 18 m, 14 m, 15 m, 20 m',
    sidesEn: '16 m, 12 m, 18 m, 14 m, 15 m, 20 m',
    formulaHi: 'परिमाप = षट्भुज की सभी 6 भुजाओं का योग',
    formulaEn: 'Perimeter = Sum of all 6 sides of hexagon',
    calcHi: '16 m + 12 m + 18 m + 14 m + 15 m + 20 m = 95 m',
    calcEn: '16 m + 12 m + 18 m + 14 m + 15 m + 20 m = 95 m',
    ans: '95 m',
    descHi: 'षट्भुज की सभी 6 भुजाओं को जोड़ने पर: 16 + 12 + 18 + 14 + 15 + 20 = 95 मीटर (m) कुल परिमाप है।',
    descEn: 'Adding all 6 sides: 16 + 12 + 18 + 14 + 15 + 20 = 95 metres (m) total perimeter.',
  },
  {
    id: 'd',
    titleHi: 'आकृति (d): चतुर्भुज (Quadrilateral - 4 भुजाएँ)',
    titleEn: 'Figure (d): Quadrilateral (4 sides)',
    imgSrc: '/worksheet-diagrams/q6_d.jpg',
    sidesHi: '7 cm, 8 cm, 5 cm, 6 cm',
    sidesEn: '7 cm, 8 cm, 5 cm, 6 cm',
    formulaHi: 'परिमाप = चारों भुजाओं का योग',
    formulaEn: 'Perimeter = Sum of all 4 sides',
    calcHi: '7 cm + 8 cm + 5 cm + 6 cm = 26 cm',
    calcEn: '7 cm + 8 cm + 5 cm + 6 cm = 26 cm',
    ans: '26 cm',
    descHi: 'चारों भुजाओं को जोड़ने पर: 7 + 8 + 5 + 6 = 26 cm कुल परिमाप है।',
    descEn: 'Adding all 4 sides: 7 + 8 + 5 + 6 = 26 cm total perimeter.',
  },
];

export const VisualMathDiagramCard: React.FC<VisualMathDiagramCardProps> = ({
  question,
  answer,
  isDarkMode = false,
  medium = 'hindi'
}) => {
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const columnMath = tryExtractArithmetic(question, answer);
  const geometry = tryExtractGeometry(question, answer);

  const isPerimeterQ = Boolean(
    /perimeter|परिमाप/i.test(`${question} ${answer}`) &&
    (!geometry || geometry.type === 'hexagon' || geometry.type === 'pentagon' || /q\.?6\b|fig|आकृति|चित्र|shape|षट्भुज|चतुर्भुज|hexagon|swastik|8\s*cm|20\s*m|7\s*cm/i.test(`${question} ${answer}`))
  );

  // If called in question box with no answer and no valid diagram detected, suppress empty card
  if (!columnMath && !geometry && !isPerimeterQ && (!answer || !answer.trim())) {
    return null;
  }

  return (
    <>
      {/* High-Resolution Diagram Zoom Modal */}
      {zoomedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImg(null)}
        >
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl p-4 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-blue-600" />
                {medium === 'english' ? 'High-Resolution Diagram View' : 'उच्च-गुणवत्ता रेखाचित्र (High-Res View)'}
              </span>
              <button
                type="button"
                onClick={() => setZoomedImg(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center w-full max-h-[75vh] overflow-auto">
              <img
                src={zoomedImg}
                alt="Enlarged Diagram"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-sm border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Diagram Card Container */}
      <div className={`mt-2.5 rounded-2xl border transition-all overflow-hidden ${
        isDarkMode
          ? 'bg-slate-950/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-xs'
      }`}>
        {/* Multi-Figure Perimeter Section */}
        {isPerimeterQ ? (
          <div className="p-3.5 sm:p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-indigo-100 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                <Shapes className="w-4 h-4 text-indigo-600" />
                <span>
                  {medium === 'english'
                    ? (!answer || !answer.trim() ? 'Worksheet Figures: Q.6 Find the perimeter' : 'Q.6 Perimeter Solutions (Step-by-Step)')
                    : (!answer || !answer.trim() ? 'अभ्यास आकृतियाँ: प्रश्न 6 (परिमाप ज्ञात कीजिए)' : 'प्रश्न 6 परिमाप का संपूर्ण सचित्र हल (विस्तार से)')}
                </span>
              </span>
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {medium === 'english' ? '4 Worksheet Figures' : '4 मूल आकृतियाँ'}
              </span>
            </div>

            {/* Mode A: Question View (When answer is empty in question box) */}
            {!answer || !answer.trim() ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {medium === 'english'
                    ? 'Find the perimeter of each shape given below by adding all its boundary sides:'
                    : 'नीचे दी गई प्रत्येक आकृति के सभी बाहरी किनारों की लंबाइयों को जोड़कर परिमाप ज्ञात कीजिए:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {PERIMETER_FIGURES.map((fig) => (
                    <div
                      key={fig.id}
                      className="rounded-xl border border-indigo-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 flex flex-col justify-between hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs font-black text-indigo-900 dark:text-indigo-300">
                          {medium === 'english' ? fig.titleEn : fig.titleHi}
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoomedImg(fig.imgSrc)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 cursor-pointer"
                          title="बड़ा करके देखें"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{medium === 'english' ? 'Zoom' : 'बड़ा देखें'}</span>
                        </button>
                      </div>
                      <div
                        className="my-2.5 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer group relative overflow-hidden h-40"
                        onClick={() => setZoomedImg(fig.imgSrc)}
                      >
                        <img
                          src={fig.imgSrc}
                          alt={fig.titleEn}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-blue-700 text-[10px] font-extrabold px-2 py-1 rounded-md shadow-xs flex items-center gap-1">
                            <ZoomIn className="w-3 h-3" /> {medium === 'english' ? 'Click to zoom' : 'क्लिक करके बड़ा देखें'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">
                          {medium === 'english' ? 'Given Sides:' : 'दिए गए माप:'}
                        </span>
                        <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {medium === 'english' ? fig.sidesEn : fig.sidesHi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Mode B: Detailed Solution View */
              <div className="space-y-4">
                {/* Master Rule Banner */}
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-extrabold text-indigo-900 dark:text-indigo-200 block mb-0.5">
                      {medium === 'english' ? 'Master Formula & Rule:' : 'परिमाप का मूल नियम (Master Formula):'}
                    </span>
                    <p className="font-medium text-indigo-950 dark:text-indigo-200">
                      {medium === 'english'
                        ? 'Perimeter of any closed 2D shape = Sum of the lengths of all its boundary sides.'
                        : 'किसी भी बंद समतल आकृति का परिमाप = उसकी सभी बाहरी भुजाओं (sides) की लम्बाइयों का योग।'}
                    </p>
                  </div>
                </div>

                {/* 4 Detailed Solution Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {PERIMETER_FIGURES.map((fig) => (
                    <div
                      key={fig.id}
                      className="rounded-xl border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {medium === 'english' ? fig.titleEn : fig.titleHi}
                        </span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                          {medium === 'english' ? 'Ans: ' : 'उत्तर: '}{fig.ans}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div
                          className="w-24 h-24 shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
                          onClick={() => setZoomedImg(fig.imgSrc)}
                          title="क्लिक करके बड़ा देखें"
                        >
                          <img
                            src={fig.imgSrc}
                            alt={fig.titleEn}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5 text-[11px]">
                          <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 block text-[10px] uppercase">
                              {medium === 'english' ? 'Formula:' : 'सूत्र:'}
                            </span>
                            <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                              {medium === 'english' ? fig.formulaEn : fig.formulaHi}
                            </p>
                          </div>

                          <div className="p-1.5 rounded-md bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-[10px] uppercase">
                              {medium === 'english' ? 'Calculation:' : 'गणना (हल):'}
                            </span>
                            <p className="font-mono font-black text-emerald-900 dark:text-emerald-200 leading-snug">
                              {medium === 'english' ? fig.calcEn : fig.calcHi}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {medium === 'english' ? fig.descEn : fig.descHi}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Quick Summary Pill Bar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{medium === 'english' ? 'Final Answers Summary:' : 'अंतिम उत्तर सारांश:'}</span>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap font-mono font-bold">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">(a) 29 cm</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">(b) 68 cm</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">(c) 95 m</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">(d) 26 cm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : columnMath ? (
          /* 1. If Column Arithmetic Detected (kg & g, L & mL, m & cm, etc.) */
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
          <div className="relative rounded-2xl border-2 border-indigo-100 dark:border-slate-800 bg-[#fbfdff] dark:bg-slate-900/90 p-3 sm:p-6 shadow-sm overflow-x-auto">
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

            <div className="relative z-10 pl-2 sm:pl-6 min-w-max mx-auto font-mono text-base sm:text-lg font-black">
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

              {/* Number Pyramid Shape */}
              {geometry.type === 'pyramid' && (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  {geometry.pyramidData?.tiers.map((tier, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2">
                      {tier.map((val, cIdx) => (
                        <div
                          key={cIdx}
                          className={`w-12 h-10 rounded-lg flex items-center justify-center font-mono font-black text-sm border shadow-xs transition-transform ${
                            rIdx === 0
                              ? 'bg-amber-400 border-amber-600 text-amber-950 scale-105 ring-2 ring-amber-300'
                              : rIdx === 1
                              ? 'bg-indigo-100 border-indigo-400 text-indigo-900'
                              : 'bg-emerald-100 border-emerald-400 text-emerald-900'
                          }`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  ))}
                  <span className="text-[10px] text-slate-500 font-semibold mt-1">
                    ▲ निचली संख्याओं का योग ऊपर बनता है
                  </span>
                </div>
              )}

              {/* Table Data Diagram */}
              {geometry.type === 'table' && (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-blue-600 text-white font-bold">
                        {geometry.tableData?.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-1.5 border border-blue-700 text-center">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {geometry.tableData?.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            rIdx === (geometry.tableData?.rows.length || 0) - 1
                              ? 'bg-emerald-100 font-black text-emerald-950'
                              : rIdx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50'
                          }
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 border border-slate-200 text-center">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pentagon (पंचभुज - 5 sides) */}
              {geometry.type === 'pentagon' && (
                <svg viewBox="0 0 180 160" className="w-44 h-36">
                  <polygon
                    points="90,20 160,70 135,145 45,145 20,70"
                    fill="rgba(99, 102, 241, 0.2)"
                    stroke="#4f46e5"
                    strokeWidth="3"
                  />
                  {[[90, 20], [160, 70], [135, 145], [45, 145], [20, 70]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#ef4444" />
                  ))}
                  <text x="90" y="95" textAnchor="middle" className="text-xs font-black fill-indigo-800 dark:fill-indigo-300 font-mono">
                    पंचभुज (5 Sides)
                  </text>
                </svg>
              )}

              {/* Hexagon (षट्भुज - 6 sides) */}
              {geometry.type === 'hexagon' && (
                <svg viewBox="0 0 180 160" className="w-44 h-36">
                  <polygon
                    points="90,15 155,52 155,122 90,155 25,122 25,52"
                    fill="rgba(16, 185, 129, 0.2)"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                  {[[90, 15], [155, 52], [155, 122], [90, 155], [25, 122], [25, 52]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3.5" fill="#ef4444" />
                  ))}
                  <text x="90" y="95" textAnchor="middle" className="text-xs font-black fill-emerald-800 dark:fill-emerald-300 font-mono">
                    षट्भुज (6 Sides)
                  </text>
                </svg>
              )}

              {/* 3D Cube (घन) */}
              {geometry.type === 'cube' && (
                <svg viewBox="0 0 180 160" className="w-44 h-36">
                  <polygon points="35,60 75,25 145,25 105,60" fill="rgba(245, 158, 11, 0.3)" stroke="#d97706" strokeWidth="2.5" />
                  <polygon points="35,60 105,60 105,130 35,130" fill="rgba(245, 158, 11, 0.15)" stroke="#d97706" strokeWidth="2.5" />
                  <polygon points="105,60 145,25 145,95 105,130" fill="rgba(245, 158, 11, 0.4)" stroke="#d97706" strokeWidth="2.5" />
                  <text x="70" y="145" textAnchor="middle" className="text-[10px] font-black fill-amber-700 dark:fill-amber-300 font-mono">
                    {geometry.label1 || 'भुजा (a)'}
                  </text>
                </svg>
              )}

              {/* 3D Cone (शंकु) */}
              {geometry.type === 'cone' && (
                <svg viewBox="0 0 180 160" className="w-44 h-36">
                  <path d="M 40 120 L 90 25 L 140 120 Z" fill="rgba(236, 72, 153, 0.15)" stroke="#ec4899" strokeWidth="2.5" />
                  <ellipse cx="90" cy="120" rx="50" ry="16" fill="rgba(236, 72, 153, 0.25)" stroke="#ec4899" strokeWidth="2.5" />
                  <line x1="90" y1="25" x2="90" y2="120" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                  <line x1="90" y1="120" x2="140" y2="120" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2,2" />
                  <text x="115" y="115" className="text-[10px] font-black fill-amber-600 font-mono">r</text>
                  <text x="75" y="75" className="text-[10px] font-black fill-slate-600 font-mono">h</text>
                  <text x="125" y="70" className="text-[10px] font-black fill-pink-600 font-mono">l</text>
                </svg>
              )}

              {/* Angle (कोण) */}
              {geometry.type === 'angle' && (
                <svg viewBox="0 0 180 150" className="w-44 h-36">
                  <line x1="30" y1="120" x2="150" y2="120" stroke="#3b82f6" strokeWidth="3" />
                  <line x1="30" y1="120" x2="115" y2="35" stroke="#3b82f6" strokeWidth="3" />
                  <path d="M 65 120 A 35 35 0 0 0 55 95" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  <circle cx="30" cy="120" r="4" fill="#ef4444" />
                  <text x="20" y="135" className="text-xs font-bold fill-slate-700">O</text>
                  <text x="70" y="105" className="text-xs font-black fill-amber-600 font-mono">
                    {geometry.label1 || 'θ'}
                  </text>
                </svg>
              )}

              {/* Fraction (भिन्न) */}
              {geometry.type === 'fraction' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center border-2 border-indigo-500 rounded-xl overflow-hidden shadow-xs">
                    {Array.from({ length: geometry.fractionData?.denominator || 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-14 border-r last:border-r-0 border-indigo-400 flex items-center justify-center font-bold text-xs ${
                          idx < (geometry.fractionData?.numerator || 1)
                            ? 'bg-indigo-500 text-white font-black'
                            : 'bg-white text-slate-400'
                        }`}
                      >
                        {idx < (geometry.fractionData?.numerator || 1) ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {geometry.fractionData?.numerator || 1} / {geometry.fractionData?.denominator || 4} छायांकित (Shaded)
                  </span>
                </div>
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
      ) : answer && answer.trim() ? (
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
      ) : null}
    </div>
    </>
  );
};

export default VisualMathDiagramCard;

