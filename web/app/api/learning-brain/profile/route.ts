import { NextRequest, NextResponse } from 'next/server';
import { getStudentProfile, saveStudentProfile } from '@/lib/learning-brain/profileManager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || searchParams.get('id') || searchParams.get('phone') || '9610328630';

    const profile = await getStudentProfile(studentId);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('GET /api/learning-brain/profile error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error loading learning profile' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body;

    if (!profile || (!profile.studentId && !profile.studentPhone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid profile data provided' },
        { status: 400 }
      );
    }

    const saved = await saveStudentProfile(profile);

    return NextResponse.json({
      success: saved,
      profile,
    });
  } catch (error: any) {
    console.error('POST /api/learning-brain/profile error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error saving learning profile' },
      { status: 500 }
    );
  }
}
