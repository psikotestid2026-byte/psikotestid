import {
  bundledDiscReportDictionary,
  mergeDiscDictionary,
  type DiscReportDictionary,
} from '@/lib/scoring/discReportDictionary';

/**
 * Load the DISC report dictionary once while a participant PDF is assembled.
 * Empty tables and connection failures fall back to the bundled copy so the PDF still renders.
 * disc_subtraits and disc_graph_meanings are not read.
 */
export async function loadDiscReportDictionary(): Promise<DiscReportDictionary> {
  const fallback = bundledDiscReportDictionary();
  try {
    const { sql } = await import('@/lib/neon');
    const patterns = await sql`
      SELECT code, name, description, jobs, characteristics, cautions, motivators
      FROM disc_patterns
      WHERE is_active = TRUE
    `;
    const traits = await sql`
      SELECT dim, heading, potret_diri, kelebihan, kekurangan, kecenderungan, lingkungan_cocok, saran_perbaikan
      FROM disc_dimension_traits
    `;
    const statuses = await sql`
      SELECT status, graph_key, arti, context
      FROM disc_special_statuses
    `;
    return mergeDiscDictionary(fallback, {
      patterns: (
        patterns as {
          code: string;
          name: string;
          description: string;
          jobs: unknown;
          characteristics: unknown;
          cautions: unknown;
          motivators: string | null;
        }[]
      ).map((row) => ({
        code: row.code,
        name: row.name,
        description: row.description,
        jobs: row.jobs,
        characteristics: row.characteristics,
        cautions: row.cautions,
        motivators: row.motivators,
      })),
      traits: (
        traits as {
          dim: string;
          heading: string;
          potret_diri: unknown;
          kelebihan: unknown;
          kekurangan: unknown;
          kecenderungan: unknown;
          lingkungan_cocok: unknown;
          saran_perbaikan: unknown;
        }[]
      ).map((row) => ({
        dim: row.dim,
        heading: row.heading,
        potretDiri: row.potret_diri,
        kelebihan: row.kelebihan,
        kekurangan: row.kekurangan,
        kecenderungan: row.kecenderungan,
        lingkunganCocok: row.lingkungan_cocok,
        saranPerbaikan: row.saran_perbaikan,
      })),
      statuses: (statuses as { status: string; graph_key: string; arti: string; context: string }[]).map((row) => ({
        status: row.status,
        graphKey: row.graph_key,
        arti: row.arti,
        context: row.context,
      })),
    });
  } catch (error) {
    console.error('Kamus DISC tidak terbaca, laporan memakai salinan bawaan.', error);
    return fallback;
  }
}
