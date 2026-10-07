export function getOtpSecret(): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error('OTP_SECRET environment variable is required');
  }
  return secret;
}
