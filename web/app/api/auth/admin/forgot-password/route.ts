import { NextRequest, NextResponse } from 'next/server';
import { findAdminByEmail, updateAdminPassword } from '@/lib/dataStore';

// In-memory OTP storage for demo/development
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, otp, newPassword } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'कृपया एडमिन ईमेल दर्ज करें।' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await findAdminByEmail(cleanEmail);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'यह ईमेल एडमिन डेटाबेस में नहीं मिला।' },
        { status: 404 }
      );
    }

    // Step 1: Request OTP
    if (action === 'request_otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      console.log(`[Admin Forgot Password] OTP for ${cleanEmail} is: ${generatedOtp}`);

      return NextResponse.json({
        success: true,
        message: `पासवर्ड रीसेट 6-अंकीय कोड ${cleanEmail} पर भेज दिया गया है।`,
        debugOtp: generatedOtp,
      });
    }

    // Step 2: Reset Password with OTP
    if (action === 'reset_password') {
      if (!otp || !newPassword) {
        return NextResponse.json(
          { success: false, message: 'कृपया 6-अंकों का OTP और नया पासवर्ड दर्ज करें।' },
          { status: 400 }
        );
      }

      const stored = otpStore.get(cleanEmail);
      if (!stored) {
        return NextResponse.json(
          { success: false, message: 'OTP की समय सीमा समाप्त हो गई है। कृपया पुनः अनुरोध करें।' },
          { status: 400 }
        );
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanEmail);
        return NextResponse.json(
          { success: false, message: 'OTP एक्सपायर हो गया है। नया कोड प्राप्त करें।' },
          { status: 400 }
        );
      }

      if (stored.otp !== otp.trim()) {
        return NextResponse.json(
          { success: false, message: 'अमान्य OTP कोड! कृपया सही 6 अंक दर्ज करें।' },
          { status: 400 }
        );
      }

      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, message: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' },
          { status: 400 }
        );
      }

      const updated = await updateAdminPassword(cleanEmail, newPassword.trim());
      if (updated) {
        otpStore.delete(cleanEmail);
        return NextResponse.json({
          success: true,
          message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब नए पासवर्ड से लॉगिन करें।',
        });
      } else {
        return NextResponse.json(
          { success: false, message: 'पासवर्ड अपडेट करने में त्रुटि।' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: false, message: 'अमान्य एक्शन।' }, { status: 400 });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'सर्वर त्रुटि।' },
      { status: 500 }
    );
  }
}
