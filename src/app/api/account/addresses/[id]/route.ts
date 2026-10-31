import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateAddress, deleteAddress } from '@/db/accounts';
import { getDb } from '@/db/client';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const data = await req.json() as Record<string, unknown>;
  await updateAddress(Number(id), session.sub, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await deleteAddress(Number(id), session.sub);
  return NextResponse.json({ ok: true });
}
