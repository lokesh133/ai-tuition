import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otpStore';
import { findStudentByPhone, createStudent } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'कृपया 10 अंकों का मोबाइल नंबर और ओटीपी दर्ज करें।' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanOtp = String(otp).trim();

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।' },
        { status: 400 }
      );
    }

    // Verify OTP
    const verification = verifyOtpCode(cleanPhone, cleanOtp, 'LOGIN');
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    // Find student in DB/store
    let student = await findStudentByPhone(cleanPhone);

    // If student doesn't exist yet, auto-create a student profile so login is 100% seamless
    if (!student) {
      student = await createStudent({
        name: `विद्यार्थी (${cleanPhone.slice(-4)})`,
        phone: cleanPhone,
        password: '',
        classGrade: 'Class 5th',
        board: 'CBSE',
        medium: 'HINDI',
        city: 'India',
        isSubscribed: false,
      });
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
        medium: student.medium,
        isSubscribed: Boolean(student.isSubscribed),
      },
    });
  } catch (error: any) {
    console.error('Student OTP login error:', error);
    return NextResponse.json(
      { success: false, message: 'ओटीपी लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।' },
      { status: 500 }
    );
  }
}
