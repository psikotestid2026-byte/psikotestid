import { describe, it, expect } from 'vitest';
import { buildStoredZip, readStoredZip } from '@/lib/zipStore';

describe('stored zip', () => {
  it('round-trips PDF bytes and unicode names', () => {
    const first = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2, 3]);
    const second = new TextEncoder().encode('laporan-peserta');
    const zip = buildStoredZip(
      [
        { name: '../Laporan Budi.pdf', data: first },
        { name: 'Sesi/Ñandú.pdf', data: second },
      ],
      new Date('2026-10-16T00:00:00Z')
    );

    const entries = readStoredZip(zip);
    expect(entries.map((entry) => entry.name)).toEqual(['Laporan Budi.pdf', 'Sesi_Ñandú.pdf']);
    expect(Array.from(entries[0].data)).toEqual(Array.from(first));
    expect(new TextDecoder().decode(entries[1].data)).toBe('laporan-peserta');
  });

  it('rejects a truncated archive', () => {
    expect(() => readStoredZip(new Uint8Array([1, 2, 3, 4]))).toThrow(/ZIP/);
  });
});
