import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';
import { DEFAULT_STORE_CONTROLS, type StoreControls } from '@/lib/store-controls';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controls = await readSection<StoreControls>(getDb(), 'store-controls', DEFAULT_STORE_CONTROLS);
    return NextResponse.json(controls);
  } catch {
    return NextResponse.json(DEFAULT_STORE_CONTROLS);
  }
}
