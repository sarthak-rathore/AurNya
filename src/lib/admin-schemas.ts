import { z } from 'zod';
import { site } from '@/config/site';
import { istInputToIso, rupeesToPaise, slugify } from './admin-format';
import { isAllowedImageUrl, isAllowedVideoUrl, isSafeLink } from './image-url';
import { ORDER_STATUSES } from './order-status';

// Everything the admin screens may send to the server is checked here first. Plain-English messages, because the owner reads them.

const text = (label: string, max: number) => z.string({ required_error: `${label} is required.`, invalid_type_error: `${label} must be text.` }).trim().max(max, `${label} is too long (most ${max} characters).`);
const optText = (label: string, max: number) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.string().max(max, `${label} is too long (most ${max} characters).`).nullish().transform((v) => (v ? v : null)));

/** Rupee amounts arrive as text from the form ("799", "1,299.50") and become integer paise. */
const money = (label: string) => z.string().trim().transform((v, ctx) => {
  const p = rupeesToPaise(v);
  if (p === null) { ctx.addIssue({ code: 'custom', message: `${label} must be a plain amount in rupees, for example 799 or 799.50.` }); return z.NEVER; }
  return p;
});
const optMoney = (label: string) => z.preprocess((v) => (v === '' || v === undefined ? null : v), money(label).nullable());
const whole = (label: string, min: number, max: number) => z.number({ required_error: `${label} is required.`, invalid_type_error: `${label} must be a whole number.` }).int(`${label} must be a whole number.`).min(min, `${label} cannot be less than ${min}.`).max(max, `${label} cannot be more than ${max}.`);

export const imageSchema = z.object({
  src: z.string().trim().refine(isAllowedImageUrl, 'Pictures must be uploaded here, come from Cloudinary (https://res.cloudinary.com/…), or be a file in your site’s /images folder.'),
  alt: text('Picture description', 200).default(''),
});

const variantSchema = z.object({
  value: text('Size / option', 20).min(1, 'Every size needs a name.'),
  stock: whole('Stock', 0, 100000).default(0),
  sku: optText('Variant SKU', 40),
});

export const productInputSchema = z.object({
  name: text('Name', 120).min(2, 'Please give the product a name.'),
  slug: z.preprocess((v) => (typeof v === 'string' ? slugify(v) : v), z.string().max(80)).optional().default(''),
  sku: text('SKU', 40).min(2, 'Please give the product an SKU.').regex(/^[A-Za-z0-9._-]+$/, 'SKU can use letters, numbers, dots, dashes and underscores only.'),
  category: z.enum(site.categories, { errorMap: () => ({ message: 'Please choose a category.' }) }),
  short: text('Short description', 200).default(''),
  description: optText('Description', 5000),
  price: money('Price'),
  comparePrice: optMoney('Original price'),
  stock: whole('Stock', 0, 100000).default(0),
  tags: z.array(z.enum(['new', 'bestseller'])).max(2).default([]),
  material: optText('Material', 120), dimensions: optText('Dimensions', 120), weight: optText('Weight', 60),
  images: z.array(imageSchema).max(10, 'A product can have at most 10 pictures.').default([]),
  video: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().trim().refine(isAllowedVideoUrl, 'The video must be an https link or an .mp4 file in your /videos folder.').nullable().optional().transform((v) => v ?? null)),
  seoTitle: optText('Search title', 70), seoDescription: optText('Search description', 170),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  collections: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  variants: z.object({ label: text('Option name', 20).min(1, 'Name the option, for example Size.'), options: z.array(variantSchema).min(1, 'Add at least one size.').max(30, 'At most 30 sizes.') }).nullable().default(null),
}).superRefine((v, ctx) => {
  if (v.comparePrice !== null && v.comparePrice <= v.price) ctx.addIssue({ code: 'custom', path: ['comparePrice'], message: 'The original price must be higher than the selling price (or leave it empty).' });
  if (v.variants) {
    const seen = new Set<string>();
    for (const o of v.variants.options) { if (seen.has(o.value)) ctx.addIssue({ code: 'custom', path: ['variants'], message: `The size "${o.value}" is listed twice.` }); seen.add(o.value); }
  }
  if (new Set(v.images.map((i) => i.src)).size !== v.images.length) ctx.addIssue({ code: 'custom', path: ['images'], message: 'The same picture is added twice.' });
});
export type ProductInput = z.output<typeof productInputSchema>;

