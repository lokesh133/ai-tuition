import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otpStore';
import { findStudentByPhone, findStudentByEmail, createStudent } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, identifier, otp } = body;

    const targetEmail = (email || (identifier && identifier.includes('@') ? identifier : '') || '').trim().toLowerCase();
    const rawPhone = (phone || (identifier && !identifier.includes('@') ? identifier : '') || '').toString().trim();
    const cleanOtp = String(otp || '').trim();

    if (!cleanOtp) {
      return NextResponse.json(
        { success: false, message: 'Please enter the verification OTP.' },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. EMAIL OTP LOGIN VERIFICATION
    // ==========================================
    if (targetEmail) {
      const verification = verifyOtpCode(targetEmail, cleanOtp, 'LOGIN');
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: verification.message },
          { status: 400 }
        );
      }

      let student = await findStudentByEmail(targetEmail);

      if (!student) {
        return NextResponse.json(
          { success: false, message: 'This email is not registered. Please Sign Up first.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Welcome back ${student.name}!`,
        student: {
          id: student.id,
          name: student.name,
          phone: student.phone || '',
          email: student.email || targetEmail,
          classGrade: student.classGrade,
          board: student.board,
          medium: student.medium,
          isSubscribed: Boolean(student.isSubscribed),
        },
      });
    }

    // ==========================================
    // 2. MOBILE PHONE OTP LOGIN VERIFICATION
    // ==========================================
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit mobile number or email.' },
        { status: 400 }
      );
    }

    const verification = verifyOtpCode(cleanPhone, cleanOtp, 'LOGIN');
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    let student = await findStudentByPhone(cleanPhone);

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'This mobile number is not registered. Please Sign Up first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back ${student.name}!`,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone,
        email: student.email || '',
        classGrade: student.classGrade,
        board: student.board,
        medium: student.medium,
        isSubscribed: Boolean(student.isSubscribed),
      },
    });
  } catch (error: any) {
    console.error('Student OTP login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while verifying OTP.' },
      { status: 500 }
    );
  }
}
