// In-memory OTP store. TTL: 10 minutes.
// In demo mode, code is always "000000".

const store = new Map<string, { code: string; expiresAt: number; role: string }>();
let lastSweep = 0;

function sweep(now = Date.now()) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of store) if (v.expiresAt < now) store.delete(k);
}

import { isDemoMode } from './demo-mode';

export { isDemoMode };

export function generateOtp(email: string, role: string): string {
  sweep();
  const code = isDemoMode() ? '000000' : String(Math.floor(100000 + Math.random() * 900000));
  store.set(`${role}:${email.toLowerCase()}`, { code, expiresAt: Date.now() + 10 * 60_000, role });
  return code;
}

export function verifyOtp(email: string, role: string, code: string): boolean {
  sweep();
  const entry = store.get(`${role}:${email.toLowerCase()}`);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) { store.delete(`${role}:${email.toLowerCase()}`); return false; }
  if (entry.code !== code.trim()) return false;
  store.delete(`${role}:${email.toLowerCase()}`);
  return true;
}
