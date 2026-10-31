import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { getAddresses, addAddress } from '@/db/accounts';
import { getDb } from '@/db/client';

const addressSchema = z.object({
  label: z.string().max(50).default('Home'),
  recipientName: z.string().min(1).max(100),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India'),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ addresses: await getAddresses(session.sub) });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = addressSchema.parse(await req.json());
    const addr = await addAddress(session.sub, data);
    return NextResponse.json({ address: addr }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
  }
}
