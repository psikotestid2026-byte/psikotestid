import {
  bundledDiscReportDictionary,
  mergeDiscDictionary,
  type DiscReportDictionary,
} from '@/lib/scoring/discReportDictionary';

/**
 * Load the DISC report dictionary once while a participant PDF is assembled.
 * Empty tables and connection failures fall back to the bundled copy so the PDF still renders.
 */
export async function loadDiscReportDictionary(): Promise<DiscReportDictionary> {
  const fallback = bundledDiscReportDictionary();
  try {
    const { sql } = await import('@/lib/neon');
    const patterns = await sql`
      SELECT code, name, description, jobs
      FROM disc_patterns
      WHERE is_active = TRUE
    `;
    const subTraits = await sql`
      SELECT pair_key, label_id, pair_label, narrative
      FROM disc_subtraits
    `;
    const graphMeanings = await sql`
      SELECT graph_key, title, meaning
      FROM disc_graph_meanings
    `;
    return mergeDiscDictionary(fallback, {
      patterns: (patterns as { code: string; name: string; description: string; jobs: unknown }[]).map((row) => ({
        code: row.code,
        name: row.name,
        description: row.description,
        jobs: row.jobs,
      })),
      subTraits: (subTraits as { pair_key: string; label_id: string; pair_label: string; narrative: string }[]).map(
        (row) => ({
          pairKey: row.pair_key,
          labelId: row.label_id,
          pairLabel: row.pair_label,
          narrative: row.narrative,
        })
      ),
      graphMeanings: (graphMeanings as { graph_key: string; title: string; meaning: string }[]).map((row) => ({
        graphKey: row.graph_key,
        title: row.title,
        meaning: row.meaning,
      })),
    });
  } catch (error) {
    console.error('Kamus DISC tidak terbaca, laporan memakai salinan bawaan.', error);
    return fallback;
  }
}
