import { unstable_cache } from 'next/cache';
import { getDb } from '@/db/client';
import { readSetting } from '@/db/settings';
import { DEMO_HERO_IMAGES, parseHeroImages, type HeroImageConfig } from './hero-images';

const fromDatabase = unstable_cache(async (): Promise<HeroImageConfig> => {
  const db = getDb();
  if (!db) return DEMO_HERO_IMAGES;
  try {
    const raw = await readSetting(db, 'hero_images');
    return raw === null ? DEMO_HERO_IMAGES : parseHeroImages(raw);
  } catch { return DEMO_HERO_IMAGES; }
}, ['hero_images'], { revalidate: 60, tags: ['settings'] });

export const getHeroImages = (): Promise<HeroImageConfig> =>
  getDb() ? fromDatabase() : Promise.resolve(DEMO_HERO_IMAGES);
