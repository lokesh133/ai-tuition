import { NextRequest, NextResponse } from 'next/server';
import { analyzeStudentAttempt } from '@/lib/learning-brain/mistakeDetective';
import { recordDiagnosedMistake } from '@/lib/learning-brain/profileManager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      subjectId = 'math',
      questionText,
      expectedAnswer,
      studentAnswerText,
      imageBase64,
      imageMime,
      classGrade,
      medium,
    } = body;

    const result = await analyzeStudentAttempt({
      subjectId,
      questionText,
      expectedAnswer,
      studentAnswerText,
      imageBase64,
      imageMime,
      classGrade,
      medium,
    });

    // If an error is diagnosed, update the student's learning profile
    if (result.success && !result.isCorrect && studentId) {
      try {
        await recordDiagnosedMistake(studentId, {
          conceptKey: result.conceptKey || `${subjectId}_core`,
          conceptTitle: result.conceptTitle || 'Core Concept',
          subjectId: result.detectedSubject || subjectId,
          chapterNumber: 1,
          misconception: result.whyMistakeOccurred,
          mistakeType: result.mistakeType,
        });
      } catch (profErr) {
        console.warn('Could not record diagnosed mistake to profile:', profErr);
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('POST /api/learning-brain/detect-mistake error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error diagnosing mistake' },
      { status: 500 }
    );
  }
}
