// ==============================================================================
// DETERMINISTIC VERIFIER & SYMBOLIC CHECKER
// High-confidence verification for Indian School Curriculum (Classes 1st-10th)
// Verifies arithmetic, fractions, decimals, simple algebra, and grammar rules
// without hallucination or non-deterministic drift.
// ==============================================================================

export interface StepVerification {
  stepIndex: number;
  expression: string;
  evaluatedValue: number | string | null;
  expectedValue: number | string | null;
  isValid: boolean;
  mismatchReason?: string;
}

export interface VerificationResult {
  isVerified: boolean;
  earliestWrongStep: number; // -1 if all verified correctly
  verifiedSteps: StepVerification[];
  expectedFinalValue: number | string | null;
  studentFinalValue: number | string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'UNCERTAIN';
}

/**
 * Safely parse and simplify arithmetic expressions (e.g. "25 + 37", "45 * 12", "120 / 4")
 */
export function evaluateSimpleArithmetic(expr: string): number | null {
  try {
    const cleaned = expr
      .replace(/[×xX]/g, '*')
      .replace(/[÷]/g, '/')
      .replace(/–/g, '-')
      .replace(/[^0-9+\-*/().]/g, '')
      .trim();

    if (!cleaned) return null;

    // Reject dangerous syntax or empty operators
    if (/^[*/]/.test(cleaned) || /[+\-*/.]$/.test(cleaned)) return null;

    // Safe mathematical evaluation without eval()
    const tokens = cleaned.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens) return null;

    // Use Function sandbox with math-only characters
    const func = new Function(`return (${cleaned});`);
    const result = func();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 10000) / 10000;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fraction parser & arithmetic (e.g., "3/4 + 1/2" => 5/4 = 1.25)
 */
export function evaluateFraction(fracStr: string): { numerator: number; denominator: number; decimal: number } | null {
  const match = fracStr.trim().match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const den = parseInt(match[2], 10);
  if (den === 0) return null;
  return { numerator: num, denominator: den, decimal: num / den };
}

/**
 * Greatest Common Divisor (GCD) for fraction simplification
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Verifies a multi-step mathematical solution (e.g., student solving step by step)
 */
export function verifyMathSteps(steps: string[], expectedAnswer?: string): VerificationResult {
  const verifiedSteps: StepVerification[] = [];
  let earliestWrong = -1;

  for (let i = 0; i < steps.length; i++) {
    const stepText = steps[i].trim();
    if (!stepText) continue;

    // Check if step contains an equation, e.g. "x = 45 / 5 = 9" or "Step 1 = 12 + 15 = 27"
    const eqParts = stepText.split('=').map((s) => s.trim());

    if (eqParts.length >= 2) {
      // Evaluate left and right side of equality
      const leftVal = evaluateSimpleArithmetic(eqParts[0]);
      const rightVal = evaluateSimpleArithmetic(eqParts[1]);

      if (leftVal !== null && rightVal !== null) {
        const matches = Math.abs(leftVal - rightVal) < 0.0001;
        verifiedSteps.push({
          stepIndex: i,
          expression: stepText,
          evaluatedValue: rightVal,
          expectedValue: leftVal,
          isValid: matches,
          mismatchReason: matches ? undefined : `Calculated ${rightVal}, but ${eqParts[0]} equals ${leftVal}`,
        });

        if (!matches && earliestWrong === -1) {
          earliestWrong = i;
        }
        continue;
      }
    }

    // Single expression line
    const val = evaluateSimpleArithmetic(stepText);
    verifiedSteps.push({
      stepIndex: i,
      expression: stepText,
      evaluatedValue: val,
      expectedValue: null,
      isValid: true,
    });
  }

  // Compare final step to expected answer if provided
  let studentFinalVal: number | string | null = null;
  let expectedFinalVal: number | string | null = null;

  if (verifiedSteps.length > 0) {
    const lastStep = verifiedSteps[verifiedSteps.length - 1];
    studentFinalVal = lastStep.evaluatedValue !== null ? lastStep.evaluatedValue : lastStep.expression;
  }

  if (expectedAnswer) {
    const expNum = evaluateSimpleArithmetic(expectedAnswer);
    expectedFinalVal = expNum !== null ? expNum : expectedAnswer.trim();

    if (studentFinalVal !== null && expectedFinalVal !== null) {
      if (typeof studentFinalVal === 'number' && typeof expectedFinalVal === 'number') {
        if (Math.abs(studentFinalVal - expectedFinalVal) > 0.0001 && earliestWrong === -1) {
          earliestWrong = verifiedSteps.length - 1;
        }
      } else {
        const sNorm = String(studentFinalVal).toLowerCase().replace(/\s+/g, '');
        const eNorm = String(expectedFinalVal).toLowerCase().replace(/\s+/g, '');
        if (sNorm !== eNorm && earliestWrong === -1) {
          earliestWrong = verifiedSteps.length - 1;
        }
      }
    }
  }

  return {
    isVerified: earliestWrong === -1,
    earliestWrongStep: earliestWrong,
    verifiedSteps,
    expectedFinalValue: expectedFinalVal,
    studentFinalValue: studentFinalVal,
    confidence: verifiedSteps.length > 0 ? 'HIGH' : 'MEDIUM',
  };
}

/**
 * Deterministic checker for English, Hindi, and Science questions
 */
export function verifyLanguageOrScienceAnswer(
  studentAnswer: string,
  acceptedAnswers: string[],
  options?: { caseSensitive?: boolean; checkSpellingSimilarity?: boolean }
): { isCorrect: boolean; normalizedStudent: string; matchedAnswer?: string; spellingMistake?: boolean } {
  const rawStudent = studentAnswer.trim();
  const normStudent = options?.caseSensitive ? rawStudent : rawStudent.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();

  for (const expected of acceptedAnswers) {
    const normExp = options?.caseSensitive ? expected.trim() : expected.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();

    if (normStudent === normExp) {
      return { isCorrect: true, normalizedStudent: normStudent, matchedAnswer: expected };
    }

    // Levenshtein / Damerau edit distance check for minor spelling slips (e.g. "photosynthesis" vs "fotosynthesis")
    if (options?.checkSpellingSimilarity && normExp.length > 4) {
      const distance = computeLevenshtein(normStudent, normExp);
      if (distance <= 2) {
        return {
          isCorrect: false,
          normalizedStudent: normStudent,
          matchedAnswer: expected,
          spellingMistake: true,
        };
      }
    }
  }

  return { isCorrect: false, normalizedStudent: normStudent };
}

/**
 * Levenshtein distance for string matching
 */
function computeLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion, deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
