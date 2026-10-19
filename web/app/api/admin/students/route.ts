import { NextResponse } from 'next/server';
import { getAllStudents } from '@/lib/dataStore';

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
