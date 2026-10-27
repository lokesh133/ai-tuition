// ==============================================================================
// MODULE 2: AI MISTAKE DETECTIVE
// Deep Diagnostic Engine for Notebook Photos and Typed Steps
// Extracts steps -> Verifies math deterministically -> Identifies earliest wrong step
// -> Classifies error -> Explains 'Why' -> Progressive Hints -> Immediate Remediation
// ==============================================================================

import { MistakeDetectiveResult, MistakeCategory, SubjectId, ExtractedWorkingStep } from './types';
import { verifyMathSteps, evaluateSimpleArithmetic } from './deterministicVerifier';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface MistakeDetectiveInput {
  subjectId?: SubjectId;
  questionText?: string;
  expectedAnswer?: string;
  studentAnswerText?: string;
  imageBase64?: string;
  imageMime?: string;
  classGrade?: string;
  medium?: string;
}

/**
 * Main Mistake Detective Entry Point
 */
export async function analyzeStudentAttempt(input: MistakeDetectiveInput): Promise<MistakeDetectiveResult> {
  const subject = input.subjectId || 'math';

  // 1. If image provided, run Vision Diagnostic via Gemini (or fallback parser)
  if (input.imageBase64 && GEMINI_API_KEY) {
    try {
      const visionResult = await runGeminiVisionDetective(input);
      if (visionResult) {
        // Cross-verify math steps deterministically if math subject
        if (subject === 'math' && visionResult.workingSteps.length > 0) {
          const stepStrings = visionResult.workingSteps.map((s) => s.rawText);
          const mathCheck = verifyMathSteps(stepStrings, visionResult.expectedFinalAnswer);

          if (!mathCheck.isVerified && mathCheck.earliestWrongStep !== -1) {
            visionResult.earliestWrongStepIndex = mathCheck.earliestWrongStep;
            visionResult.isCorrect = false;
            if (mathCheck.verifiedSteps[mathCheck.earliestWrongStep]?.mismatchReason) {
              visionResult.workingSteps[mathCheck.earliestWrongStep].errorComment =
                mathCheck.verifiedSteps[mathCheck.earliestWrongStep].mismatchReason;
            }
          }
        }
        return visionResult;
      }
    } catch (err) {
      console.warn('[MistakeDetective] Vision API call failed, falling back to deterministic solver:', err);
    }
  }

  // 2. Text-based attempt (typed steps or question + answer)
  return runTextMistakeDetective(input);
}

/**
 * Text-based Mistake Diagnostic (Deterministic + Rule-Based)
 */
