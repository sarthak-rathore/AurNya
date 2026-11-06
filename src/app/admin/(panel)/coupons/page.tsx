import { NeedsDatabase, PageHeader } from '@/components/admin/ui';
import { listAllCoupons } from '@/db/admin-coupons';
import { getDb } from '@/db/client';
import { isoToIstInput, paiseToRupees } from '@/lib/admin-format';
import { CouponManager, type CouponRow } from './coupon-manager';
import { requireAdminPage } from '@/lib/admin-auth';

export const metadata = { title: 'Coupons' };
export default async function Coupons() {
  await requireAdminPage();   // the sign-in check must come first: pages build in parallel with their layout
  const db = getDb(); if (!db) return <><PageHeader title="Coupons" /><NeedsDatabase /></>;
  const rows: CouponRow[] = (await listAllCoupons(db)).map((c) => ({
    id: c.id, code: c.code, kind: c.kind, value: c.kind === 'percent' ? String(c.value) : paiseToRupees(c.value), minSubtotal: paiseToRupees(c.minSubtotalPaise) || '0',
    startsAt: isoToIstInput(c.startsAt), endsAt: isoToIstInput(c.endsAt), maxRedemptions: c.maxRedemptions === null ? '' : String(c.maxRedemptions), redemptions: c.redemptions, isActive: c.isActive, isDemo: c.isDemo,
    live: c.isActive && (!c.startsAt || c.startsAt <= new Date()) && (!c.endsAt || c.endsAt >= new Date()) && (c.maxRedemptions === null || c.redemptions < c.maxRedemptions),
  }));
  return <><PageHeader title="Coupons" sub="Discount codes customers type in their bag. Times are India time (IST)." /><CouponManager rows={rows} /></>;
}
