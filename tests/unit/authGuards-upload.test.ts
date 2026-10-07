import { describe, it, expect } from 'vitest';
import { validateImageUpload, safeImageExtension } from '@/lib/uploadValidation';

function fakeFile(overrides: Partial<File> & { type: string; size: number; name: string }): File {
  return overrides as unknown as File;
}

describe('validateImageUpload', () => {
  it('accepts png under size limit', () => {
    const file = fakeFile({ name: 'logo.png', type: 'image/png', size: 1024 });
    expect(validateImageUpload(file)).toEqual({ ok: true });
  });

  it('rejects non-image mime', () => {
    const file = fakeFile({ name: 'x.exe', type: 'application/octet-stream', size: 10 });
    const r = validateImageUpload(file);
    expect(r.ok).toBe(false);
  });

  it('rejects oversized files', () => {
    const file = fakeFile({ name: 'big.png', type: 'image/png', size: 5 * 1024 * 1024 });
    const r = validateImageUpload(file);
    expect(r.ok).toBe(false);
  });
});

describe('safeImageExtension', () => {
  it('prefers sanitized filename extension', () => {
    expect(safeImageExtension('logo.PNG', 'image/png')).toBe('png');
  });

  it('falls back to mime map', () => {
    expect(safeImageExtension('logo', 'image/webp')).toBe('webp');
  });
});
