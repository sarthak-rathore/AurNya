import { z } from 'zod';
import { adminRouteAnyDb, ok } from '@/lib/admin-route';
import { sendCustomBroadcast } from '@/lib/whatsapp';
import { readWhatsappConfig } from '@/lib/whatsapp-config';
import { jsonError } from '@/lib/admin-auth';

const schema = z.object({
  message: z.string().trim().min(3, 'Type the message to send.').max(240, 'Keep it to 240 characters or less.'),
  href: z.string().trim().max(200).default('').refine((v) => v === '' || v.startsWith('/') || v.startsWith('https://'), 'The link must start with / or https://.'),
});

/** Send a custom message to every subscribed customer. Needs the owner's approval when an admin or manager sends it. */
export const POST = (req: Request) => adminRouteAnyDb(req, schema, async ({ body }) => {
  const cfg = readWhatsappConfig();
  if (!cfg.ok) return jsonError(400, cfg.reason);
  const n = await sendCustomBroadcast(body.message, body.href || null);
  return ok({ queued: n, message: n ? `Queued for ${n} customer${n === 1 ? '' : 's'}.` : 'No subscribed customers yet.' });
});
