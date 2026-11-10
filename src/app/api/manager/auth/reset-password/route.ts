import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtp, isDemoMode } from '@/lib/otp-store';
import { readRoleConfig, signRoleToken } from '@/lib/role-auth-core';
import { ROLE_COOKIE, roleCookieOptions } from '@/lib/role-auth';

const schema = z.object({ email: z.string().email(), otp: z.string().length(6) });
const noStore = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: noStore });
  }

  const demo = isDemoMode();
  // For manager, OTP can be skipped in demo mode
  const otpValid = demo
    ? body.otp === '000000' || verifyOtp(body.email, 'manager', body.otp)
    : verifyOtp(body.email, 'manager', body.otp);
  if (!otpValid) return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401, headers: noStore });

  const cfg = readRoleConfig('manager');
  if (!cfg.ok) return NextResponse.json({ error: cfg.reason }, { status: 503, headers: noStore });

  // OTP verifies identity — set session cookie directly
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(ROLE_COOKIE.manager, signRoleToken(cfg.config), roleCookieOptions());
  return res;
}
