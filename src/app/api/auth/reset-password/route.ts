import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, updateUserPassword } from '@/db/accounts';
import { hashPassword } from '@/lib/auth';
import { verifyOtp, isDemoMode } from '@/lib/otp-store';

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});
const noStore = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: noStore });
  }

  const demo = isDemoMode();
  const otpValid = demo
    ? body.otp === '000000' || verifyOtp(body.email, 'user', body.otp)
    : verifyOtp(body.email, 'user', body.otp);
  if (!otpValid) return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 401, headers: noStore });

  const user = await getUserByEmail(body.email);
  if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers: noStore });

  const hash = await hashPassword(body.newPassword);
  await updateUserPassword(user.id, hash);

  return NextResponse.json({ ok: true }, { headers: noStore });
}
