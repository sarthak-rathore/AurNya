import { unstable_cache } from 'next/cache';
import { site } from '@/config/site';
import { getDb } from '@/db/client';
import { readSetting } from '@/db/settings';
import { parseAnnouncement, type Announcement } from './announcement';

const fallback: Announcement = site.announcement;

const fromDatabase = unstable_cache(async (): Promise<Announcement> => {
  const db = getDb();
  if (!db) return fallback;
  try { const raw = await readSetting(db, 'announcement'); return raw === null ? fallback : parseAnnouncement(raw, fallback); }
  catch { return fallback; }   // a database hiccup must never break every page
}, ['announcement'], { revalidate: 60, tags: ['settings'] });

/** The announcement bar's content: from the database when there is one (refreshed every minute), otherwise from src/config/site.ts. */
export const getAnnouncement = (): Promise<Announcement> => (getDb() ? fromDatabase() : Promise.resolve(fallback));
