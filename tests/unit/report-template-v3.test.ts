import { describe, expect, it } from 'vitest';
import { calculateBigFiveScore } from '@/lib/scoring/bigfive';
import {
  buildClosingContent,
  bigFiveBars,
  CATATAN_KETERBATASAN,
  coverFields,
  DISC_AXIS_MAX,
  DISC_AXIS_MIN,
  discSectionModel,
  formatDecimal,
  formatIdDateTime,
  formatPercent,
  formatReportDate,
  reportValidationLine,
  hasilUtama,
  msdtSectionModel,
  orderCoverResults,
  orderDetailResults,
  papiSectionModel,
  papiZone,
  sessionStatusLabel,
  wptGaugeAngle,
  wptSectionModel,
  WPT_NORM_MAX,
  WPT_NORM_MIN,
} from '@/lib/reportTemplateV3';

describe('report number formatting', () => {
  it('drops the decimal on integers and keeps one comma decimal otherwise', () => {
    expect(formatDecimal(57.5)).toBe('57,5');
    expect(formatDecimal(57.54)).toBe('57,5');
    expect(formatDecimal(57.55)).toBe('57,6');
    expect(formatDecimal(120)).toBe('120');
    expect(formatDecimal(7)).toBe('7');
    expect(formatDecimal(-8)).toBe('-8');
    expect(formatDecimal(-8.2)).toBe('-8,2');
    expect(formatDecimal('33.33')).toBe('33,3');
    expect(formatDecimal(null)).toBe('-');
    expect(formatDecimal('')).toBe('-');
    expect(formatDecimal('abc')).toBe('-');
  });

  it('renders percentages without a space', () => {
    expect(formatPercent(57.5)).toBe('57,5%');
    expect(formatPercent(33.333)).toBe('33,3%');
    expect(formatPercent(100)).toBe('100%');
    expect(formatPercent(50)).toBe('50%');
    expect(formatPercent(undefined)).toBe('-');
  });

  it('formats the validation date and prefixes a stored city', () => {
    expect(formatReportDate('2026-10-19T02:00:00.000Z')).toBe('19 Oktober 2026');
    expect(formatReportDate(null)).toBe('-');
    expect(reportValidationLine({ city: 'Bandung', completed_at: '2026-10-19T02:00:00.000Z' })).toBe(
      'Bandung, 19 Oktober 2026'
    );
    expect(reportValidationLine({ completed_at: '2026-10-16T01:42:00.000Z' })).toBe('16 Oktober 2026');
    expect(reportValidationLine({}, new Date('2026-10-19T02:00:00.000Z'))).toBe('19 Oktober 2026');
  });

  it('formats Jakarta session times', () => {
    expect(formatIdDateTime('2026-10-16T01:00:00.000Z')).toBe('Jumat, 16 Oktober 2026 - 08:00 WIB');
    expect(formatIdDateTime(null)).toBe('-');
    expect(formatIdDateTime('bukan-tanggal')).toBe('-');
  });

  it('maps session status into Indonesian labels', () => {
    expect(sessionStatusLabel('COMPLETED')).toBe('Selesai');
    expect(sessionStatusLabel('RUNNING')).toBe('Berjalan');
    expect(sessionStatusLabel('')).toBe('-');
  });
});

