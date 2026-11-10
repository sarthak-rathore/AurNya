import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { getUserLite, isSubscribed, setSubscription } from '@/db/whatsapp';
import { getSessionUser } from '@/lib/auth';
import { defaultCountryCode } from '@/lib/whatsapp-config';
import { normalizePhone } from '@/lib/whatsapp-phone';

const noStore = { 'Cache-Control': 'no-store' };

/** The signed-in customer's WhatsApp setting. */
export async function GET() {
  const s = await getSessionUser(); if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  const u = await getUserLite(getDb(), s.sub); if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStore });
  const hasPhone = !!normalizePhone(u.phone, defaultCountryCode());
  return NextResponse.json({ subscribed: isSubscribed(u), hasPhone }, { headers: noStore });
}

/** Switch WhatsApp updates on or off. */
export async function POST(req: Request) {
  const s = await getSessionUser(); if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStore });
  const p = z.object({ subscribe: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: noStore });
  const db = getDb(); const u = await getUserLite(db, s.sub); if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStore });
  const ok = await setSubscription(db, s.sub, p.data.subscribe, !!normalizePhone(u.phone, defaultCountryCode()));
  if (!ok) return NextResponse.json({ error: 'Add your mobile number first, then switch WhatsApp updates on.' }, { status: 400, headers: noStore });
  return NextResponse.json({ ok: true, subscribed: p.data.subscribe }, { headers: noStore });
}
