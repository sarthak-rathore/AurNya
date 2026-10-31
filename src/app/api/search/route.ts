import { NextResponse } from 'next/server';
import { catalog } from '@/lib/catalog';
import { clientKey, rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const limit = rateLimit(`search:${clientKey(req)}`, 120, 60_000);
  if (!limit.ok) return NextResponse.json({ items: [] }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } });
  const q = (new URL(req.url).searchParams.get('q') ?? '').slice(0, 60);
  try {
    const items = await catalog.suggest(q);
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (e) {
    console.error('search failed', e);
    return NextResponse.json({ items: [] }, { status: 503 });   // never show visitors database details
  }
}
