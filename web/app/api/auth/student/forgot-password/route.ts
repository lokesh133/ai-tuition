import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otpStore';
import { updateStudentPasswordByPhone, findStudentByPhone } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, newPassword } = await req.json();

    if (!phone || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Phone number, OTP, and new password are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (newPassword.trim().length < 4) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 4 characters/digits.' },
        { status: 400 }
      );
    }

    // 1. Verify OTP
    const verification = verifyOtpCode(cleanPhone, otp.trim(), 'FORGOT_PASSWORD');
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    // 2. Update password in Database
    const updated = await updateStudentPasswordByPhone(cleanPhone, newPassword.trim());
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Could not update password. Account not found.' },
        { status: 404 }
      );
    }

    const student = await findStudentByPhone(cleanPhone);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully! You can now login.',
      student: student
        ? {
            id: student.id,
            name: student.name,
            phone: student.phone,
            classGrade: student.classGrade,
            board: student.board,
          }
        : undefined,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while resetting password.' },
      { status: 500 }
    );
  }
}
