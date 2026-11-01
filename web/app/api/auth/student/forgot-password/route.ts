import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otpStore';
import {
  updateStudentPasswordByEmail,
  updateStudentPasswordByPhone,
  findStudentByEmail,
  findStudentByPhone,
} from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, identifier, otp, newPassword } = body;

    const targetEmail = (email || (identifier && identifier.includes('@') ? identifier : '') || '').trim().toLowerCase();
    const rawPhone = (phone || (identifier && !identifier.includes('@') ? identifier : '') || '').toString().trim();
    const cleanOtp = String(otp || '').trim();
    const cleanPassword = String(newPassword || '').trim();

    if (!cleanOtp) {
      return NextResponse.json(
        { success: false, message: 'Please enter the verification OTP code.' },
        { status: 400 }
      );
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 4 characters or digits.' },
        { status: 400 }
      );
    }

    // 1. Reset via Email
    if (targetEmail) {
      const verification = verifyOtpCode(targetEmail, cleanOtp, 'FORGOT_PASSWORD');
      if (!verification.valid) {
        return NextResponse.json(
          { success: false, message: verification.message },
          { status: 400 }
        );
      }

      const updated = await updateStudentPasswordByEmail(targetEmail, cleanPassword);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Could not reset password. No account found with this email.' },
          { status: 404 }
        );
      }

      const student = await findStudentByEmail(targetEmail);
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now login with your new password.',
        student: student
          ? {
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
            }
          : undefined,
      });
    }

    // 2. Reset via Mobile Phone
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address or 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const verification = verifyOtpCode(cleanPhone, cleanOtp, 'FORGOT_PASSWORD');
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    const updated = await updateStudentPasswordByPhone(cleanPhone, cleanPassword);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Could not reset password. Account not found with this mobile number.' },
        { status: 404 }
      );
    }

    const student = await findStudentByPhone(cleanPhone);
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
      student: student
        ? {
            id: student.id,
            name: student.name,
            phone: student.phone,
            email: student.email,
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
