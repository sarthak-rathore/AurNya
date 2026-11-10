import { NextResponse } from 'next/server';

// Staff accounts are managed in the environment file (OWNER_/ADMIN_/MANAGER_ EMAIL and PASSWORD), not through this API.
// The old version of this route created a *customer* row that could never sign in to a dashboard, so it has been retired.
const gone = () => NextResponse.json({ error: 'Staff accounts are set in your environment file. See Users & Access.' }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
export const GET = gone;
export const POST = gone;
