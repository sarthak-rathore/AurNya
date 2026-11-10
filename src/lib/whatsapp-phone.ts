/**
 * Turns whatever a customer typed ("98765 43210", "+91 98765-43210", "09876543210") into WhatsApp's format: digits only, with country code
 * (919876543210). Returns null when it cannot be a real mobile number, so we never try to message garbage.
 */
export function normalizePhone(input: string | null | undefined, countryCode = '91'): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  const hadPlus = raw.startsWith('+') || raw.startsWith('00');
  let d = raw.replace(/\D/g, '');
  if (!d) return null;
  if (raw.startsWith('00')) d = d.slice(2);
  if (!hadPlus) {
    if (d.startsWith('0')) d = d.replace(/^0+/, '');                     // national format: 09876543210
    if (d.length === 10) d = countryCode + d;                            // no country code typed
    else if (d.length === countryCode.length + 10 && d.startsWith(countryCode)) { /* already complete */ }
    else if (d.length < 10) return null;
  }
  if (d.length < 8 || d.length > 15) return null;                         // E.164 allows at most 15 digits
  if (d.startsWith('91') && d.length === 12 && !/^91[6-9]\d{9}$/.test(d)) return null;   // India: mobiles start with 6-9
  if (d.startsWith('0')) return null;
  return d;
}

/** Last 10 digits: used to match an incoming WhatsApp number to a customer however they typed it at sign-up. */
export const phoneTail = (digits: string): string => digits.slice(-10);
