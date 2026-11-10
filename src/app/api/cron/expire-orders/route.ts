import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { releaseExpiredOrders } from '@/db/inventory';
import { safeEqual } from '@/lib/admin-auth-core';
import { refreshStore } from '@/lib/admin-revalidate';

// Daily clean-up (see vercel.json): cancels online orders that were never paid and puts their stock back.
// Vercel Cron calls this with "Authorization: Bearer <CRON_SECRET>". Without CRON_SECRET set, the route stays switched off.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  if (!safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const db = getDb(); if (!db) return NextResponse.json({ released: 0 });
  const released = await releaseExpiredOrders(db); if (released) refreshStore();
  return NextResponse.json({ released }, { headers: { 'Cache-Control': 'no-store' } });
}