describe('report v3 view model', () => {
  it('keeps the platform DISC axis instead of -18..18', () => {
    expect(DISC_AXIS_MIN).toBe(-16);
    expect(DISC_AXIS_MAX).toBe(18);
  });

  it('builds DISC cards from stored graph values and the 40-pattern dictionary', () => {
    const model = discSectionModel(
      {
        subTraits: { g1: 'Patience', g2: 'Accuracy', g3: 'Cooperativeness' },
        g1: { D: 1, I: 5, S: -1, C: -6 },
        g2: { D: 1, I: 7, S: -2, C: 2 },
        g3: { D: -0.5, I: 1, S: -4, C: -4 },
      },
      { participantName: 'Selasmawati' }
    );

    expect(model.graphs.map((graph) => graph.code)).toEqual(['ID', 'ICD', 'I MURNI']);
    expect(model.graphs.map((graph) => graph.patternName)).toEqual(['NEGOTIATOR', 'ASSESSOR', 'COMMUNICATOR']);
    expect(model.graphs[0].values).toEqual({ D: 1, I: 5, S: -1, C: -6 });
    expect(model.graphs[0].subTraitLabel).toBe('Kepercayaan Diri (I/C)');
    expect(model.blocks).toHaveLength(3);
    expect(model.blocks[0].header).toBe('DESKRIPSI PERILAKU ADAPTASI — GRAPH 1 (MOST) (NEGOTIATOR)');
    expect(model.blocks[0].description).toContain('Selasmawati pemimpin integratif');
    expect(model.blocks[0].jobs).toEqual([
      'PENGAJARAN',
      'PELATIHAN',
      'PENEMU',
      'PENJUALAN KHUSUS',
      'KEUANGAN',
      'HUBUNGAN MASYARAKAT',
    ]);
    expect(JSON.stringify(model)).not.toMatch(/potret diri|kelebihan|kekurangan/i);
  });

  it('formats Big Five bars from platform percent, category, and narrative', () => {
    const scoring = calculateBigFiveScore({
      0: '4',
      1: '2',
      2: '5',
      3: '2',
      4: '4',
    });
    const bars = bigFiveBars(scoring.dimensions);
    expect(bars.map((bar) => bar.code)).toEqual(['E', 'A', 'C', 'N', 'O']);
    expect(bars[0].percentText).toMatch(/^\d+(,\d)?%$/);
    expect(bars[0].category).toBe(scoring.dimensions.E.category);
    expect(bars[0].narrative).toBe(scoring.dimensions.E.narrative);
    expect(bars.some((bar) => 'raw' in bar)).toBe(false);
  });

  it('lays out PAPI by Indonesian category with score/9 bars and drops the 90 total', () => {
    const model = papiSectionModel({
      scores: { N: 7, G: 5, A: 3, L: 8, P: 4, I: 1, T: 3, V: 6, X: 7, S: 5, B: 1, O: 6, R: 3, D: 5, C: 5, Z: 4, E: 4, K: 6, F: 4, W: 3 },
      totalScore: 90,
    });
    expect(model.groups.map((group) => group.category)).toEqual([
      'Arah Kerja',
      'Kepemimpinan',
      'Aktivitas Kerja',
      'Sifat Sosial',
      'Gaya Kerja',
      'Temperamen',
      'Kepatuhan',
    ]);
    const leadership = model.groups[1].rows[0];
    expect(leadership.name).toBe('Peran Kepemimpinan');
    expect(leadership.scoreText).toBe('8');
    expect(leadership.fraction).toBeCloseTo(8 / 9);
    expect(papiZone(3)).toBe('Rendah');
    expect(papiZone(4)).toBe('Sedang');
    expect(papiZone(7)).toBe('Tinggi');
    expect(papiZone(0)).toBe('Rendah');
    expect(model.narrative).toContain('Peran Kepemimpinan (L): Cenderung dominan');
    expect(model.narrative).toContain('Tipe Enerjik (V): Memiliki energi fisik yang besar');
    expect(model.narrative).toContain('Ambisi Pencapaian Target (A): Kurang terdorong');
    expect(model.narrative).not.toContain('Peran Pekerja Keras');
    expect(model.narrative).not.toContain('Pengendalian Orang Lain');
    expect(model.narrative).not.toContain('Kecenderungan bekerja keras');
    expect(model.narrative).not.toContain('90');
    expect(model.ringkasan).not.toMatch(/90/);
  });

  it('places the WPT needle from the norm score and never labels it IQ', () => {
    expect(WPT_NORM_MIN).toBe(59);
    expect(WPT_NORM_MAX).toBe(146);
    expect(wptGaugeAngle(59)).toBeCloseTo(-90);
    expect(wptGaugeAngle(146)).toBeCloseTo(90);
    expect(wptGaugeAngle(120)).toBeCloseTo(((120 - 59) / (146 - 59)) * 180 - 90);
    expect(wptGaugeAngle(null)).toBeNull();
    expect(wptGaugeAngle(20)).toBeCloseTo(-90);
    expect(wptGaugeAngle(200)).toBeCloseTo(90);

    const model = wptSectionModel({ score: '120', raw_score: 30, iq: 120, label: 'Superior', description: 'Kapasitas analitis sangat baik.' });
    expect(model.scoreText).toBe('120');
    expect(model.narrative).toBe('Kapasitas analitis sangat baik.');
    expect(JSON.stringify(model)).not.toMatch(/IQ|Superior|30/);
    expect(hasilUtama('wpt', { score: '120', iq: 120 })).toBe('Skor Kognitif: 120');
    expect(hasilUtama('msdt', { dominantType: 'Ds', dominantLabel: 'Ds - Deserter' })).toBe('Ds - Deserter');
    expect(hasilUtama('papi', { dominantLabel: 'L - Leadership Role', dominantType: 'Leadership Role' })).toBe(
      'L - Leadership Role'
    );
  });

  it('keeps MSDT to the dominant style and its interpretation', () => {
    const model = msdtSectionModel({ dominantType: 'Ds', dominantLabel: 'Ds - Deserter' });
    expect(model.code).toBe('Ds');
    expect(model.name).toBe('Deserter');
    expect(model.narrative).toMatch(/laisser-faire/);
    expect(model).not.toHaveProperty('kekuatan');
    expect(model).not.toHaveProperty('scores');
  });

  it('orders the five v3 tests before legacy sections and keeps skipped tests on the cover', () => {
    const rows = [
      { test_code: 'mbti' },
      { test_code: 'wpt' },
      { test_code: 'ist' },
      { test_code: 'disc' },
      { test_code: 'papi' },
    ];
    expect(orderDetailResults(rows.filter((row) => row.test_code !== 'ist')).map((row) => row.test_code)).toEqual([
      'disc',
      'papi',
      'wpt',
      'mbti',
    ]);
    expect(orderCoverResults(rows).map((row) => row.test_code)).toEqual(['disc', 'papi', 'wpt', 'mbti', 'ist']);
  });

  it('builds the closing from platform text, otherwise from summaries, and omits a missing recommendation', () => {
    const fromSummaries = buildClosingContent({}, [{ title: 'DISC', summary: 'SC (PEACEMAKER)' }]);
    expect(fromSummaries.executive).toBe('DISC: SC (PEACEMAKER)');
    expect(fromSummaries.recommendation).toBeNull();

    const fromPlatform = buildClosingContent(
      { ringkasan_eksekutif: 'Narasi platform.', rekomendasi: 'Rekomendasi platform.' },
      [{ title: 'DISC', summary: 'SC (PEACEMAKER)' }]
    );
    expect(fromPlatform.executive).toBe('Narasi platform.');
    expect(fromPlatform.recommendation).toBe('Rekomendasi platform.');
    expect(CATATAN_KETERBATASAN).toMatch(/satu-satunya dasar keputusan/);
  });

  it('reads cover fields that exist and leaves missing ones blank', () => {
    const fields = Object.fromEntries(
      coverFields({
        full_name: 'Sari Wulandari',
        email: 'sari@example.com',
        phone_number: '081234567890',
        company_name: 'PT Contoh',
        campaign_title: 'Rekrutmen',
        status: 'COMPLETED',
        started_at: '2026-10-16T01:00:00.000Z',
        completed_at: '2026-10-16T01:42:00.000Z',
      }).map((field) => [field.label, field.value])
    );
    expect(fields['Nama kandidat']).toBe('Sari Wulandari');
    expect(fields['No. telepon']).toBe('081234567890');
    expect(fields['Posisi (level posisi)']).toBe('-');
    expect(fields['Kurikulum']).toBe('-');
    expect(fields.Status).toBe('Selesai');
    expect(fields['Mulai ujian']).toContain('08:00 WIB');
  });
});
