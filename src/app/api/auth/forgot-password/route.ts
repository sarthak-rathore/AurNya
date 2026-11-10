import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail } from '@/db/accounts';
import { generateOtp, isDemoMode } from '@/lib/otp-store';
import { rateLimit, clientKey } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().email() });
const noStore = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  const ip = rateLimit(`forgot-pwd:${clientKey(req)}`, 5, 15 * 60_000);
  if (!ip.ok) return NextResponse.json({ error: 'Too many requests. Try again in 15 minutes.' }, { status: 429, headers: noStore });

  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); } catch {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400, headers: noStore });
  }

  const user = await getUserByEmail(body.email);
  // Always return ok to prevent user enumeration
  if (!user) return NextResponse.json({ ok: true, demo: isDemoMode() }, { headers: noStore });

  const code = generateOtp(body.email, 'user');
  const demo = isDemoMode();

  if (!demo) {
    // Send OTP via Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'AurNya <noreply@aurnya.com>',
          to: body.email,
          subject: 'Your AurNya password reset code',
          html: `<p>Your password reset code is: <strong style="font-size:24px;letter-spacing:8px">${code}</strong></p><p>This code expires in 10 minutes.</p><p>If you did not request this, please ignore this email.</p>`,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, demo }, { headers: noStore });
}
