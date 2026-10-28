import { Client, Receiver } from '@upstash/qstash';

/** QStash is only the safety net for scoring; the primary path is the in-process background job. */

function appBaseUrl(): string | null {
  const explicit = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const url = (process.env.VERCEL ? vercel || explicit : explicit || vercel) || null;
  if (!url) return null;
  // QStash cannot reach a local dev server.
  if (/localhost|127\.0\.0\.1/.test(url)) return null;
  return url.replace(/\/$/, '');
}

export function isQstashConfigured(): boolean {
  return Boolean(process.env.QSTASH_TOKEN) && appBaseUrl() !== null;
}

export async function enqueueScoringFallback(participantId: number): Promise<boolean> {
  const base = appBaseUrl();
  if (!process.env.QSTASH_TOKEN || !base) return false;

  const client = new Client({ token: process.env.QSTASH_TOKEN, baseUrl: process.env.QSTASH_URL });
  await client.publishJSON({
    url: `${base}/api/qstash/score-bundle`,
    body: { participant_id: participantId },
    retries: 3,
    delay: 5,
    deduplicationId: `score-${participantId}-${Math.floor(Date.now() / 60_000)}`,
  });
  return true;
}

export async function verifyQstashRequest(req: Request, rawBody: string): Promise<boolean> {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  const signature = req.headers.get('upstash-signature');
  if (!currentSigningKey || !nextSigningKey || !signature) return false;

  const receiver = new Receiver({ currentSigningKey, nextSigningKey });
  try {
    return await receiver.verify({ signature, body: rawBody });
  } catch {
    return false;
  }
}
