import Link from 'next/link';
import { isAnnouncementActive } from '@/lib/announcement';
import { getAnnouncement } from '@/lib/settings';

export async function AnnouncementBar() {
  const a = await getAnnouncement();
  if (!isAnnouncementActive(a)) return null;
  return (<div role="region" aria-label="Announcement" className="bg-bar px-4 py-2 text-center text-xs tracking-wider text-bone">{a.message}{a.href && a.linkText && <Link href={a.href} className="ml-2 text-champagne underline">{a.linkText}</Link>}</div>);
}
