import { NextRequest, NextResponse } from 'next/server';
import { generateAdaptiveQuestions } from '@/lib/learning-brain/adaptiveEngine';
import { getStudentProfile } from '@/lib/learning-brain/profileManager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || searchParams.get('id') || 'guest';
    const subjectId = (searchParams.get('subjectId') || 'math') as any;
    const chapterNumber = searchParams.get('chapterNumber') ? parseInt(searchParams.get('chapterNumber')!, 10) : 1;
    const classGrade = searchParams.get('classGrade') || 'Class 4th';
    const board = searchParams.get('board') || 'RBSE';
    const medium = searchParams.get('medium') || 'HINDI';
    const count = searchParams.get('count') ? parseInt(searchParams.get('count')!, 10) : 3;

    const profile = await getStudentProfile(studentId);

    const session = generateAdaptiveQuestions({
      subjectId,
      chapterNumber,
      classGrade,
      board,
      medium,
      profile,
      count,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('GET /api/learning-brain/practice error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error generating adaptive practice' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId = 'guest',
      subjectId = 'math',
      chapterNumber = 1,
      classGrade = 'Class 4th',
      board = 'RBSE',
      medium = 'HINDI',
      count = 3,
    } = body;

    const profile = await getStudentProfile(studentId);

    const session = generateAdaptiveQuestions({
      subjectId,
      chapterNumber,
      classGrade,
      board,
      medium,
      profile,
      count,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('POST /api/learning-brain/practice error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error generating adaptive practice' },
      { status: 500 }
    );
  }
}