export function runTextMistakeDetective(input: MistakeDetectiveInput): MistakeDetectiveResult {
  const question = input.questionText || 'Arithmetic Practice Problem';
  const rawStudent = (input.studentAnswerText || '').trim();
  const expected = (input.expectedAnswer || '').trim();
  const subject = input.subjectId || 'math';

  // Parse lines as working steps
  const rawLines = rawStudent.split('\n').map((l) => l.trim()).filter(Boolean);
  const workingSteps: ExtractedWorkingStep[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    workingSteps.push({
      stepNumber: i + 1,
      rawText: rawLines[i],
      isCorrect: true,
    });
  }

  // If no multi-line steps, treat the single line as step 1
  if (workingSteps.length === 0 && rawStudent) {
    workingSteps.push({
      stepNumber: 1,
      rawText: rawStudent,
      isCorrect: true,
    });
  }

  if (subject === 'math') {
    const stepTexts = workingSteps.map((w) => w.rawText);
    const mathCheck = verifyMathSteps(stepTexts, expected);

    let earliestWrong = mathCheck.earliestWrongStep;
    let isCorrect = mathCheck.isVerified;
    let mistakeType: MistakeCategory = 'CALCULATION';
    let why = '';
    let hint1 = '';
    let hint2 = '';
    let remediationQ = {
      questionId: `rem-math-${Date.now()}`,
      questionText: 'Ek aur aasan sawaal khud solve karein: 25 + 47 = ?',
      correctAnswer: '72',
      explanation: '7 + 5 = 12 (2 likhein, 1 carry), 2 + 4 + 1 = 7. Answer: 72.',
      options: ['62', '71', '72', '82'],
    };

    if (earliestWrong !== -1) {
      isCorrect = false;
      workingSteps[earliestWrong].isCorrect = false;
      const wrongStepText = workingSteps[earliestWrong].rawText;

      // Determine mistake category
      if (wrongStepText.includes('/') || question.includes('/')) {
        mistakeType = 'CONCEPTUAL';
        why = 'Fractions add karte samay denominators (har) ko direct add nahi kiya jaata, pehle LCM lena zaroori hai.';
        hint1 = 'Sawaal ko dhyan se dekhein: kya dono fractions ka base (denominator) barabar hai?';
        hint2 = 'Formula: a/b + c/b = (a+c)/b. Agar denominator alag hain toh pehle common LCM nikalein.';
      } else if (wrongStepText.includes('*') || wrongStepText.includes('×')) {
        mistakeType = 'CALCULATION';
        why = 'Multiplication karte samay carry-over number ko add karna bhool gaye.';
        hint1 = 'Unit digit ko multiply karne ke baad jo carry aayi thi, use tens digit me add kiya kya?';
        hint2 = 'Har step ko alag-alag columns me likhein aur carry ko upar circle me mark karein.';
      } else {
        mistakeType = 'CALCULATION';
        why = `Step ${earliestWrong + 1} me calculation slip hui hai. Likhne me ya add karne me thodi chook hui.`;
        hint1 = `Step ${earliestWrong + 1} (${wrongStepText}) ko dubara dhyaan se calculate karke dekhein.`;
        hint2 = 'Dono numbers ko column me ek ke neeche ek likh kar check karein.';
      }
    } else {
      why = 'Shabaash! Aapke saare steps aur final calculation 100% sahi hain.';
      hint1 = 'Sabhi steps sahi hain.';
      hint2 = 'Concept poori tarah pakka hai.';
    }

    return {
      success: true,
      detectedSubject: 'math',
      conceptKey: 'math_arithmetic_calculation',
      conceptTitle: 'Step-by-Step Arithmetic Calculation',
      questionText: question,
      expectedFinalAnswer: expected || String(mathCheck.expectedFinalValue || ''),
      studentFinalAnswer: rawStudent,
      workingSteps,
      earliestWrongStepIndex: earliestWrong,
      mistakeType,
      isCorrect,
      whyMistakeOccurred: why,
      teacherEncouragement: isCorrect
        ? 'Bohot badhiya beta! Har step saaf aur bilkul sahi hai.'
        : 'Koi baat nahi! Galti se hi seekhte hain. Dekhiye Sharma Sir ne red color me mark kiya hai ki kahan chook hui.',
      progressiveHints: {
        level1Socratic: hint1,
        level2RuleFormula: hint2,
        level3FullStepSolution: `Correct step: Expected answer is ${expected || mathCheck.expectedFinalValue}.`,
      },
      remediationQuestion: remediationQ,
    };
  }

  // Non-Math subjects (English, Science, SST, Hindi)
  const isMatch = rawStudent.toLowerCase().replace(/[^a-z0-9]/g, '') === expected.toLowerCase().replace(/[^a-z0-9]/g, '');

  return {
    success: true,
    detectedSubject: subject,
    conceptKey: `${subject}_core_concept`,
    conceptTitle: `${subject.toUpperCase()} Core Concept Answer`,
    questionText: question,
    expectedFinalAnswer: expected,
    studentFinalAnswer: rawStudent,
    workingSteps,
    earliestWrongStepIndex: isMatch ? -1 : 0,
    mistakeType: isMatch ? 'CARELESS' : 'CONCEPTUAL',
    isCorrect: isMatch,
    whyMistakeOccurred: isMatch
      ? 'Aapka answer bilkul sahi hai!'
      : 'Answer me mukhy keyword ya factual detail missing hai jo textbook ke anusar honi chahiye.',
    teacherEncouragement: isMatch
      ? 'Superb work! Aapne poori tarah sahi answer diya hai.'
      : 'Achha prayas! Chalo dekhte hain isme kaunsa main point jodna tha.',
    progressiveHints: {
      level1Socratic: 'Question me poocha gaya mukhya vishay sochiye aur textbook ki paribhasha yaad kijiye.',
      level2RuleFormula: `Standard keyword jo aana chahiye: "${expected.slice(0, 30)}..."`,
      level3FullStepSolution: `Adarsh Answer: ${expected}`,
    },
    remediationQuestion: {
      questionId: `rem-${subject}-${Date.now()}`,
      questionText: `Similar Practice: ${question}`,
      correctAnswer: expected,
      explanation: `Adarsh Answer: ${expected}`,
      options: [expected, 'Option B', 'Option C', 'Option D'],
    },
  };
}

