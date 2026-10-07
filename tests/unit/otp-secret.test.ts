import { describe, it, expect, afterEach } from 'vitest';
import { getOtpSecret } from '@/lib/otpSecret';

describe('getOtpSecret', () => {
  const original = process.env.OTP_SECRET;

  afterEach(() => {
    if (original === undefined) delete process.env.OTP_SECRET;
    else process.env.OTP_SECRET = original;
  });

  it('throws when OTP_SECRET is missing', () => {
    delete process.env.OTP_SECRET;
    expect(() => getOtpSecret()).toThrow(/OTP_SECRET/);
  });

  it('returns configured secret', () => {
    process.env.OTP_SECRET = 'unit-test-secret';
    expect(getOtpSecret()).toBe('unit-test-secret');
  });
});
