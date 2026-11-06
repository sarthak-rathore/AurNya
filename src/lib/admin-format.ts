// Small pure helpers shared by the admin screens (browser) and the admin server code. No secrets, no database.

export const LOW_STOCK = 5;                 // at or below this many left, an item is shown as "low stock"
export const IST_OFFSET_MS = 5.5 * 3600 * 1000;   // India Standard Time has no daylight saving, so a fixed offset is exact

/** "Blossom Drop Earrings!" -> "blossom-drop-earrings". Accents are removed, everything else becomes a dash. */
export function slugify(input: string): string {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
}

/** "799", "799.5", "₹1,299.00" -> paise. Returns null for anything that is not a plain rupee amount. Works on text, never on floats. */
export function rupeesToPaise(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const s = String(input).replace(/[₹,\s]/g, '');
  const m = s.match(/^(\d{1,7})(?:\.(\d{1,2}))?$/); if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0);
}

/** Paise -> text for an input box: 79900 -> "799", 79950 -> "799.50". */
export function paiseToRupees(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return '';
  const r = Math.floor(paise / 100); const p = paise % 100;
  return p === 0 ? String(r) : `${r}.${String(p).padStart(2, '0')}`;
}

/** The browser's datetime-local box has no time zone. The store is in India, so those times are read as IST. "2026-11-02T10:30" -> ISO (UTC). */
export function istInputToIso(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/); if (!m) return null;
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - IST_OFFSET_MS;
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}
/** The reverse: an ISO time -> "2026-11-02T10:30" in IST for a datetime-local box. */
export function isoToIstInput(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const t = +new Date(iso); if (Number.isNaN(t)) return '';
  return new Date(t + IST_OFFSET_MS).toISOString().slice(0, 16);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts });
export const formatIstDate = (d: string | Date): string => fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
export const formatIstDateTime = (d: string | Date): string => fmt({ day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(d));

/** Safe text for a WhatsApp link: digits only; a 10-digit Indian number gets 91 in front. */
export function whatsappDigits(phone: string | null | undefined): string {
  const d = (phone ?? '').replace(/\D/g, ''); if (!d) return '';
  return d.length === 10 ? `91${d}` : d.replace(/^0+/, '');
}