/**
 * Gemini Vision Detective for Handwritten Notebook Photos
 */
async function runGeminiVisionDetective(input: MistakeDetectiveInput): Promise<MistakeDetectiveResult | null> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are an expert Indian School Teacher (like Sharma Sir / Neha Mam) diagnosing a school student's handwritten notebook page.
Analyze the image with utmost pedagogical accuracy.

OUTPUT STRICTLY VALID JSON ONLY (No markdown formatting, no code blocks):
{
  "clarificationNeeded": false,
  "clarificationPrompt": "",
  "detectedSubject": "math",
  "conceptKey": "math_multiplication_carry",
  "conceptTitle": "Multi-digit Multiplication with Carry",
  "questionText": "Question read from page",
  "expectedFinalAnswer": "1250",
  "studentFinalAnswer": "1150",
  "workingSteps": [
    { "stepNumber": 1, "rawText": "25 * 50", "isCorrect": true, "errorComment": "" },
    { "stepNumber": 2, "rawText": "5 * 0 = 0", "isCorrect": true, "errorComment": "" },
    { "stepNumber": 3, "rawText": "calculated 1150 instead of 1250", "isCorrect": false, "errorComment": "Carry 2 was not added to the 10s column" }
  ],
  "earliestWrongStepIndex": 2,
  "mistakeType": "CALCULATION",
  "isCorrect": false,
  "whyMistakeOccurred": "Yahan student ne 5 * 2 = 10 me carry 2 add karna bhool gaya, isliye 1150 aa gaya.",
  "teacherEncouragement": "Koi baat nahi beta! Sharma Sir aapko bata rahe hain ki carry ko hamesha upar chhota sa circle bana kar likha karein.",
  "progressiveHints": {
    "level1Socratic": "Step 3 ko dhyan se dekho: Unit digit multiply karne ke baad carry kya aayi thi?",
    "level2RuleFormula": "Rule: Multiplication me pehle product nikalte hain, fir previous carry add hoti hai.",
    "level3FullStepSolution": "Sahi answer: 25 * 50 = 1250."
  },
  "remediationQuestion": {
    "questionId": "rem_1",
    "questionText": "Ab is sawaal ko khud bina dekhe solve karke dikhao: 15 * 30 = ?",
    "options": ["400", "420", "450", "500"],
    "correctAnswer": "450",
    "explanation": "15 * 3 = 45, zero lagaya => 450."
  }
}

CRITICAL RULES:
1. If handwriting is illegible or image is too dark/blurry to read with confidence, set "clarificationNeeded": true, and write a warm clarificationPrompt in Hinglish asking the student to click a clearer photo with good lighting.
2. mistakeType MUST be one of: "CONCEPTUAL", "CALCULATION", "FORMULA", "READING", "CARELESS".
3. earliestWrongStepIndex is 0-indexed integer pointing to the FIRST step that contains an error. If student's work is 100% correct, set to -1 and isCorrect to true.
4. remediationQuestion must be an analogous, simple question of the same concept so the student can prove independent mastery.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: input.imageMime || 'image/jpeg',
              data: input.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn('[GeminiVision] Error status:', response.status, errText);
    return null;
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: MistakeDetectiveResult = JSON.parse(cleaned);
    parsed.success = true;
    return parsed;
  } catch (parseErr) {
    console.warn('[GeminiVision] JSON parse error:', parseErr, text);
    return null;
  }
}
