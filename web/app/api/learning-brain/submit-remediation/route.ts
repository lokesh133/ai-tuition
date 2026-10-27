import { NextRequest, NextResponse } from 'next/server';
import { recordMasteryAttempt } from '@/lib/learning-brain/profileManager';
import { verifyLanguageOrScienceAnswer, evaluateSimpleArithmetic } from '@/lib/learning-brain/deterministicVerifier';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId = 'guest',
      conceptKey = 'math_remediation',
      conceptTitle = 'Remediation Practice',
      subjectId = 'math',
      chapterNumber = 1,
      questionText,
      expectedAnswer,
      studentAnswer,
      hintsUsedCount = 0,
      timeTakenSeconds = 15,
    } = body;

    if (!studentAnswer || !expectedAnswer) {
      return NextResponse.json(
        { success: false, message: 'Student answer and expected answer are required' },
        { status: 400 }
      );
    }

    // Deterministic Verification
    let isCorrect = false;
    const rawStudent = String(studentAnswer).trim();
    const rawExpected = String(expectedAnswer).trim();

    const studentNum = evaluateSimpleArithmetic(rawStudent);
    const expNum = evaluateSimpleArithmetic(rawExpected);

    if (studentNum !== null && expNum !== null) {
      isCorrect = Math.abs(studentNum - expNum) < 0.0001;
    } else {
      const langCheck = verifyLanguageOrScienceAnswer(rawStudent, [rawExpected]);
      isCorrect = langCheck.isCorrect;
    }

    // Only considered truly independent if student didn't reveal the full solution
    const wasIndependent = hintsUsedCount < 2;

    // Update persistent student learning profile with verified evidence
    const updatedProfile = await recordMasteryAttempt(studentId, {
      conceptKey,
      conceptTitle,
      subjectId,
      chapterNumber,
      questionSnippet: questionText || 'Remediation question',
      isCorrect,
      wasIndependent,
      hintsUsedCount,
      timeTakenSeconds,
    });

    const conceptScore = updatedProfile.conceptMastery[conceptKey];

    return NextResponse.json({
      success: true,
      isCorrect,
      wasIndependent,
      feedback: isCorrect
        ? 'Shabaash! Aapne bilkul sahi solve kiya aur independent mastery earn ki!'
        : 'Sahi uttar nahi aaya, par koi baat nahi. Sharma Sir ne is concept ko revision schedule me rakh diya hai.',
      updatedConceptScore: conceptScore,
      updatedProfile,
    });
  } catch (error: any) {
    console.error('POST /api/learning-brain/submit-remediation error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error recording remediation' },
      { status: 500 }
    );
  }
}
