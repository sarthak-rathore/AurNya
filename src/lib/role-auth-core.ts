import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Role-based auth core (pure — no Next.js imports).
 * Supports three roles: owner | admin | manager
 *
 * Each role reads its own env vars:
 *   OWNER_EMAIL / OWNER_PASSWORD
 *   ADMIN_EMAIL / ADMIN_PASSWORD   (also used by legacy single-admin flow)
 *   MANAGER_EMAIL / MANAGER_PASSWORD
 *
 * Session tokens are signed with ROLE_SESSION_SECRET (falls back to JWT_SECRET in dev).
 */

export type UserRole = 'owner' | 'admin' | 'manager';

export const ROLE_COOKIE: Record<UserRole, string> = {
  owner: 'aur_owner',
  admin: 'aur_admin',
  manager: 'aur_manager',
};

export const ROLE_SESSION_SECONDS = 12 * 60 * 60; // 12 hours
export const MIN_ROLE_PASSWORD = 10;
const DEV_SECRET = 'aurnya-dev-only-role-secret-do-not-use-in-production';

export interface RoleConfig { email: string; password: string; secret: string; role: UserRole }
export type RoleConfigResult = { ok: true; config: RoleConfig } | { ok: false; reason: string };

type Env = Record<string, string | undefined>;

/** Returns the env-var prefix for a role (OWNER_, ADMIN_, MANAGER_). */
function prefix(role: UserRole) {
  return role.toUpperCase();
}

export function readRoleConfig(role: UserRole, env: Env = process.env): RoleConfigResult {
  const p = prefix(role);
  const email = (env[`${p}_EMAIL`] ?? '').trim().toLowerCase();
  const password = env[`${p}_PASSWORD`] ?? '';
  if (!email || !password)
    return { ok: false, reason: `${role} sign-in is not configured. Add ${p}_EMAIL and ${p}_PASSWORD to your environment variables.` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, reason: `${p}_EMAIL is not a valid email address.` };
  if (password.length < MIN_ROLE_PASSWORD)
    return { ok: false, reason: `${p}_PASSWORD must be at least ${MIN_ROLE_PASSWORD} characters long.` };
  const rawSecret = (env.ROLE_SESSION_SECRET || env.JWT_SECRET || '').trim();
  const secret = rawSecret.length >= 16 ? rawSecret : (env.NODE_ENV === 'production' ? '' : DEV_SECRET);
  if (env.NODE_ENV === 'production' && secret.length < 16)
    return { ok: false, reason: 'Set ROLE_SESSION_SECRET (or JWT_SECRET) to a long random text of at least 16 characters.' };
  return { ok: true, config: { email, password, secret, role } };
}

const sha = (s: string) => createHash('sha256').update(s).digest();
export const safeEqual = (a: string, b: string): boolean => timingSafeEqual(sha(a), sha(b));

export function checkRoleCredentials(config: RoleConfig, email: string, password: string): boolean {
  const e = safeEqual(email.trim().toLowerCase(), config.email);
  const p = safeEqual(password, config.password);
  return e && p;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');
const key = (c: RoleConfig) => createHmac('sha256', c.secret).update(`aurnya-role-session-v1-${c.role}`).digest();
const fingerprint = (c: RoleConfig) => createHash('sha256').update(`${c.secret}|${c.password}|${c.role}`).digest('hex').slice(0, 16);

export function signRoleToken(c: RoleConfig, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const body = b64(JSON.stringify({ aud: 'aurnya-role', email: c.email, role: c.role, pv: fingerprint(c), iat, exp: iat + ROLE_SESSION_SECONDS }));
  return `${body}.${b64(createHmac('sha256', key(c)).update(body).digest())}`;
}

export function verifyRoleToken(c: RoleConfig, token: string | undefined | null, now = Date.now()): { email: string; role: UserRole } | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = b64(createHmac('sha256', key(c)).update(body).digest());
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      aud?: unknown; email?: unknown; role?: unknown; pv?: unknown; exp?: unknown;
    };
    if (p.aud !== 'aurnya-role' || p.email !== c.email || p.role !== c.role || p.pv !== fingerprint(c)) return null;
    if (typeof p.exp !== 'number' || p.exp < Math.floor(now / 1000)) return null;
    return { email: c.email, role: c.role };
  } catch { return null; }
}

export function isSameSiteRequest(headers: { get(name: string): string | null }): boolean {
  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  const origin = headers.get('origin');
  if (origin) { try { return !!host && new URL(origin).host === host; } catch { return false; } }
  const fetchSite = headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none';
  return true;
}
