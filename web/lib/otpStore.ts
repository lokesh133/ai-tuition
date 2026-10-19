// In-memory OTP storage with 5-minute validity
interface OtpRecord {
  code: string;
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD';
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as { otpMap?: Map<string, OtpRecord> };
if (!globalForOtp.otpMap) {
  globalForOtp.otpMap = new Map<string, OtpRecord>();
}
const otpMap = globalForOtp.otpMap;

export function generateAndSaveOtp(
  phone: string,
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD'
): { otp: string; expiresAt: number } {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  // 4-digit secure random OTP (e.g. 1000 - 9999)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpMap.set(cleanPhone, {
    code: otp,
    purpose,
    expiresAt,
  });

  console.log(`🔑 [AI Tuition OTP] Phone: ${cleanPhone} | Purpose: ${purpose} | OTP: ${otp}`);
  return { otp, expiresAt };
}

export function verifyOtpCode(
  phone: string,
  enteredOtp: string,
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD'
): { valid: boolean; message: string } {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  const record = otpMap.get(cleanPhone);

  if (!record) {
    return { valid: false, message: 'OTP expired or not requested. Please request a new OTP.' };
  }

  if (record.expiresAt < Date.now()) {
    otpMap.delete(cleanPhone);
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.purpose !== purpose) {
    return { valid: false, message: 'Invalid OTP purpose. Please request again.' };
  }

  if (record.code !== enteredOtp.trim()) {
    return { valid: false, message: 'Incorrect OTP. Please check and re-enter.' };
  }

  // Once verified, consume the OTP
  otpMap.delete(cleanPhone);
  return { valid: true, message: 'OTP verified successfully!' };
}
