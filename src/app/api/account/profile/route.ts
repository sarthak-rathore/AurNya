import { after, NextResponse } from 'next/server';
import { onCustomerSignIn } from '@/lib/whatsapp';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { updateUser } from '@/db/accounts';
import { getDb } from '@/db/client';

const schema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    await updateUser(session.sub, data);
    // A customer who just added a phone number is subscribed to WhatsApp updates (unless they opted out earlier).
    if (data.phone) after(() => onCustomerSignIn(session.sub).catch(console.error));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
