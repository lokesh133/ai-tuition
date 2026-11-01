import { NextRequest, NextResponse } from 'next/server';
import { findStudentByIdentifier, findStudentById } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, identifier, studentId, password } = body;

    const rawTarget = (email || phone || identifier || '').toString().trim();
    const cleanPassword = (password || '').toString().trim();

    if (!cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'कृपया अपना पासवर्ड दर्ज करें।' },
        { status: 400 }
      );
    }

    let student = null;
    if (studentId) {
      student = await findStudentById(studentId);
    }
    if (!student && rawTarget) {
      student = await findStudentByIdentifier(rawTarget);
    }

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'खाता नहीं मिला। कृपया पहले साइन अप करें।' },
        { status: 404 }
      );
    }

    if (student.password && student.password !== cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'गलत पासवर्ड! केवल अभिभावक ही अनलॉक कर सकते हैं।' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `सत्यापन सफल!`,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        classGrade: student.classGrade,
        board: student.board,
        isSubscribed: student.isSubscribed,
      },
    });
  } catch (error: any) {
    console.error('Student password verify error:', error);
    return NextResponse.json(
      { success: false, message: 'सत्यापन में त्रुटि हुई।' },
      { status: 500 }
    );
  }
}
