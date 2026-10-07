import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function read(rel: string) {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

describe('Security regressions (source)', () => {
  it('admin data API requires admin auth', () => {
    const src = read('app/api/admin/data/route.ts');
    expect(src).toMatch(/requireAdmin/);
  });

  it('admin orders API requires admin auth on GET and PUT', () => {
    const src = read('app/api/admin/orders/route.ts');
    expect(src).toMatch(/requireAdmin/);
    expect((src.match(/requireAdmin/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it('client data API does not fall back to hardcoded customer id', () => {
    const src = read('app/api/client/data/route.ts');
    expect(src).not.toMatch(/:\s*2\b/);
    expect(src).toMatch(/requireCustomer/);
  });

  it('test submit API requires session', () => {
    const src = read('app/api/test/submit/route.ts');
    expect(src).toMatch(/requireSession/);
    expect(src).toMatch(/Forbidden/);
  });

  it('OTP routes do not use hardcoded fallback secret', () => {
    for (const f of [
      'app/api/auth/register-hr/send-otp/route.ts',
      'app/api/auth/register-hr/verify-otp/route.ts',
      'app/api/auth/register-hr/complete/route.ts',
    ]) {
      const src = read(f);
      expect(src).not.toMatch(/psikotest_stateless_secret_fallback_key/);
      expect(src).toMatch(/getOtpSecret/);
    }
  });

  it('PDF participant route checks access', () => {
    const src = read('app/api/reports/participant/[participantId]/pdf/route.tsx');
    expect(src).toMatch(/requireParticipantAccess/);
  });
});
