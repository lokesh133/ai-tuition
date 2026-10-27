import { NextRequest, NextResponse } from 'next/server';
import { generateAndSaveOtp } from '@/lib/otpStore';
import { findStudentByPhone } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Mobile number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).' },
        { status: 400 }
      );
    }

    if (purpose !== 'SIGNUP' && purpose !== 'FORGOT_PASSWORD' && purpose !== 'LOGIN') {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP purpose specified.' },
        { status: 400 }
      );
    }

    const existingStudent = await findStudentByPhone(cleanPhone);

    // If SIGNUP, phone must not already exist
    if (purpose === 'SIGNUP' && existingStudent) {
      return NextResponse.json(
        { success: false, message: 'This mobile number is already registered. Please Login instead.' },
        { status: 409 }
      );
    }

    // If FORGOT_PASSWORD, phone must exist
    if (purpose === 'FORGOT_PASSWORD' && !existingStudent) {
      return NextResponse.json(
        { success: false, message: 'No registered student account found with this mobile number. Please Sign Up first.' },
        { status: 404 }
      );
    }

    const { otp, expiresAt } = generateAndSaveOtp(cleanPhone, purpose);

    // In production, integrate Fast2SMS / Twilio SMS API here if SMS_API_KEY is configured in env.
    // In development and for seamless testing, return simulated OTP in response and console.
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
      // Provide demo OTP so testing is frictionless right inside the UI
      demoOtp: otp,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while sending OTP.' },
      { status: 500 }
    );
  }
}
