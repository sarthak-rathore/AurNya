import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Admin sign-in, kept apart from the customer accounts on purpose:
//  - the owner's email and password live in environment variables (ADMIN_EMAIL, ADMIN_PASSWORD), so nobody can become an admin by registering an account;
//  - the admin session is its own cookie with its own signature, so a customer's session can never open the dashboard;
//  - changing ADMIN_PASSWORD signs every admin out.
// This file is pure (no Next.js), so it is easy to test.

export const ADMIN_COOKIE = 'aur_admin';
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;
export const MIN_ADMIN_PASSWORD = 10;
const DEV_SECRET = 'aurnya-dev-only-admin-secret-do-not-use-in-production';

export interface AdminConfig { email: string; password: string; secret: string }
export type AdminConfigResult = { ok: true; config: AdminConfig } | { ok: false; reason: string };
type Env = Record<string, string | undefined>;

/** Reads and checks the admin settings. When something is missing, `reason` is a plain-English instruction for the owner. */
export function readAdminConfig(env: Env = process.env): AdminConfigResult {
  const email = (env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = env.ADMIN_PASSWORD ?? '';
  if (!email || !password) return { ok: false, reason: 'Admin sign-in is not set up yet. Add ADMIN_EMAIL and ADMIN_PASSWORD to your environment variables, then redeploy.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: 'ADMIN_EMAIL is not a valid email address.' };
  if (password.length < MIN_ADMIN_PASSWORD) return { ok: false, reason: `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD} characters long.` };
  const secret = (env.ADMIN_SESSION_SECRET || env.JWT_SECRET || '').trim();
  if (env.NODE_ENV === 'production') {
    if (secret.length < 16) return { ok: false, reason: 'Set JWT_SECRET (or ADMIN_SESSION_SECRET) to a long random text of at least 16 characters, then redeploy.' };
    return { ok: true, config: { email, password, secret } };
  }
  return { ok: true, config: { email, password, secret: secret.length >= 16 ? secret : DEV_SECRET } };
}

const sha = (s: string) => createHash('sha256').update(s).digest();
/** Compares two texts without leaking, through timing, how much of them matched. */
export const safeEqual = (a: string, b: string): boolean => timingSafeEqual(sha(a), sha(b));

/** True only when BOTH the email and the password match. Both comparisons always run. */
export function checkCredentials(config: AdminConfig, email: string, password: string): boolean {
  const e = safeEqual(email.trim().toLowerCase(), config.email); const p = safeEqual(password, config.password);
  return e && p;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const key = (c: AdminConfig) => createHmac('sha256', c.secret).update('aurnya-admin-session-v1').digest();
/** Changes whenever the password changes, which makes every older session invalid. */
const fingerprint = (c: AdminConfig) => createHash('sha256').update(`${c.secret}|${c.password}`).digest('hex').slice(0, 16);

export function signAdminToken(c: AdminConfig, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const body = b64(JSON.stringify({ aud: 'aurnya-admin', email: c.email, pv: fingerprint(c), iat, exp: iat + ADMIN_SESSION_SECONDS }));
  return `${body}.${b64(createHmac('sha256', key(c)).update(body).digest())}`;
}

export function verifyAdminToken(c: AdminConfig, token: string | undefined | null, now = Date.now()): { email: string } | null {
  try {
    if (!token) return null;
    const parts = token.split('.'); if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = b64(createHmac('sha256', key(c)).update(body).digest());
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { aud?: unknown; email?: unknown; pv?: unknown; exp?: unknown };
    if (p.aud !== 'aurnya-admin' || p.email !== c.email || p.pv !== fingerprint(c)) return null;
    if (typeof p.exp !== 'number' || p.exp < Math.floor(now / 1000)) return null;
    return { email: c.email };
  } catch { return null; }
}

/**
 * Browsers always say where a request came from. A state-changing request must come from this same site.
 * (Requests with neither header, such as curl, cannot be a browser tricked by another site, and still need the admin cookie.)
 */
export function isSameSiteRequest(headers: { get(name: string): string | null }): boolean {
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  const origin = headers.get('origin');
  if (origin) { try { return !!host && new URL(origin).host === host; } catch { return false; } }
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none';
  return true;
}
