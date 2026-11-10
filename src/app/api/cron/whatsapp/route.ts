import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/admin-auth-core';
import { processOutbox } from '@/lib/whatsapp';

export const maxDuration = 60;

// Safety net (see vercel.json): sends any WhatsApp messages still waiting in the outbox (for example if the server stopped mid-way).
// Normally messages are sent right after they are queued. Vercel Cron calls this with "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  if (!safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  return NextResponse.json(await processOutbox(500), { headers: { 'Cache-Control': 'no-store' } });
}
