// A simple "no more than N requests per window per visitor" guard for public API routes.
// HONEST LIMIT: the counters live in the memory of one server instance. On serverless hosting (Vercel) several instances
// may run at once, so this slows down casual abuse but is not a hard guarantee. A shared store (for example Upstash Redis)
// is the upgrade path if it ever matters; the function signature would stay the same.
const hits = new Map<string, number[]>();
let lastSweep = 0;

export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterSec: number } {
  if (now - lastSweep > 60_000) { lastSweep = now; for (const [k, v] of hits) if (!v.some((t) => now - t < 3_600_000)) hits.delete(k); }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) }; }
  recent.push(now); hits.set(key, recent);
  return { ok: true, retryAfterSec: 0 };
}

/** Who is asking. Vercel sets x-forwarded-for itself, so the first address is the real client there. */
export const clientKey = (req: Request): string => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
export const resetRateLimits = () => hits.clear();
