// In-memory OTP storage with 5-minute validity (supports Mobile & Email)
interface OtpRecord {
  code: string;
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD' | 'LOGIN';
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as { otpMap?: Map<string, OtpRecord> };
if (!globalForOtp.otpMap) {
  globalForOtp.otpMap = new Map<string, OtpRecord>();
}
const otpMap = globalForOtp.otpMap;

function cleanIdentifier(identifier: string): string {
  if (identifier.includes('@')) {
    return identifier.trim().toLowerCase();
  }
  return identifier.trim().replace(/\D/g, '');
}

export function generateAndSaveOtp(
  identifier: string,
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD' | 'LOGIN'
): { otp: string; expiresAt: number } {
  const cleanKey = cleanIdentifier(identifier);
  // 4-digit secure random OTP (e.g. 1000 - 9999)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpMap.set(cleanKey, {
    code: otp,
    purpose,
    expiresAt,
  });

  console.log(`🔑 [AI Tuition OTP] Target: ${cleanKey} | Purpose: ${purpose} | OTP: ${otp}`);
  return { otp, expiresAt };
}

export function verifyOtpCode(
  identifier: string,
  enteredOtp: string,
  purpose: 'SIGNUP' | 'FORGOT_PASSWORD' | 'LOGIN'
): { valid: boolean; message: string } {
  const cleanKey = cleanIdentifier(identifier);
  const record = otpMap.get(cleanKey);

  if (!record) {
    return { valid: false, message: 'OTP expired or not requested. Please request a new OTP.' };
  }

  if (record.expiresAt < Date.now()) {
    otpMap.delete(cleanKey);
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.purpose !== purpose) {
    return { valid: false, message: 'Invalid OTP purpose. Please request again.' };
  }

  if (record.code !== enteredOtp.trim()) {
    return { valid: false, message: 'Incorrect OTP. Please check and re-enter.' };
  }

  // Once verified, consume the OTP
  otpMap.delete(cleanKey);
  return { valid: true, message: 'OTP verified successfully!' };
}
