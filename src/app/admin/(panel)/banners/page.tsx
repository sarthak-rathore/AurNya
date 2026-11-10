import { PageHeader } from '@/components/admin/ui';
import { getDb } from '@/db/client';
import { readSetting } from '@/db/settings';
import { site } from '@/config/site';
import { isoToIstInput } from '@/lib/admin-format';
import { parseAnnouncement } from '@/lib/announcement';
import { DEMO_HERO_IMAGES, parseHeroImages } from '@/lib/hero-images';
import { BannersForm } from './banners-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Banners & announcement' };

export default async function Banners() {
  await requireAdminPage();
  const db = getDb();

  let a = site.announcement;
  let pictures = DEMO_HERO_IMAGES;

  if (db) {
    try {
      const [rawA, rawH] = await Promise.all([readSetting(db, 'announcement'), readSetting(db, 'hero_images')]);
      a = rawA === null ? site.announcement : parseAnnouncement(rawA, site.announcement);
      pictures = parseHeroImages(rawH);
    } catch { /* fallback to default */ }
  }

  return (
    <>
      <PageHeader
        title="Banners &amp; announcement"
        sub="The thin bar at the very top of every page, and the pictures on your home page."
      />
      <BannersForm
        announcement={{
          visible: a.visible,
          message: a.message,
          href: a.href,
          linkText: a.linkText,
          start: isoToIstInput(a.start),
          end: isoToIstInput(a.end),
        }}
        pictures={pictures}
      />
    </>
  );
}
