import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpCode } from '@/lib/otpStore';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, purpose } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone number and OTP are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanOtp = otp.trim();

    const verification = verifyOtpCode(cleanPhone, cleanOtp, purpose);

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile number verified successfully!',
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while verifying OTP.' },
      { status: 500 }
    );
  }
}
