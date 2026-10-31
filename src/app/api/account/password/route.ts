import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';
import { getUserById, updateUserPassword } from '@/db/accounts';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = schema.parse(await req.json());
    const user = await getUserById(session.sub);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const ok = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

    const newHash = await hashPassword(data.newPassword);
    await updateUserPassword(session.sub, newHash);

    return NextResponse.json({ message: 'Password updated successfully!' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    console.error('Password change error', err);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
