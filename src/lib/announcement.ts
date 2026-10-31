// The announcement bar's data and rules, kept pure so they can be tested and reused by the admin dashboard in Phase 6.
export interface Announcement { visible: boolean; message: string; href: string; linkText: string; start: string | null; end: string | null }

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const date = (v: unknown) => (typeof v === 'string' && v && !Number.isNaN(+new Date(v)) ? v : null);

/** Turns anything stored in the database into a safe Announcement. Bad or missing pieces fall back to the given default. */
export function parseAnnouncement(raw: unknown, fallback: Announcement): Announcement {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return fallback;
  const r = raw as Record<string, unknown>;
  const href = text(r.href, 300);
  return {
    visible: typeof r.visible === 'boolean' ? r.visible : fallback.visible,
    message: text(r.message, 300),
    // Only on-site links or https links. Anything else (for example javascript:) is dropped.
    href: href.startsWith('/') && !href.startsWith('//') || /^https:\/\//i.test(href) ? href : '',
    linkText: text(r.linkText, 60),
    start: date(r.start), end: date(r.end),
  };
}

export const isAnnouncementActive = (a: Announcement, now = Date.now()): boolean =>
  a.visible && a.message.length > 0 && (!a.start || now >= +new Date(a.start)) && (!a.end || now <= +new Date(a.end));
