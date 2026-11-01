import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveOtp } from '@/lib/otpStore';
import { findStudentByPhone, findStudentByEmail } from '@/lib/dataStore';
import { sendOtpEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, identifier, purpose } = body;

    const targetEmail = (email || (identifier && identifier.includes('@') ? identifier : '') || '').trim().toLowerCase();
    const rawPhone = (phone || (identifier && !identifier.includes('@') ? identifier : '') || '').toString().trim();

    if (purpose !== 'SIGNUP' && purpose !== 'FORGOT_PASSWORD' && purpose !== 'LOGIN') {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP purpose specified.' },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. EMAIL OTP DISPATCH (100% FREE & FAST)
    // ==========================================
    if (targetEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid email address (e.g. name@gmail.com).' },
          { status: 400 }
        );
      }

      const existingStudent = await findStudentByEmail(targetEmail);

      if (purpose === 'LOGIN' && !existingStudent) {
        return NextResponse.json(
          { success: false, message: 'This email is not registered. Please Sign Up first.' },
          { status: 404 }
        );
      }

      if (purpose === 'SIGNUP' && existingStudent) {
        return NextResponse.json(
          { success: false, message: 'This email is already registered. Please Login instead.' },
          { status: 409 }
        );
      }

      if (purpose === 'FORGOT_PASSWORD' && !existingStudent) {
        return NextResponse.json(
          { success: false, message: 'No registered student account found with this email. Please Sign Up first.' },
          { status: 404 }
        );
      }

      const { otp } = generateAndSaveOtp(targetEmail, purpose);

      // Send real email via SMTP
      const emailResult = await sendOtpEmail(targetEmail, otp, existingStudent?.name);

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to ${targetEmail}. Please check your inbox / spam folder.`,
        demoOtp: otp,
        expiresInSeconds: 300,
      });
    }

    // ==========================================
    // 2. MOBILE PHONE OTP DISPATCH
    // ==========================================
    if (!rawPhone) {
      return NextResponse.json(
        { success: false, message: 'Please provide either a mobile number or an email address.' },
        { status: 400 }
      );
    }

    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).' },
        { status: 400 }
      );
    }

    const existingStudent = await findStudentByPhone(cleanPhone);

    if (purpose === 'LOGIN' && !existingStudent) {
      return NextResponse.json(
        { success: false, message: 'This mobile number is not registered. Please Sign Up first.' },
        { status: 404 }
      );
    }

    if (purpose === 'SIGNUP' && existingStudent) {
      return NextResponse.json(
        { success: false, message: 'This mobile number is already registered. Please Login instead.' },
        { status: 409 }
      );
    }

    if (purpose === 'FORGOT_PASSWORD' && !existingStudent) {
      return NextResponse.json(
        { success: false, message: 'No registered student account found with this mobile number. Please Sign Up first.' },
        { status: 404 }
      );
    }

    const { otp } = generateAndSaveOtp(cleanPhone, purpose);

    // Fast2SMS integration if present
    const smsApiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
    if (smsApiKey) {
      try {
        await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${smsApiKey}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`);
      } catch (smsErr) {
        console.error('Fast2SMS gateway error:', smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}.`,
      demoOtp: otp,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error while sending OTP.' },
      { status: 500 }
    );
  }
}
