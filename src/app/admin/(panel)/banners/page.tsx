import { NeedsDatabase, PageHeader } from '@/components/admin/ui';
import { getDb } from '@/db/client';
import { readSetting } from '@/db/settings';
import { site } from '@/config/site';
import { isoToIstInput } from '@/lib/admin-format';
import { parseAnnouncement } from '@/lib/announcement';
import { parseHeroImages } from '@/lib/hero-images';
import { BannersForm } from './banners-form';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Banners & announcement' };
export default async function Banners() {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="Banners & announcement" /><NeedsDatabase /></>;
  const [rawA, rawH] = await Promise.all([readSetting(db, 'announcement'), readSetting(db, 'hero_images')]);
  const a = rawA === null ? site.announcement : parseAnnouncement(rawA, site.announcement);
  return (
    <>
      <PageHeader title="Banners & announcement" sub="The thin bar at the very top of every page, and the pictures on your home page." />
      <BannersForm announcement={{ visible: a.visible, message: a.message, href: a.href, linkText: a.linkText, start: isoToIstInput(a.start), end: isoToIstInput(a.end) }} pictures={parseHeroImages(rawH)} />
    </>
  );
}
