import { dashboardStats } from '@/db/admin-stats';
import { getDb } from '@/db/client';

/** The little numbers on the sidebar (orders to handle, low stock). Real numbers when a database is connected, otherwise nothing (never made-up numbers). */
export async function shellCounts(): Promise<{ todo: number; lowStock: number }> {
  const db = getDb(); if (!db) return { todo: 0, lowStock: 0 };
  try { const s = await dashboardStats(db); return { todo: s.toPack + s.toShip + s.codToConfirm, lowStock: s.lowStockCount }; }
  catch { return { todo: 0, lowStock: 0 }; }
}
