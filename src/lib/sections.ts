import { z } from 'zod';

/*
 * Dashboard "sections" that have no table of their own yet (categories, collections, content pages, marketing campaigns, store settings,
 * and the demo orders). Each one is saved as one JSON document. This is what makes their Save buttons real, and it means every one of them
 * goes through the owner-approval gate like any other change.
 */
export const SECTION_KEYS = ['categories', 'collections', 'content', 'marketing', 'settings', 'orders-demo', 'coupons-demo', 'store-controls'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const isSectionKey = (k: string): k is SectionKey => (SECTION_KEYS as readonly string[]).includes(k);

export const MAX_SECTION_BYTES = 200_000;

/** The body of PUT /api/admin/section/[key]. `value` can be any JSON, but not huge. */
export const sectionBodySchema = z.object({ value: z.unknown() }).superRefine((b, ctx) => {
  let size = 0;
  try { size = JSON.stringify(b.value ?? null).length; } catch { ctx.addIssue({ code: 'custom', message: 'That data cannot be saved.' }); return; }
  if (b.value === undefined) ctx.addIssue({ code: 'custom', message: 'Nothing to save.' });
  if (size > MAX_SECTION_BYTES) ctx.addIssue({ code: 'custom', message: 'That is too much data for one save.' });
});
