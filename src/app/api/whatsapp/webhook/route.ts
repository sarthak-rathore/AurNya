import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { setSubscriptionByPhone } from '@/db/whatsapp';
import { safeEqual } from '@/lib/admin-auth-core';
import { defaultCountryCode } from '@/lib/whatsapp-config';
import { normalizePhone } from '@/lib/whatsapp-phone';

/*
 * Incoming WhatsApp messages. Its only job: honour "STOP" (unsubscribe) and "START" (subscribe again).
 *   Meta:   Webhook URL  https://YOUR-SITE/api/whatsapp/webhook   Verify token = WHATSAPP_VERIFY_TOKEN   (optional signature check: WHATSAPP_APP_SECRET)
 *   Twilio: "When a message comes in" URL = the same address
 */
const STOP = /^(stop|unsubscribe|cancel|end|quit|opt\s*out)\b/i;
const START = /^(start|subscribe|unstop|yes)\b/i;
const noStore = { 'Cache-Control': 'no-store' };

/** Meta's one-time check when you save the webhook address. */
export function GET(req: Request) {
  const u = new URL(req.url); const token = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (token && u.searchParams.get('hub.mode') === 'subscribe' && safeEqual(u.searchParams.get('hub.verify_token') ?? '', token)) {
    return new NextResponse(u.searchParams.get('hub.challenge') ?? '', { status: 200, headers: noStore });
  }
  return new NextResponse('Forbidden', { status: 403, headers: noStore });
}

async function apply(from: string, text: string): Promise<void> {
  const phone = normalizePhone(from.replace(/^whatsapp:/i, ''), defaultCountryCode()); if (!phone) return;
  const t = text.trim();
  if (STOP.test(t)) await setSubscriptionByPhone(getDb(), phone, false);
  else if (START.test(t)) await setSubscriptionByPhone(getDb(), phone, true);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const type = req.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/x-www-form-urlencoded')) {           // Twilio
      const token = process.env.TWILIO_AUTH_TOKEN?.trim();
      if (token) {
        const params = new URLSearchParams(raw); const url = process.env.TWILIO_WEBHOOK_URL?.trim() || req.url;
        const data = url + [...params.keys()].sort().map((k) => k + params.get(k)).join('');
        const expected = createHmac('sha1', token).update(data).digest('base64');
        if (!safeEqual(req.headers.get('x-twilio-signature') ?? '', expected)) return new NextResponse('Forbidden', { status: 403, headers: noStore });
      }
      const p = new URLSearchParams(raw); await apply(p.get('From') ?? '', p.get('Body') ?? '');
    } else {                                                             // Meta
      const secret = process.env.WHATSAPP_APP_SECRET?.trim();
      if (secret) {
        const expected = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
        if (!safeEqual(req.headers.get('x-hub-signature-256') ?? '', expected)) return new NextResponse('Forbidden', { status: 403, headers: noStore });
      }
      const j = JSON.parse(raw) as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from?: string; text?: { body?: string }; button?: { text?: string } }> } }> }> };
      for (const e of j.entry ?? []) for (const c of e.changes ?? []) for (const m of c.value?.messages ?? []) await apply(m.from ?? '', m.text?.body ?? m.button?.text ?? '');
    }
  } catch (e) { console.error('[whatsapp] webhook', e); }
  return NextResponse.json({ ok: true }, { headers: noStore });    // always 200 so the provider does not keep retrying
}
