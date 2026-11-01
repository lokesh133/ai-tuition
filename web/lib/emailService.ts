import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * AI Tuition Email OTP Dispatcher
 * Sends real OTP verification emails to students and parents.
 */

export async function sendOtpEmail(toEmail: string, otpCode: string, studentName?: string): Promise<{ success: boolean; message: string }> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  let user = process.env.SMTP_USER || process.env.GMAIL_USER;
  let pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  // Hot fallback: read directly from .env.local if dev server wasn't restarted
  if (!user || !pass) {
    try {
      const candidates = [
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), 'web', '.env.local'),
        'f:\\ai-tuition\\web\\.env.local',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          const userMatch = raw.match(/GMAIL_USER=["']?([^"'\r\n]+)/);
          const passMatch = raw.match(/GMAIL_APP_PASSWORD=["']?([^"'\r\n]+)/);
          if (userMatch && userMatch[1]) user = userMatch[1].trim();
          if (passMatch && passMatch[1]) pass = passMatch[1].trim();
          if (user && pass) break;
        }
      }
    } catch (e) {
      console.warn('Fallback .env.local reader note:', e);
    }
  }

  console.log(`📧 [AI Tuition Email OTP] To: ${toEmail} | Code: ${otpCode} | Sender: ${user || 'NOT_SET'}`);

  if (!user || !pass) {
    console.warn('⚠️ SMTP_USER / GMAIL_USER or SMTP_PASS not set in .env.local. Email logged to console.');
    return {
      success: true,
      message: `OTP generated for ${toEmail}. Set GMAIL_USER & GMAIL_APP_PASSWORD in .env.local for live inbox delivery.`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const displayName = studentName || 'विद्यार्थी';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #d97706 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">⚡ Vidya AI Tuition</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">सुरक्षित छात्र लॉगिन और सत्यापन कोड</p>
        </div>
        <div style="padding: 28px 24px; text-align: center;">
          <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0;">
            नमस्ते <strong>${displayName}</strong>!
          </p>
          <p style="font-size: 14px; color: #64748b; margin: 0 0 24px 0;">
            आपकी AI ट्यूशन क्लास में लॉगिन करने के लिए आपका एक बार का सत्यापन कोड (OTP) नीचे दिया गया है:
          </p>
          <div style="display: inline-block; background: #f8fafc; border: 2px dashed #4f46e5; border-radius: 12px; padding: 14px 32px; margin: 0 auto 24px auto;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            यह कोड अगले <strong>5 मिनट</strong> तक मान्य है। कृपया इसे किसी के साथ साझा न करें।
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 14px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          © 2026 Vidya AI Tuition • Class 1st to 8th Learning Studio
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Vidya AI Tuition" <${user}>`,
      to: toEmail,
      subject: `[${otpCode}] आपका AI Tuition लॉगिन OTP कोड`,
      html: htmlContent,
    });

    console.log(`✅ Real Email dispatched to ${toEmail}`);
    return { success: true, message: `OTP successfully sent to ${toEmail}` };
  } catch (error: any) {
    console.error('Email dispatch error:', error);
    return {
      success: false,
      message: error.message || 'Failed to dispatch email. Please check SMTP settings.',
    };
  }
}
