import { NextRequest, NextResponse } from 'next/server';
import { findStudentByPhone } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: 'कृपया मोबाइल नंबर और पासवर्ड दर्ज करें।' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const student = await findStudentByPhone(cleanPhone);

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'यह मोबाइल नंबर रजिस्टर्ड नहीं है। कृपया पहले साइन अप करें।' },
        { status: 404 }
      );
    }

    if (student.password && student.password !== password.trim()) {
      return NextResponse.json(
        { success: false, message: 'गलत पासवर्ड! कृपया पुनः प्रयास करें।' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `नमस्ते ${student.name}, AI Tutor में आपका स्वागत है!`,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        classGrade: student.classGrade,
        board: student.board,
        isSubscribed: student.isSubscribed,
      },
    });
  } catch (error: any) {
    console.error('Student login error:', error);
    return NextResponse.json(
      { success: false, message: 'लॉगिन में त्रुटि हुई।' },
      { status: 500 }
    );
  }
}
