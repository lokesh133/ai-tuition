import { NextResponse } from 'next/server';
import { getAllStudents, toggleStudentSubscription } from '@/lib/dataStore';

export async function GET() {
  try {
    const students = await getAllStudents();
    return NextResponse.json({
      success: true,
      totalStudents: students.length,
      students,
    });
  } catch (error: any) {
    console.error('Fetch students error:', error);
    return NextResponse.json(
      { success: false, message: 'छात्र डेटा लोड करने में त्रुटि।' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { studentId, isFree } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: 'Student ID आवश्यक है।' },
        { status: 400 }
      );
    }

    const result = await toggleStudentSubscription(studentId, Boolean(isFree));

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      isSubscribed: result.isSubscribed,
    });
  } catch (error: any) {
    console.error('Toggle subscription error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'सब्सक्रिप्शन अपडेट करने में त्रुटि।' },
      { status: 500 }
    );
  }
}
