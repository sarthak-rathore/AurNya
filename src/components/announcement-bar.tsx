import Link from 'next/link';
import { isAnnouncementActive } from '@/lib/announcement';
import { getAnnouncement } from '@/lib/settings';

export async function AnnouncementBar() {
  // Wrap in try/catch: if getAnnouncement() throws during Vercel SSG (e.g. unstable_cache
  // unavailable at prerender time for /_not-found), silently skip the bar rather than
  // crashing the whole page and triggering infinite recursion via the error boundary.
  try {
    const a = await getAnnouncement();
    if (!isAnnouncementActive(a)) return null;
    return (
      <div role="region" aria-label="Announcement" className="bg-bar px-4 py-2 text-center text-xs tracking-wider text-bone">
        {a.message}
        {a.href && a.linkText && (
          <Link href={a.href} className="ml-2 text-champagne underline">{a.linkText}</Link>
        )}
      </div>
    );
  } catch {
    // During static prerender (/_not-found, etc.) the cache context may not be available.
    // Return null so the page can still render without an announcement bar.
    return null;
  }
}
