import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ROLE_COOKIE, roleCookieOptions, isSameSiteRequest, readRoleConfig, signRoleToken } from '@/lib/role-auth';
import { checkRoleCredentials } from '@/lib/role-auth-core';
import { rateLimit, clientKey } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().max(254), password: z.string().max(200) });
const noStore = { 'Cache-Control': 'no-store' };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  if (!isSameSiteRequest(req.headers))
    return NextResponse.json({ error: 'Request blocked: it did not come from this site.' }, { status: 403, headers: noStore });
  const cfg = readRoleConfig('manager');
  if (!cfg.ok) return NextResponse.json({ error: cfg.reason }, { status: 503, headers: noStore });
  const ip = rateLimit(`manager-login:${clientKey(req)}`, 8, 15 * 60_000);
  const all = rateLimit('manager-login:all', 60, 60 * 60_000);
  if (!ip.ok || !all.ok)
    return NextResponse.json({ error: 'Too many sign-in attempts. Please wait a few minutes.' }, { status: 429, headers: noStore });
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); } catch {
    return NextResponse.json({ error: 'Please enter your email and password.' }, { status: 400, headers: noStore });
  }
  if (!checkRoleCredentials(cfg.config, body.email, body.password)) {
    await wait(500);
    return NextResponse.json({ error: 'That email or password is not right.' }, { status: 401, headers: noStore });
  }
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(ROLE_COOKIE.manager, signRoleToken(cfg.config), roleCookieOptions());
  return res;
}
