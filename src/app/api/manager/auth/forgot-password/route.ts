import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readRoleConfig, safeEqual } from '@/lib/role-auth-core';
import { generateOtp, isDemoMode } from '@/lib/otp-store';
import { rateLimit, clientKey } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().email() });
const noStore = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  const ip = rateLimit(`manager-otp:${clientKey(req)}`, 5, 15 * 60_000);
  if (!ip.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: noStore });

  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); } catch {
    return NextResponse.json({ error: 'Invalid email.' }, { status: 400, headers: noStore });
  }

  const cfg = readRoleConfig('manager');
  if (!cfg.ok) return NextResponse.json({ error: cfg.reason }, { status: 503, headers: noStore });

  // Don't reveal if manager email matches, but only send if it does
  const emailMatch = safeEqual(body.email.trim().toLowerCase(), cfg.config.email);
  const demo = isDemoMode();

  if (emailMatch) {
    const code = generateOtp(body.email, 'manager');
    if (!demo) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? 'AurNya <noreply@aurnya.com>',
            to: body.email,
            subject: '[AurNya Manager] Password Reset OTP',
            html: `<p><strong>Manager Portal OTP</strong></p><p>Your one-time code: <strong style="font-size:24px;letter-spacing:8px;font-family:monospace">${code}</strong></p><p>Expires in 10 minutes. Never share this code.</p>`,
          }),
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true, demo }, { headers: noStore });
}