export const stockAdjustSchema = z.object({
  productId: whole('Product', 1, 2_000_000_000),
  variantId: whole('Variant', 1, 2_000_000_000).nullable().default(null),
  mode: z.enum(['set', 'add']),
  value: whole('Stock', -100000, 100000),
}).superRefine((v, ctx) => { if (v.mode === 'set' && v.value < 0) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Stock cannot be negative.' }); });
export type StockAdjust = z.output<typeof stockAdjustSchema>;

export const couponInputSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'The code must be 3 to 30 characters: capital letters, numbers, dash or underscore.'),
  kind: z.enum(['percent', 'fixed']),
  value: z.string().trim(),
  minSubtotal: z.string().trim().default('0'),
  startsAt: z.string().trim().nullish().transform((v) => (v ? v : null)),
  endsAt: z.string().trim().nullish().transform((v) => (v ? v : null)),
  maxRedemptions: z.preprocess((v) => (v === '' || v === undefined ? null : typeof v === 'string' ? Number(v) : v), z.number().int('Uses must be a whole number.').min(1, 'Uses must be at least 1.').max(10_000_000).nullable()),
  isActive: z.boolean().default(true),
}).transform((v, ctx) => {
  let value: number;
  if (v.kind === 'percent') {
    value = Number(v.value);
    if (!Number.isInteger(value) || value < 1 || value > 100) { ctx.addIssue({ code: 'custom', path: ['value'], message: 'A percentage discount must be a whole number from 1 to 100.' }); return z.NEVER; }
  } else {
    const p = rupeesToPaise(v.value);
    if (p === null || p < 100) { ctx.addIssue({ code: 'custom', path: ['value'], message: 'A fixed discount must be an amount in rupees, at least 1.' }); return z.NEVER; }
    value = p;
  }
  const min = rupeesToPaise(v.minSubtotal || '0');
  if (min === null) { ctx.addIssue({ code: 'custom', path: ['minSubtotal'], message: 'The minimum spend must be an amount in rupees (or 0).' }); return z.NEVER; }
  const startsAt = v.startsAt ? istInputToIso(v.startsAt) : null; const endsAt = v.endsAt ? istInputToIso(v.endsAt) : null;
  if (v.startsAt && !startsAt) { ctx.addIssue({ code: 'custom', path: ['startsAt'], message: 'The start time is not a valid date and time.' }); return z.NEVER; }
  if (v.endsAt && !endsAt) { ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end time is not a valid date and time.' }); return z.NEVER; }
  if (startsAt && endsAt && endsAt <= startsAt) { ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end time must be after the start time.' }); return z.NEVER; }
  return { code: v.code, kind: v.kind, value, minSubtotalPaise: min, startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null, maxRedemptions: v.maxRedemptions, isActive: v.isActive };
});
export type CouponInput = z.output<typeof couponInputSchema>;

export const announcementSchema = z.object({
  visible: z.boolean(),
  message: z.string().trim().max(200, 'The message is too long (most 200 characters).'),
  linkText: z.string().trim().max(40, 'The link text is too long (most 40 characters).').default(''),
  href: z.string().trim().default('').refine((v) => v === '' || isSafeLink(v), 'The link must start with / (a page on your site) or https://.'),
  start: z.string().trim().nullish().transform((v) => (v ? v : null)),
  end: z.string().trim().nullish().transform((v) => (v ? v : null)),
}).transform((v, ctx) => {
  const start = v.start ? istInputToIso(v.start) : null; const end = v.end ? istInputToIso(v.end) : null;
  if (v.start && !start) ctx.addIssue({ code: 'custom', path: ['start'], message: 'The start time is not a valid date and time.' });
  if (v.end && !end) ctx.addIssue({ code: 'custom', path: ['end'], message: 'The end time is not a valid date and time.' });
  if (start && end && end <= start) ctx.addIssue({ code: 'custom', path: ['end'], message: 'The end time must be after the start time.' });
  if (v.visible && !v.message) ctx.addIssue({ code: 'custom', path: ['message'], message: 'Type the message, or switch the bar off.' });
  if (v.href && !v.linkText) ctx.addIssue({ code: 'custom', path: ['linkText'], message: 'Add the words for the link, or clear the link address.' });
  return { visible: v.visible, message: v.message, href: v.href, linkText: v.linkText, start, end };
});

const slot = z.string().trim().refine((v) => v === '' || isAllowedImageUrl(v), 'Pictures must be uploaded here, come from Cloudinary, or be a file in your /images folder.');
export const heroImagesSchema = z.object({
  slide_rings_art: slot, slide_gifts_art: slot, promo_gift_bg: slot, promo_rings_art: slot, col_everyday: slot, col_statement: slot, col_gifts: slot,
});

export const orderActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('status'),
    to: z.enum(ORDER_STATUSES),
    note: optText('Note', 300),
    courier: optText('Courier', 60), trackingNumber: optText('Tracking number', 60),
    trackingUrl: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().trim().max(400).refine(isSafeLink, 'The tracking link must start with https://').nullable().optional().transform((v) => v ?? null)),
    paymentId: optText('Payment reference', 80),
    restock: z.boolean().default(false),
    refundOnline: z.boolean().default(false),
  }),
  z.object({
    action: z.literal('tracking'),
    courier: text('Courier', 60).min(1, 'Choose or type the courier.'), trackingNumber: optText('Tracking number', 60),
    trackingUrl: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), z.string().trim().max(400).refine(isSafeLink, 'The tracking link must start with https://').nullable().optional().transform((v) => v ?? null)),
  }),
  z.object({ action: z.literal('note'), adminNote: z.string().trim().max(2000, 'The note is too long.').default('') }),
]);
export type OrderAction = z.output<typeof orderActionSchema>;

export const firstIssue = (e: z.ZodError): string => { const i = e.issues[0]; return i ? i.message : 'Please check the form.'; };
