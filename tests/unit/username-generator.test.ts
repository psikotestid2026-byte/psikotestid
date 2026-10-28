import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildDefaultPassword, generateUsernames, slugifyNamePart } from '@/lib/usernameGenerator';
import { assertSafeSql } from '../../scripts/apply-safe-sql';

describe('generateUsernames', () => {
  it('uses the first name when it is unique', () => {
    expect(generateUsernames(['AZIZ ASMOROKONDI', 'SHANIA AISHADEVI'])).toEqual(['aziz', 'shania']);
  });

  it('uses first.second for every holder of a shared first name', () => {
    expect(generateUsernames(['MUHAMMAD DAUD', 'MUHAMMAD GHAZI ALGIFARI', 'ANDI NUR AINI'])).toEqual([
      'muhammad.daud',
      'muhammad.ghazi',
      'andi',
    ]);
  });

  it('avoids usernames already in the database and adds numeric suffixes as a last resort', () => {
    expect(generateUsernames(['AZIZ BARU'], ['aziz'])).toEqual(['aziz.baru']);
    expect(generateUsernames(['RAHMAWATI', 'RAHMAWATI'])).toEqual(['rahmawati', 'rahmawati1']);
    expect(generateUsernames(['SITI AMINAH', 'SITI AMINAH'], [])).toEqual(['siti.aminah', 'siti.aminah1']);
  });

  it('strips accents and symbols', () => {
    expect(slugifyNamePart("Ñandé-O'Neil")).toBe('nandeoneil');
  });

  it('builds an easy to remember default password', () => {
    expect(buildDefaultPassword('AZIZ ASMOROKONDI', 2026)).toBe('Aziz2026');
    expect(buildDefaultPassword('', 2026)).toBe('Peserta2026');
  });
});

describe('seeded DT Peduli employees', () => {
  const employees = JSON.parse(
    readFileSync(resolve(process.cwd(), 'db/seeds/dt_peduli_employees.json'), 'utf8')
  ) as Array<{ username: string; password: string; email: string; name: string }>;

  it('has unique usernames, unique emails and the expected password format', () => {
    expect(new Set(employees.map((e) => e.username)).size).toBe(employees.length);
    expect(new Set(employees.map((e) => e.email)).size).toBe(employees.length);
    for (const e of employees) {
      expect(e.password).toMatch(/^[A-Z][a-z0-9]*2026$/);
      expect(e.username).toMatch(/^[a-z0-9.]+$/);
    }
  });

  it('matches what the shared generator would produce for the same names', () => {
    const regenerated = generateUsernames(employees.map((e) => e.name));
    expect(regenerated).toEqual(employees.map((e) => e.username));
  });
});

describe('assertSafeSql', () => {
  it('allows additive statements and ignores comments', () => {
    expect(() =>
      assertSafeSql('-- never DROP anything\nALTER TABLE a ADD COLUMN IF NOT EXISTS b INT; /* DELETE */')
    ).not.toThrow();
  });

  it.each(['DROP TABLE x;', 'delete from x;', 'TRUNCATE x;', 'ALTER TABLE x DROP COLUMN y;'])('refuses %s', (stmt) => {
    expect(() => assertSafeSql(stmt)).toThrow(/Unsafe SQL/);
  });

  it('keeps the shipped migration safe', () => {
    const migration = readFileSync(resolve(process.cwd(), 'db/migrations/0017_dt_peduli_assessment.sql'), 'utf8');
    expect(() => assertSafeSql(migration)).not.toThrow();
  });
});
