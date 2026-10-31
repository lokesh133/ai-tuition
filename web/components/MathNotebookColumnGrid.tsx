'use client';

import React, { useState } from 'react';
import { Calculator, CheckCircle2, ArrowRight, Lightbulb, Sparkles, RefreshCw, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface BorrowCarryStep {
  tag: string;
  badge: string;
  title: string;
  from?: string;
  to?: string;
  ruleExplanation: string;
  mathEquation: string;
}

export interface BorrowCarryGuide {
  type: 'borrow' | 'carry';
  title: string;
  mainRule: string;
  goldenTip: string;
  steps: BorrowCarryStep[];
}

export interface BorrowCarryFlow {
  kahaSeLiTitle: string;
  kahaSeLiSource: string;
  kahaSeLiTarget: string;
  kahaSeLiExplanation: string[];
  kismeMinusHuaTitle: string;
  subtractions: {
    columnName: string;
    equation: string;
    detail: string;
  }[];
}

export interface DivisionStep {
  stepDividend: number;
  quotientDigit: number;
  subtractProduct: number;
  remainder: number;
  broughtDownDigit?: string;
}

export interface DivisionData {
  divisor: number;
  dividend: number;
  quotient: number;
  remainder: number;
  steps: DivisionStep[];
}

export interface ColumnMathData {
  title: string;
  operation: '+' | '-' | '×' | '÷';
  unit1: string;
  unit2: string;
  transferArrowText?: string;
  borrows1?: string[];
  borrows2?: string[];
  borrowSub1?: string[];
  borrowSub2?: string[];
  carries1?: string[];
  carries2?: string[];
  carrySub1?: string[];
  carrySub2?: string[];
  row1_unit1: string[];
  row1_unit2: string[];
  row2_unit1: string[];
  row2_unit2: string[];
  ans_unit1: string[];
  ans_unit2: string[];
  borrowCarryFlow?: BorrowCarryFlow;
  borrowCarryGuide?: BorrowCarryGuide;
  divisionData?: DivisionData;
  steps: {
    title: string;
    description: string;
    details?: string[];
  }[];
  finalAnswer: string;
}

/**
 * Intelligent parser to detect and extract column math operations
 * (e.g. Weight kg/g, Capacity L/mL, Length m/cm, or multi-digit column addition/subtraction, multiplication, long division)
 */
export function tryParseColumnMath(formula: string, question: string = ''): ColumnMathData | null {
  if (!formula) return null;
  const fTrim = formula.trim();
  const fLower = fTrim.toLowerCase();
  const qTrim = question.trim();
  const qLower = qTrim.toLowerCase();

  // Guard: If formula is a summary, final answer tick, rule/concept explanation, or non-arithmetic text, DO NOT hijack the step!
  if (
    fTrim.startsWith('✅') ||
    fLower.includes('सही उत्तर') ||
    fLower.includes('नियम') ||
    fLower.includes('पहचान') ||
    fLower.includes('परिणाम') ||
    fLower.includes('डाउट क्लियर') ||
    fLower.includes('summary') ||
    fLower.includes('moral') ||
    fLower.includes('vocabulary') ||
    fLower.includes('शब्दार्थ')
  ) {
    return null;
  }

  // Guard: If question or formula is Fill-in-the-blanks, Unit Conversion, True/False, or Estimation
  const isConversionOrBlank =
    qLower.includes('fill in the blank') ||
    qLower.includes('रिक्त स्थान') ||
    qLower.includes('खाली स्थान') ||
    fLower.includes('रिक्त स्थान') ||
    fLower.includes('खाली स्थान') ||
    qLower.includes('___') ||
    fLower.includes('___') ||
    qLower.includes('convert') ||
    qLower.includes('बदलें') ||
    qLower.includes('बदलो') ||
    qLower.includes('बदलना') ||
    qLower.includes('रूपांतरण') ||
    qLower.includes('estimate') ||
    qLower.includes('अनुमान') ||
    qLower.includes('true or false') ||
    qLower.includes('सत्य या असत्य') ||
    qLower.includes('सही या गलत') ||
    fLower.includes('वस्तु:') ||
    fLower.includes('अनुमानित');

  if (isConversionOrBlank) {
    // Only allow column math if there is an EXPLICIT 2-measurement addition or subtraction
    // like "44 kg 520 g - 12 kg 502 g" or "151 kg 46 g + 231 kg 5 g"
    const hasExplicitCompositeOp =
      /\d+\s*(?:kg|किग्रा|l|लीटर|m|मीटर)\s*\d+\s*(?:g|ग्रा|ml|मिली|cm|सेमी)\s*[\+\-]\s*\d+\s*(?:kg|किग्रा|l|लीटर|m|मीटर)\s*\d+\s*(?:g|ग्रा|ml|मिली|cm|सेमी)/i.test(formula) ||
      /\d+\s*(?:kg|किग्रा|l|लीटर|m|मीटर)\s*\d+\s*(?:g|ग्रा|ml|मिली|cm|सेमी)\s*[\+\-]\s*\d+\s*(?:kg|किग्रा|l|लीटर|m|मीटर)\s*\d+\s*(?:g|ग्रा|ml|मिली|cm|सेमी)/i.test(question);

    if (!hasExplicitCompositeOp) {
      return null;
    }
  }

  // Guard: If formula is a multi-line explanation with conversion equivalences (e.g. 1 kg = 1000 g \n 1 g = 100 cg)
  // and does NOT have a column table header (e.g. "kg g\n 44 520\n- 12 502"), DO NOT hijack!
  if ((fTrim.match(/=/g) || []).length >= 2 && !/(?:kg|l|m|km)\s+(?:g|ml|cm|m)\s*\n/i.test(formula)) {
    return null;
  }

  const combined = `${question} ${formula}`.toLowerCase();

  // General two-unit subtraction / addition (100% Dynamic Calculation)
  // E.g.: 500 kg 150 g + 200 kg 100 g, 44 kg 520 g - 12 kg 502 g, 101 kg 425 g - 79 kg 586 g, etc.
  let isSubtraction = combined.includes('subtract') || combined.includes('difference') || combined.includes('from') || combined.includes('घटा');
  const hasExplicitAddOp = combined.includes('+') || combined.includes('जोड़ें') || combined.includes('जोड़');
  const hasExplicitSubOp = combined.includes('-') || combined.includes('−') || combined.includes('घटाएं') || combined.includes('घटा');

  // If there is NO arithmetic operation (+, -, जोड़, घटा, subtract, difference, from), DO NOT invent column addition!
  if (!hasExplicitAddOp && !hasExplicitSubOp && !isSubtraction) {
    return null;
  }

  // Parse Multi-line Column Block in formula if present:
  // e.g.: kg g\n 44 520\n- 12 502 OR kg | g\n 44 | 520\n- 12 | 502
  const colBlockRegex = /(kg|km|l|m|किग्रा|लीटर|मीटर)[\s\|]+(g|m|ml|cm|ग्रा|मिली|सेमी)[\s\S]*?\n\s*(\d+)[\s\|]+(\d+)[\s\S]*?\n\s*([\+\-−])\s*(\d+)[\s\|]+(\d+)/i;
  const colBlockM = formula.match(colBlockRegex);

  // Parse horizontal 2-unit arithmetic:
  // e.g.: 44 kg 520 g - 12 kg 502 g
  // Group 1: 44, Group 2: kg, Group 3: 520, Group 4: g, Group 5: -, Group 6: 12, Group 7: kg, Group 8: 502, Group 9: g
  const horizRegex = /(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*(\d+)\s*(g|ग्रा|m|मीटर|ml|मिली|cm|सेमी)\s*([\+\-−])\s*(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*(\d+)\s*(g|ग्रा|m|मीटर|ml|मिली|cm|सेमी)/i;
  const horizM = combined.match(horizRegex);

  // Parse mixed 2-unit and 1-unit arithmetic:
  // e.g.: 84 kg 350 g - 59 kg
  const mixedRegex = /(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*(\d+)\s*(g|ग्रा|m|मीटर|ml|मिली|cm|सेमी)\s*([\+\-−])\s*(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)(?!\s*\d+\s*[a-z])/i;
  const mixedM = combined.match(mixedRegex);

  // Parse mixed 1-unit and 2-unit arithmetic (e.g. 65 km - 38 km 650 m):
  const mixedRevRegex = /(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*([\+\-−])\s*(\d+)\s*(?:kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*(\d+)\s*(g|ग्रा|m|मीटर|ml|मिली|cm|सेमी)/i;
  const mixedRevM = combined.match(mixedRevRegex);

  // Parse "subtract X kg Y g from Z kg W g":
  // Group 1: X, Group 2: unit1, Group 3: Y, Group 4: unit2, Group 5: Z, Group 6: unit1, Group 7: W, Group 8: unit2
  const fromRegex = /(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*(\d+)\s*(g|ग्रा|m|मीटर|ml|मिली|cm|सेमी)\s+from\s+(\d+)\s*(kg|किग्रा|km|किमी|l|लीटर|m|मीटर)\s*(\d+)\s*(g|ग्रा|m|मीटर|ml|मिली|cm|सेमी)/i;
  const fromM = combined.match(fromRegex);

  let u1 = 'kg';
  let u2 = 'g';
  let top_u1 = 0;
  let top_u2 = 0;
  let bot_u1 = 0;
  let bot_u2 = 0;

  if (colBlockM) {
    u1 = colBlockM[1].toLowerCase();
    u2 = colBlockM[2].toLowerCase();
    top_u1 = parseInt(colBlockM[3], 10);
    top_u2 = parseInt(colBlockM[4], 10);
    isSubtraction = colBlockM[5] === '-' || colBlockM[5] === '−';
    bot_u1 = parseInt(colBlockM[6], 10);
    bot_u2 = parseInt(colBlockM[7], 10);
  } else if (horizM) {
    u1 = horizM[2].toLowerCase();
    u2 = horizM[4].toLowerCase();
    top_u1 = parseInt(horizM[1], 10);
    top_u2 = parseInt(horizM[3], 10);
    isSubtraction = horizM[5] === '-' || horizM[5] === '−';
    bot_u1 = parseInt(horizM[6], 10);
    bot_u2 = parseInt(horizM[8], 10);
  } else if (mixedM) {
    u1 = mixedM[2].toLowerCase();
    u2 = mixedM[4].toLowerCase();
    top_u1 = parseInt(mixedM[1], 10);
    top_u2 = parseInt(mixedM[3], 10);
    isSubtraction = mixedM[5] === '-' || mixedM[5] === '−';
    bot_u1 = parseInt(mixedM[6], 10);
    bot_u2 = 0;
  } else if (mixedRevM) {
    u1 = mixedRevM[2].toLowerCase();
    u2 = mixedRevM[6].toLowerCase();
    top_u1 = parseInt(mixedRevM[1], 10);
    top_u2 = 0;
    isSubtraction = mixedRevM[3] === '-' || mixedRevM[3] === '−';
    bot_u1 = parseInt(mixedRevM[4], 10);
    bot_u2 = parseInt(mixedRevM[5], 10);
  } else if (fromM) {
    u1 = fromM[2].toLowerCase();
    u2 = fromM[4].toLowerCase();
    top_u1 = parseInt(fromM[5], 10);
    top_u2 = parseInt(fromM[7], 10);
    isSubtraction = true;
    bot_u1 = parseInt(fromM[1], 10);
    bot_u2 = parseInt(fromM[3], 10);
  } else {
    // If none of the explicit arithmetic patterns matched, DO NOT guess or invent fake numbers!
    return null;
  }

  // Defensive NaN safeguards
  top_u1 = Number.isNaN(top_u1) ? 0 : top_u1;
  top_u2 = Number.isNaN(top_u2) ? 0 : top_u2;
  bot_u1 = Number.isNaN(bot_u1) ? 0 : bot_u1;
  bot_u2 = Number.isNaN(bot_u2) ? 0 : bot_u2;

  // Normalize Hindi abbreviations
  if (u1.includes('किग्रा') || u1.includes('किलो')) u1 = 'kg';
  else if (u1.includes('ग्रा')) u1 = 'g';
  else if (u1.includes('लीटर')) u1 = 'l';
  else if (u1.includes('मिली')) u1 = 'ml';
  else if (u1.includes('मीटर')) u1 = 'm';
  else if (u1.includes('सेमी')) u1 = 'cm';

  if (u2.includes('किग्रा') || u2.includes('किलो')) u2 = 'kg';
  else if (u2.includes('ग्रा')) u2 = 'g';
  else if (u2.includes('लीटर')) u2 = 'l';
  else if (u2.includes('मिली')) u2 = 'ml';
  else if (u2.includes('मीटर')) u2 = 'm';
  else if (u2.includes('सेमी')) u2 = 'cm';

  // Guard: u1 and u2 CANNOT be the same unit (e.g. kg and kg is invalid!)
  if (u1 === u2) {
    if (u1 === 'kg') u2 = 'g';
    else if (u1 === 'l') u2 = 'ml';
    else if (u1 === 'm') u2 = 'cm';
    else if (u1 === 'km') u2 = 'm';
    else return null;
  }

    // Correct conversion factor (1 kg = 1000 g, 1 L = 1000 mL, 1 km = 1000 m, 1 m = 100 cm)
    let baseFactor = 1000;
    if (u1 === 'kg' && u2 === 'g') baseFactor = 1000;
    else if (u1 === 'g' && u2 === 'mg') baseFactor = 1000;
    else if (u1 === 'l' && u2 === 'ml') baseFactor = 1000;
    else if (u1 === 'km' && u2 === 'm') baseFactor = 1000;
    else if (u1 === 'm' && u2 === 'cm') baseFactor = 100;
    else if (u1 === 'm' && u2 === 'mm') baseFactor = 1000;
    else if (u1 === 'cm' && u2 === 'mm') baseFactor = 10;
    else if (u1 === 'rs' || u1 === '₹') baseFactor = 100;
    else {
      // If 3-digit lower unit, baseFactor MUST be 1000!
      baseFactor = (top_u2 >= 100 || bot_u2 >= 100) ? 1000 : 100;
    }

    // 🌟 Normalization: Any lower unit >= baseFactor (e.g. 1000 g = 1 kg 0 g) converts to upper unit
    // so grams column is strictly 3 digits (000-999) and never produces a fake 4th digit (0 + 1 = 0)
    if (top_u2 >= baseFactor) {
      top_u1 += Math.floor(top_u2 / baseFactor);
      top_u2 = top_u2 % baseFactor;
    }
    if (bot_u2 >= baseFactor) {
      bot_u1 += Math.floor(bot_u2 / baseFactor);
      bot_u2 = bot_u2 % baseFactor;
    }

    let ans_u1 = 0;
    let ans_u2 = 0;
    let transferCarry = 0;

    if (!isSubtraction) {
      const sumCol2 = top_u2 + bot_u2; // e.g. 150 + 100 = 250
      transferCarry = Math.floor(sumCol2 / baseFactor); // 250 / 1000 = 0
      ans_u2 = sumCol2 % baseFactor; // 250
      ans_u1 = top_u1 + bot_u1 + transferCarry; // 500 + 200 + 0 = 700
    } else {
      let remTop1 = top_u1;
      let remTop2 = top_u2;
      if (remTop2 < bot_u2) {
        remTop1 -= 1;
        remTop2 += baseFactor;
      }
      ans_u2 = remTop2 - bot_u2;
      ans_u1 = remTop1 - bot_u1;
    }

    // Lower unit standard width (strictly 3 digits for g/ml/m, 2 digits for cm/paise)
    const expectedDigits2 = (baseFactor === 1000) ? 3 : (baseFactor === 100) ? 2 : (baseFactor === 10) ? 1 : 2;
    const len1 = Math.max(3, String(Math.max(top_u1, bot_u1, ans_u1)).length);
    const len2 = expectedDigits2;

    const row1_u1 = String(top_u1).padStart(len1, '0').split('');
    const row1_u2 = String(top_u2).padStart(len2, '0').split('');
    const row2_u1 = String(bot_u1).padStart(len1, '0').split('');
    const row2_u2 = String(bot_u2).padStart(len2, '0').split('');

    const ans_unit1 = String(ans_u1).padStart(len1, '0').split('');
    const ans_unit2 = String(ans_u2).padStart(len2, '0').split('');

    let carries1: string[] = new Array(len1).fill('—');
    let carries2: string[] = new Array(len2).fill('—');
    let borrows1: string[] = new Array(len1).fill('—');
    let borrows2: string[] = new Array(len2).fill('—');

    let hasAnyCarry = false;
    let hasAnyBorrow = false;

    let transferArrowText: string | undefined = undefined;
    let borrowCarryFlow: BorrowCarryFlow | undefined = undefined;
    let borrowCarryGuide: BorrowCarryGuide | undefined = undefined;

    if (!isSubtraction) {
      // Calculate digit-by-digit addition carry from right to left in u2
      let carry = 0;
      for (let i = row1_u2.length - 1; i >= 0; i--) {
        const d1 = parseInt(row1_u2[i], 10) || 0;
        const d2 = parseInt(row2_u2[i], 10) || 0;
        const sum = d1 + d2 + carry;
        carry = Math.floor(sum / 10);
        if (i > 0 && carry > 0) {
          carries2[i - 1] = String(carry);
          hasAnyCarry = true;
        }
      }

      // If carry out from u2 into u1
      if (transferCarry > 0) {
        carries1[row1_u1.length - 1] = String(transferCarry);
        hasAnyCarry = true;
        transferArrowText = `${u2} ──${transferCarry} ${u1} हासिल──> ${u1}`;
      }

      // Digit-by-digit addition carry from right to left in u1
      let c1 = transferCarry;
      for (let i = row1_u1.length - 1; i >= 0; i--) {
        const d1 = parseInt(row1_u1[i], 10) || 0;
        const d2 = parseInt(row2_u1[i], 10) || 0;
        const sum = d1 + d2 + c1;
        c1 = Math.floor(sum / 10);
        if (i > 0 && c1 > 0) {
          carries1[i - 1] = String(c1);
          hasAnyCarry = true;
        }
      }

      if (hasAnyCarry) {
        borrowCarryFlow = {
          kahaSeLiTitle: '1️⃣ कहाँ से हासिल (Carry) आई?',
          kahaSeLiSource: transferCarry > 0 ? `${u2} कॉलम का जोड़ (${top_u2 + bot_u2} ${u2})` : 'इकाई/दहाई का जोड़',
          kahaSeLiTarget: `${u1} कॉलम में`,
          kahaSeLiExplanation: [
            transferCarry > 0
              ? `जब ${u2} कॉलम का जोड़ ${baseFactor} या उससे बड़ा होता है, तो ${transferCarry} ${u1} हासिल बनकर बाईं ओर जाता है।`
              : 'जब दो अंकों का जोड़ 9 से बड़ा होता है, तो हासिल अगली संख्या पर जुड़ता है!',
            'यह हासिल अगली संख्या के ऊपर लिखी जाती है और साथ में जोड़ी जाती है!'
          ],
          kismeMinusHuaTitle: '2️⃣ यहाँ किसमें जुड़ी?',
          subtractions: [
            {
              columnName: `👉 ${u2} में जोड़:`,
              equation: `${top_u2} + ${bot_u2} = ${top_u2 + bot_u2} ${u2}`,
              detail: transferCarry > 0
                ? `नीचे उत्तर ${ans_u2} लिखा और ${transferCarry} हासिल अगली संख्या पर गया`
                : `नीचे उत्तर ${ans_u2} लिखा गया`
            },
            {
              columnName: `👉 ${u1} में जोड़:`,
              equation: transferCarry > 0
                ? `${top_u1} + ${bot_u1} + ${transferCarry} = ${ans_u1} ${u1}`
                : `${top_u1} + ${bot_u1} = ${ans_u1} ${u1}`,
              detail: transferCarry > 0
                ? `हासिल ${transferCarry} के साथ जोड़कर कुल ${ans_u1} ${u1} बना`
                : `सीधा जोड़कर कुल ${ans_u1} ${u1} बना`
            }
          ]
        };
      }
    } else {
      // Subtraction (कॉलम विधि द्वारा घटाव - Digit-by-digit borrowing)
      const d_u2 = row1_u2.map((ch) => parseInt(ch, 10) || 0);
      const d_u1 = row1_u1.map((ch) => parseInt(ch, 10) || 0);
      const s_u2 = row2_u2.map((ch) => parseInt(ch, 10) || 0);
      const s_u1 = row2_u1.map((ch) => parseInt(ch, 10) || 0);

      let u1_borrowed = false;
      let u1_rem = top_u1;

      // 1. Check if u2 needs borrowing from u1 (e.g. 150 g < 250 g)
      if (top_u2 < bot_u2) {
        hasAnyBorrow = true;
        u1_borrowed = true;
        u1_rem = top_u1 - 1;
        transferArrowText = `${u1} ──1 ${u1} (${baseFactor} ${u2}) उधार──> ${u2}`;

        // Top-most digit of u2 gets + 10
        d_u2[0] += 10;
        borrows2[0] = String(d_u2[0]);

        // Deduct 1 from u1
        for (let i = d_u1.length - 1; i >= 0; i--) {
          if (d_u1[i] > 0) {
            d_u1[i] -= 1;
            borrows1[i] = String(d_u1[i]);
            break;
          } else {
            d_u1[i] = 9;
            borrows1[i] = '9';
          }
        }
      }

      // 2. Digit-by-digit borrowing within u2 (right to left)
      for (let i = d_u2.length - 1; i >= 0; i--) {
        if (d_u2[i] < s_u2[i]) {
          hasAnyBorrow = true;
          for (let j = i - 1; j >= 0; j--) {
            if (d_u2[j] > 0) {
              d_u2[j] -= 1;
              borrows2[j] = String(d_u2[j]);
              for (let k = j + 1; k < i; k++) {
                d_u2[k] = 9;
                borrows2[k] = '9';
              }
              d_u2[i] += 10;
              borrows2[i] = String(d_u2[i]);
              break;
            }
          }
        }
      }

      // 3. Digit-by-digit borrowing within u1 (right to left)
      for (let i = d_u1.length - 1; i >= 0; i--) {
        if (d_u1[i] < s_u1[i]) {
          hasAnyBorrow = true;
          for (let j = i - 1; j >= 0; j--) {
            if (d_u1[j] > 0) {
              d_u1[j] -= 1;
              borrows1[j] = String(d_u1[j]);
              for (let k = j + 1; k < i; k++) {
                d_u1[k] = 9;
                borrows1[k] = '9';
              }
              d_u1[i] += 10;
              borrows1[i] = String(d_u1[i]);
              break;
            }
          }
        }
      }

      if (hasAnyBorrow) {
        borrowCarryFlow = {
          kahaSeLiTitle: '1️⃣ कहाँ से उधार (Borrow) ली?',
          kahaSeLiSource: u1_borrowed
            ? `${top_u1} ${u1} से 1 ${u1} उधार लिया`
            : 'बाईं ओर के अंक से उधार लिया',
          kahaSeLiTarget: u1_borrowed
            ? `${top_u2} ${u2} को (+${baseFactor} ${u2} मिला)`
            : 'इकाई/दहाई के अंक को (+10 मिला)',
          kahaSeLiExplanation: [
            u1_borrowed
              ? `${top_u1} ${u1} ने 1 ${u1} उधार दिया ➔ ${top_u1} घटकर ${u1_rem} ${u1} बचा।`
              : 'जब ऊपर का अंक छोटा और नीचे का बड़ा होता है, तो बाईं ओर से 1 उधार लिया जाता है।',
            'उधार देने वाला अंक 1 कम हो जाता है और उधार लेने वाले अंक में 10 जुड़ जाता है!',
            u1_borrowed
              ? `${u2} में 1 ${u1} (= ${baseFactor} ${u2}) आया ➔ ${top_u2} ${u2} बना ${top_u2 + baseFactor} ${u2}!`
              : 'अब बड़े अंक से घटाना आसान हो जाता है।'
          ],
          kismeMinusHuaTitle: '2️⃣ यहाँ किसमें से माइनस (घटा) हुआ?',
          subtractions: [
            {
              columnName: `👉 ${u2} में घटाव:`,
              equation: `${u1_borrowed ? top_u2 + baseFactor : top_u2} ${u2} − ${bot_u2} ${u2} = ${ans_u2} ${u2}`,
              detail: `${u1_borrowed ? top_u2 + baseFactor : top_u2} − ${bot_u2} = ${ans_u2}`
            },
            {
              columnName: `👉 ${u1} में घटाव:`,
              equation: `${u1_borrowed ? u1_rem : top_u1} ${u1} − ${bot_u1} ${u1} = ${ans_u1} ${u1}`,
              detail: `${u1_borrowed ? u1_rem : top_u1} − ${bot_u1} = ${ans_u1}`
            }
          ]
        };
      }
    }

    return {
      title: isSubtraction ? 'कॉलम विधि द्वारा घटाव (Column Subtraction):' : 'कॉलम विधि द्वारा जोड़ (Column Addition):',
      operation: isSubtraction ? '-' : '+',
      unit1: u1,
      unit2: u2,
      transferArrowText,
      carries1,
      carries2,
      borrows1,
      borrows2,
      row1_unit1: row1_u1,
      row1_unit2: row1_u2,
      row2_unit1: row2_u1,
      row2_unit2: row2_u2,
      ans_unit1,
      ans_unit2,
      borrowCarryFlow,
      borrowCarryGuide,
      steps: [
        {
          title: `चरण 1: ${u2} कॉलम हल करना`,
          description: isSubtraction
            ? `${top_u2} में से ${bot_u2} घटाने पर (यदि आवश्यकता हो तो ${u1} से उधार लेकर):`
            : `${top_u2} और ${bot_u2} को जोड़ने पर:`,
          details: [`परिणाम = ${ans_u2} ${u2}`]
        },
        {
          title: `चरण 2: ${u1} कॉलम हल करना`,
          description: isSubtraction
            ? `${top_u1} में से ${bot_u1} घटाने पर:`
            : `${top_u1} और ${bot_u1} को जोड़ने पर${transferCarry > 0 ? ` (+${transferCarry} हासिल)` : ''}:`,
          details: [`परिणाम = ${ans_u1} ${u1}`]
        },
        {
          title: 'चरण 3: कुल उत्तर',
          description: 'अंतिम हल:',
          details: [`उत्तर = ${ans_u1} ${u1} ${ans_u2} ${u2} ✅`]
        }
      ],
      finalAnswer: `${ans_u1} ${u1} ${ans_u2} ${u2}`
    };

  // Check 4: Multiplication (कॉलम गुणा) E.g. 48 × 6, 125 × 4, 36 × 12
  const mulMatch = combined.match(/(\d+)\s*(?:[*x×]|multiplied by|गुना|गुणा)\s*(\d+)/i);
  if (
    mulMatch &&
    !combined.includes('kg') &&
    !combined.includes('₹') &&
    !combined.includes('cm') &&
    !combined.includes('cg') &&
    !combined.includes('mg') &&
    !combined.includes('___') &&
    !combined.includes('blank')
  ) {
    const n1 = parseInt(mulMatch[1], 10);
    const n2 = parseInt(mulMatch[2], 10);
    const multiplicand = Math.max(n1, n2);
    const multiplier = Math.min(n1, n2);
    const product = multiplicand * multiplier;

    const r1 = String(multiplicand).split('');
    const r2 = String(multiplier).padStart(r1.length, ' ').split('');
    const ansDigits = String(product).padStart(r1.length, '0').split('');

    // Compute carries for single-digit multiplier
    const carries: string[] = new Array(r1.length).fill('—');
    if (multiplier < 10) {
      let c = 0;
      for (let i = r1.length - 1; i >= 0; i--) {
        const d = parseInt(r1[i], 10) || 0;
        const p = d * multiplier + c;
        c = Math.floor(p / 10);
        if (i > 0 && c > 0) {
          carries[i - 1] = String(c);
        }
      }
    }

    return {
      title: 'कॉलम विधि द्वारा गुणा (Column Multiplication with Carry):',
      operation: '×',
      unit1: 'गुणा',
      unit2: '',
      carries1: carries,
      carries2: [],
      row1_unit1: r1,
      row1_unit2: [],
      row2_unit1: r2,
      row2_unit2: [],
      ans_unit1: ansDigits,
      ans_unit2: [],
      borrowCarryFlow: {
        kahaSeLiTitle: '1️⃣ गुणा में हासिल (Carry) कहाँ से आई?',
        kahaSeLiSource: `${multiplier} से इकाई का गुणा`,
        kahaSeLiTarget: 'बाईं ओर दहाई के ऊपर',
        kahaSeLiExplanation: [
          `जब गुणा करने पर 9 से बड़ा अंक आता है, तो इकाई नीचे उत्तर में लिखते हैं और दहाई अंक हासिल बनकर बाईं संख्या के सिर पर जुड़ता है!`,
          `अगले अंक को गुणा करने के बाद उस हासिल को जोड़ दिया जाता है।`
        ],
        kismeMinusHuaTitle: '2️⃣ यहाँ हासिल कैसे जुड़ी?',
        subtractions: [
          {
            columnName: '👉 चरणबद्ध गुणा व हासिल जोड़:',
            equation: `${multiplicand} × ${multiplier} = ${product}`,
            detail: `इकाई से गुणा करके हासिल को दहाई में जोड़ा गया (कुल = ${product})`
          }
        ]
      },
      steps: [
        {
          title: 'चरण 1: इकाई के अंक से गुणा करना',
          description: `${multiplicand} को ${multiplier} से गुणा करने पर:`,
          details: [`गुणनफल = ${product} ✅`]
        }
      ],
      finalAnswer: `${product}`
    };
  }

  // Check 5: Long Division (भाग विधि) E.g. 84 ÷ 4, 125 ÷ 5, 96 ÷ 3
  const divMatch = combined.match(/(\d+)\s*(?:[\\/÷]|divided by|भाग)\s*(\d+)/i);
  if (divMatch && !combined.includes('kg') && !combined.includes('₹') && !combined.includes('cm')) {
    const dividend = parseInt(divMatch[1], 10);
    const divisor = parseInt(divMatch[2], 10);
    if (divisor > 0) {
      const quotient = Math.floor(dividend / divisor);
      const remainder = dividend % divisor;

      return {
        title: 'स्कूल कॉपी जैसी भाग विधि (Long Division Method):',
        operation: '÷',
        unit1: 'भाग',
        unit2: '',
        row1_unit1: String(dividend).split(''),
        row1_unit2: [],
        row2_unit1: String(divisor).split(''),
        row2_unit2: [],
        ans_unit1: String(quotient).split(''),
        ans_unit2: [],
        divisionData: {
          divisor,
          dividend,
          quotient,
          remainder,
          steps: [
            {
              stepDividend: dividend,
              quotientDigit: quotient,
              subtractProduct: divisor * quotient,
              remainder: remainder
            }
          ]
        },
        borrowCarryFlow: {
          kahaSeLiTitle: '1️⃣ भाग विधि के नियम (Division Steps):',
          kahaSeLiSource: `भाजक = ${divisor}`,
          kahaSeLiTarget: `भाज्य = ${dividend}`,
          kahaSeLiExplanation: [
            `1. पहाड़ा पढ़ें: ${divisor} का पहाड़ा पढ़ें।`,
            `2. घटाव करें: नीचे संख्या लिखकर घटाएं।`,
            `3. अगला अंक उतारें और शेषफल निकालें।`
          ],
          kismeMinusHuaTitle: '2️⃣ जांच सूत्र (Verification Formula):',
          subtractions: [
            {
              columnName: '👉 भाज्य = (भाजक × भागफल) + शेषफल',
              equation: `${dividend} = (${divisor} × ${quotient}) + ${remainder}`,
              detail: `भागफल = ${quotient}, शेषफल = ${remainder} (जांच पूरी तरह सही है! ✅)`
            }
          ]
        },
        steps: [
          {
            title: `चरण 1: ${divisor} से ${dividend} में भाग देना`,
            description: `${divisor} का पहाड़ा पढ़ने पर भागफल ${quotient} और शेषफल ${remainder} आता है:`,
            details: [
              `भागफल (Quotient) = ${quotient}`,
              `शेषफल (Remainder) = ${remainder}`,
              `जांच: (${divisor} × ${quotient}) + ${remainder} = ${dividend} ✅`
            ]
          }
        ],
        finalAnswer: remainder === 0 ? `भागफल = ${quotient}` : `भागफल = ${quotient}, शेष = ${remainder}`
      };
    }
  }

  return null;
}

interface MathNotebookColumnGridProps {
  data: ColumnMathData;
  isDarkMode?: boolean;
}

export default function MathNotebookColumnGrid({
  data,
  isDarkMode = false,
}: MathNotebookColumnGridProps) {
  const [showBorrowHelp, setShowBorrowHelp] = useState(true);

  // Check if there are active carries / borrows (with actual numbers > 0)
  const hasActiveBorrows = Boolean(
    data.borrows1?.some(b => b && b !== '—' && b.trim() !== '') ||
    data.borrows2?.some(b => b && b !== '—' && b.trim() !== '')
  );
  const hasActiveCarries = Boolean(
    data.carries1?.some(c => c && c !== '—' && c.trim() !== '') ||
    data.carries2?.some(c => c && c !== '—' && c.trim() !== '')
  );

  const isAddition = data.operation === '+';
  const isMultiplication = data.operation === '×';
  const isDivision = data.operation === '÷';
  const showTopRow = isAddition ? hasActiveCarries : isMultiplication ? hasActiveCarries : hasActiveBorrows;
  const flow = data.borrowCarryFlow;
  const guide = data.borrowCarryGuide;
  const divData = data.divisionData;

  return (
    <div className="space-y-4 my-2">
      {/* 📓 AUTHENTIC MATHEMATICS SQUARED NOTEBOOK GRID */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 shadow-sm transition-all ${
        isDarkMode
          ? 'bg-slate-900 border-indigo-700/60 text-slate-100'
          : 'bg-white border-indigo-200 text-slate-900 shadow-indigo-100/40'
      }`}>
        {/* Title Header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
              <Calculator className="w-4 h-4" />
            </span>
            <span className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200">
              {data.title}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            कॉपी जैसी असली विधि
          </span>
        </div>

        {/* 1. If Long Division (स्कूल कॉपी जैसी भाग विधि) */}
        {isDivision && divData ? (
          <div className="flex justify-center overflow-x-auto py-3">
            <div className="inline-block font-mono text-left select-none text-base sm:text-lg font-black text-slate-900 dark:text-white px-4 py-2 bg-indigo-50/40 dark:bg-slate-800/60 rounded-xl border border-indigo-200 dark:border-slate-700">
              {/* Top Quotient Line */}
              <div className="flex items-center justify-end gap-1 pb-1 text-emerald-600 dark:text-emerald-400 font-extrabold border-b-2 border-slate-700 dark:border-slate-300 pl-8">
                <span className="text-xs font-sans text-slate-500 mr-2">भागफल (Quotient):</span>
                <span className="text-xl sm:text-2xl">{divData.quotient}</span>
              </div>

              {/* Divisor ) Dividend */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-indigo-700 dark:text-indigo-300">{divData.divisor}</span>
                <span className="text-slate-400">)</span>
                <span className="tracking-widest">{divData.dividend}</span>
              </div>

              {/* Subtraction Step */}
              <div className="pl-6 pt-1 text-slate-700 dark:text-slate-300">
                <div className="border-b-2 border-slate-700 dark:border-slate-300 pb-1">
                  − {divData.divisor * divData.quotient}
                </div>
                <div className="pt-1 text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>{divData.remainder}</span>
                  <span className="text-xs font-sans text-slate-500">
                    {divData.remainder === 0 ? '(पूरा कट गया / शेष 0)' : `(शेषफल: ${divData.remainder})`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 2. Column Grid Table for Addition, Subtraction, Multiplication */
          <div className="flex justify-center overflow-x-auto py-2">
            <div className="inline-block font-mono text-center select-none min-w-[280px]">
              {/* Unit Headers Row (if units present) */}
              {data.unit2 ? (
                <div className="grid grid-cols-2 gap-3 text-sm font-black pb-1.5 border-b-2 border-slate-700 dark:border-slate-300">
                  <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-800 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800 tracking-wider">
                    {data.unit1}
                  </div>
                  <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 tracking-wider">
                    {data.unit2}
                  </div>
                </div>
              ) : null}

              {/* Borrow / Carry Row (ONLY SHOWN WHEN CARRY/BORROW ACTUALLY OCCURS!) */}
              {showTopRow && (
                <div className="relative pt-2.5 pb-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                  {/* Indicator tag on top with transfer direction arrow */}
                  <div className="text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold shadow-2xs ${
                      data.operation === '-'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                        : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    }`}>
                      {data.operation === '-'
                        ? '🔄 ऊपर उधार (Borrow) की संख्याएँ'
                        : '➕ ऊपर हासिल (Carry) की संख्याएँ'}
                    </span>
                    {data.transferArrowText && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {data.transferArrowText}
                      </span>
                    )}
                  </div>

                  <div className={`grid ${data.unit2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 text-xs`}>
                    {/* Unit 1 Borrows / Carries */}
                    <div className="flex justify-center items-center gap-3 tracking-widest">
                      {(data.operation === '-' ? data.borrows1 || [] : data.carries1 || []).map((b, i) => {
                        const isActive = b && b !== '—' && b.trim() !== '';
                        if (!isActive) {
                          return <div key={i} className="inline-block w-6 text-center select-none opacity-0">-</div>;
                        }
                        return (
                          <div key={i} className="inline-flex items-center justify-center w-6">
                            <span
                              className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full font-black text-xs shadow-sm ${
                                data.operation === '-'
                                  ? 'bg-rose-500 text-white border border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900'
                                  : 'bg-blue-600 text-white border border-blue-700 ring-2 ring-blue-200 dark:ring-blue-900'
                              }`}
                            >
                              {b}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Unit 2 Borrows / Carries */}
                    {data.unit2 ? (
                      <div className="flex justify-center items-center gap-3 tracking-widest border-l border-slate-200 dark:border-slate-800 pl-2">
                        {(data.operation === '-' ? data.borrows2 || [] : data.carries2 || []).map((b, i) => {
                          const isActive = b && b !== '—' && b.trim() !== '';
                          if (!isActive) {
                            return <div key={i} className="inline-block w-6 text-center select-none opacity-0">-</div>;
                          }
                          return (
                            <div key={i} className="inline-flex items-center justify-center w-6">
                              <span
                                className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full font-black text-xs shadow-sm ${
                                  data.operation === '-'
                                    ? 'bg-rose-500 text-white border border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900'
                                    : 'bg-blue-600 text-white border border-blue-700 ring-2 ring-blue-200 dark:ring-blue-900'
                                }`}
                              >
                                {b}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Row 1: Minuend / Multiplicand / First Operand */}
              <div className={`grid ${data.unit2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 text-lg sm:text-xl font-bold py-1.5`}>
                <div className="flex justify-center items-center gap-3 tracking-widest text-slate-800 dark:text-slate-100">
                  {data.row1_unit1.map((d, i) => {
                    const isStruck = data.operation === '-' && data.borrows1 && data.borrows1[i] && data.borrows1[i] !== '—';
                    return (
                      <span
                        key={i}
                        className={`inline-block w-6 text-center ${
                          isStruck
                            ? 'line-through decoration-rose-500 decoration-[2.5px] text-slate-400 dark:text-slate-500 font-semibold'
                            : ''
                        }`}
                      >
                        {d}
                      </span>
                    );
                  })}
                </div>
                {data.unit2 ? (
                  <div className="flex justify-center items-center gap-3 tracking-widest text-slate-800 dark:text-slate-100 border-l border-slate-300 dark:border-slate-700 pl-2">
                    {data.row1_unit2.map((d, i) => {
                      const isStruck = data.operation === '-' && data.borrows2 && data.borrows2[i] && data.borrows2[i] !== '—';
                      return (
                        <span
                          key={i}
                          className={`inline-block w-6 text-center ${
                            isStruck
                              ? 'line-through decoration-rose-500 decoration-[2.5px] text-slate-400 dark:text-slate-500 font-semibold'
                              : ''
                          }`}
                        >
                          {d}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Row 2: Subtrahend / Multiplier with Operation Sign */}
              <div className={`grid ${data.unit2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 text-lg sm:text-xl font-bold py-1 relative`}>
                <div className="flex justify-center items-center gap-3 tracking-widest text-slate-800 dark:text-slate-100 relative">
                  <span className={`absolute -left-3 font-black text-xl ${
                    data.operation === '-' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {data.operation}
                  </span>
                  {data.row2_unit1.map((d, i) => (
                    <span key={i} className="inline-block w-6 text-center">
                      {d}
                    </span>
                  ))}
                </div>
                {data.unit2 ? (
                  <div className="flex justify-center items-center gap-3 tracking-widest text-slate-800 dark:text-slate-100 border-l border-slate-300 dark:border-slate-700 pl-2">
                    {data.row2_unit2.map((d, i) => (
                      <span key={i} className="inline-block w-6 text-center">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Dividing Double Line */}
              <div className="border-b-2 border-t-2 border-slate-800 dark:border-slate-200 my-1.5 h-1"></div>

              {/* Answer Row */}
              <div className={`grid ${data.unit2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 text-xl sm:text-2xl font-black py-1 text-emerald-600 dark:text-emerald-400`}>
                <div className="flex justify-center items-center gap-3 tracking-widest">
                  {data.ans_unit1.map((d, i) => (
                    <span key={i} className="inline-block w-6 text-center">
                      {d}
                    </span>
                  ))}
                </div>
                {data.unit2 ? (
                  <div className="flex justify-center items-center gap-3 tracking-widest border-l border-slate-300 dark:border-slate-700 pl-2">
                    {data.ans_unit2.map((d, i) => (
                      <span key={i} className="inline-block w-6 text-center">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Summary Pill */}
        <div className="mt-3 pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            🎯 कुल उत्तर:{' '}
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 inline-block ml-1">
              {data.finalAnswer}
            </span>
          </span>
        </div>
      </div>

      {/* 💡 EXPLICIT "कहाँ से उधार ली और किसमें से माइनस हुआ / हासिल कहाँ से आई" GUIDE BOX */}
      {flow && (
        <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3.5 ${
          isDarkMode
            ? 'bg-slate-900 border-amber-600/60 text-slate-100'
            : data.operation === '-'
            ? 'bg-gradient-to-br from-rose-50/80 via-amber-50/40 to-white border-rose-300 shadow-sm'
            : 'bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white border-blue-300 shadow-sm'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-rose-200/60 dark:border-rose-900/40">
            <span className={`p-1.5 rounded-xl ${
              data.operation === '-' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              <Lightbulb className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {data.operation === '-'
                  ? '💡 उधार (Borrow) कहाँ से ली और किसमें से माइनस हुआ?'
                  : data.operation === '÷'
                  ? '💡 भाग विधि (Division) के नियम व जांच सूत्र'
                  : '💡 हासिल (Carry) कहाँ से आई और किसमें जुड़ी?'}
              </h4>
              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                हर बच्चे के लिए आसान चरणबद्ध समझ (Easy Working Path)
              </p>
            </div>
          </div>

          {/* PART 1: कहाँ से ली / नियम */}
          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/60 shadow-2xs space-y-2">
            <div className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <span>{flow.kahaSeLiTitle}</span>
            </div>

            {/* Visual Arrow Banner */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-md border border-rose-300 dark:border-rose-700 font-black text-rose-700 dark:text-rose-300 shadow-2xs">
                {flow.kahaSeLiSource}
              </span>
              <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-md border border-emerald-300 dark:border-emerald-700 font-black text-emerald-700 dark:text-emerald-300 shadow-2xs">
                {flow.kahaSeLiTarget}
              </span>
            </div>

            {/* Bullet Explanations */}
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1 pl-1">
              {flow.kahaSeLiExplanation.map((exp, eIdx) => (
                <li key={eIdx} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-black">•</span>
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PART 2: किसमें से माइनस हुआ / किसमें जुड़ी / जांच */}
          <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs space-y-2">
            <div className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span>{flow.kismeMinusHuaTitle}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {flow.subtractions.map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1"
                >
                  <span className="font-black text-emerald-950 dark:text-emerald-200 block">
                    {sub.columnName}
                  </span>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-sm bg-white dark:bg-slate-900 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 inline-block shadow-2xs">
                    {sub.equation}
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 pt-0.5">
                    {sub.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📋 UNIFIED COMPACT STEP-BY-STEP BREAKDOWN (1 SINGLE CLEAN CARD, MINIMAL SPACE, HIGH-DENSITY USEFUL DATA) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
            <span>📝</span>
            <span>चरण-दर-चरण हल (Step-by-Step Calculation)</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            कुल {data.steps.length} चरण
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {data.steps.map((st, sIdx) => {
            const isLast = sIdx === data.steps.length - 1;
            return (
              <div
                key={sIdx}
                className={`p-2.5 sm:px-3 sm:py-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${
                  isLast
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      isLast
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {st.title.replace(/:.*/, '')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {st.description}
                  </span>
                </div>

                {st.details && st.details.length > 0 && (
                  <div className="shrink-0 flex flex-wrap items-center gap-1.5 pl-6 sm:pl-0">
                    {st.details.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          isLast
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-mono'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
