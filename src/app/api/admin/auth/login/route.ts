import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_COOKIE, adminCookieOptions, jsonError } from '@/lib/admin-auth';
import { checkCredentials, isSameSiteRequest, readAdminConfig, signAdminToken } from '@/lib/admin-auth-core';
import { clientKey, rateLimit } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().max(254), password: z.string().max(200) });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  if (!isSameSiteRequest(req.headers)) return jsonError(403, 'Request blocked: it did not come from this site.');
  const cfg = readAdminConfig(); if (!cfg.ok) return jsonError(503, cfg.reason);
  // Slows down password guessing. (Counters live in one server's memory, so on serverless hosting this is a speed bump, not a wall: use a long password.)
  const ip = rateLimit(`admin-login:${clientKey(req)}`, 8, 15 * 60_000); const all = rateLimit('admin-login:all', 60, 60 * 60_000);
  if (!ip.ok || !all.ok) return NextResponse.json({ error: 'Too many sign-in attempts. Please wait a few minutes.' }, { status: 429, headers: { 'Retry-After': String(Math.max(ip.retryAfterSec, all.retryAfterSec)), 'Cache-Control': 'no-store' } });
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); } catch { return jsonError(400, 'Please enter your email and password.'); }
  if (!checkCredentials(cfg.config, body.email, body.password)) { await wait(500); return jsonError(401, 'That email or password is not right.'); }
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(ADMIN_COOKIE, signAdminToken(cfg.config), adminCookieOptions());
  return res;
}
