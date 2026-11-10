import { writeSection } from '@/db/sections';
import { audit } from '@/db/admin-audit';
import { jsonError } from '@/lib/admin-auth';
import { SECTION_LABEL } from '@/lib/approvals-describe';
import { adminRouteAnyDb, ok } from '@/lib/admin-route';
import { isSectionKey, sectionBodySchema } from '@/lib/sections';

/**
 * Saves one dashboard section (categories, collections, content, marketing, store settings...).
 * Goes through the same owner-approval gate as every other change: an admin's or manager's save waits for the owner.
 */
export const PUT = async (req: Request, { params }: { params: Promise<{ key: string }> }) => {
  const { key } = await params;
  if (!isSectionKey(key)) return jsonError(404, 'That section does not exist.');
  return adminRouteAnyDb(req, sectionBodySchema, async ({ db, actor, body }) => {
    await writeSection(db, key, body.value);
    if (db) await audit(db, actor, 'update', `section:${key}`, null, `${SECTION_LABEL[key] ?? key} updated`);
    return ok();
  });
};
