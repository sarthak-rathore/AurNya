import type { Db } from './client';
import { memoryExtra } from './memory-store';
import { readSetting, writeSetting } from './settings';
import type { SectionKey } from '@/lib/sections';

const key = (k: SectionKey) => `section:${k}`;

/** Saved data for one dashboard section, or `fallback` when nothing has been saved yet (or the database is down: the page must still open). */
export async function readSection<T>(db: Db | null, k: SectionKey, fallback: T): Promise<T> {
  try {
    if (db) { const v = await readSetting(db, key(k)); return v === null ? fallback : (v as T); }
    return memoryExtra.sections.has(key(k)) ? (memoryExtra.sections.get(key(k)) as T) : fallback;
  } catch { return fallback; }
}

export async function writeSection(db: Db | null, k: SectionKey, value: unknown): Promise<void> {
  if (db) { await writeSetting(db, key(k), value); return; }
  memoryExtra.sections.set(key(k), value);
}
