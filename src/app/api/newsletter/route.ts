import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // If Resend API key is present, we could subscribe to an audience or send a welcome email
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM ?? 'AurNya <noreply@aurnya.com>',
            to: email,
            subject: 'Welcome to the AurNya Circle',
            html: '<p>Thank you for subscribing to AurNya. You will receive private previews, style notes, and exclusive access to new jewellery drops.</p>',
          }),
        });
      } catch (err) {
        console.error('[newsletter] Email sending error:', err);
      }
    }

    return NextResponse.json({ message: 'Welcome to the AurNya list! You will receive our seasonal edits and private previews.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
