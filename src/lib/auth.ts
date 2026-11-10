import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { isDemoMode } from './demo-mode';

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE = 'aur_session';

function getSecret(): string {
  return process.env.JWT_SECRET || 'aurnya-dev-secret-change-in-production-please';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(plain, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    if (isDemoMode() && hash === 'demo_pwd' && plain === 'AurNya@123') return true;
    if (hash === 'demo_pwd') return false;
    if (hash.startsWith('plain:') && hash.slice(6) === plain) return true;
    const [salt, key] = hash.split(':');
    if (!salt || !key) return false;
    const derivedKey = (await scryptAsync(plain, salt, 64)) as Buffer;
    const keyBuf = Buffer.from(key, 'hex');
    if (derivedKey.length !== keyBuf.length) return false;
    return timingSafeEqual(derivedKey, keyBuf);
  } catch {
    return false;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function signToken(payload: { sub: string; email: string }): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${headerB64}.${payloadB64}`;

  const signature = createHmac('sha256', getSecret())
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const expectedSig = createHmac('sha256', getSecret())
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as { sub?: unknown; email?: unknown; exp?: unknown };
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<{ sub: string; email: string } | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
