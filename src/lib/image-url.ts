// Which picture and video addresses the store accepts.
// Pictures are drawn with next/image, which only fetches from the hosts listed in next.config.mjs (Cloudinary) and from the
// site's own public folder. Anything else would crash the page that shows it, so the admin dashboard refuses it up front.
export const IMAGE_HOSTS: readonly string[] = ['res.cloudinary.com'];
const IMAGE_FILE = /\.(png|jpe?g|webp|avif|gif)$/i;
const VIDEO_FILE = /\.(mp4|webm|mov)$/i;

const clean = (v: unknown): string | null => (typeof v === 'string' && v.trim() && v.length <= 600 && !/\s/.test(v.trim()) ? v.trim() : null);
const localPath = (s: string): boolean => s.startsWith('/') && !s.startsWith('//') && !s.includes('..') && !s.includes('\\');

/** A picture from the site's /public folder (for example /images/ring.png) or from Cloudinary over https. */
export function isAllowedImageUrl(v: unknown): v is string {
  const s = clean(v); if (!s) return false;
  if (s.startsWith('/')) return localPath(s) && IMAGE_FILE.test(s.split('?')[0]);
  try { const u = new URL(s); return u.protocol === 'https:' && IMAGE_HOSTS.includes(u.hostname) && !u.username && !u.password; } catch { return false; }
}

/** A product video: a file in /public, or any https address (videos are played by the browser directly, not by next/image). */
export function isAllowedVideoUrl(v: unknown): v is string {
  const s = clean(v); if (!s) return false;
  if (s.startsWith('/')) return localPath(s) && VIDEO_FILE.test(s.split('?')[0]);
  try { const u = new URL(s); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}

/** Only on-site links or https links. Anything else (for example javascript:) is refused. */
export function isSafeLink(v: unknown): v is string {
  const s = clean(v); if (!s) return false;
  if (s.startsWith('/')) return !s.startsWith('//') && !s.includes('\\');
  try { const u = new URL(s); return u.protocol === 'https:'; } catch { return false; }
}
