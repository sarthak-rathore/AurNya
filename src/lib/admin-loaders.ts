import type { CouponRow } from '@/app/admin/(panel)/coupons/coupon-manager';
import type { CustomerItem } from '@/components/admin/customers-client';
import { listAllCoupons } from '@/db/admin-coupons';
import { listCustomers } from '@/db/admin-customers';
import type { Db } from '@/db/client';
import { isoToIstInput, paiseToRupees } from './admin-format';
import { formatINR } from './money';

/** Real coupons for the dashboard, or null when the database cannot be read (the page then shows the sample list instead of crashing). */
export async function loadCouponRows(db: Db): Promise<CouponRow[] | null> {
  try {
    const now = Date.now();
    return (await listAllCoupons(db)).map((c) => ({
      id: c.id, code: c.code, kind: c.kind, value: c.kind === 'percent' ? String(c.value) : paiseToRupees(c.value),
      minSubtotal: paiseToRupees(c.minSubtotalPaise) || '0', startsAt: isoToIstInput(c.startsAt), endsAt: isoToIstInput(c.endsAt),
      maxRedemptions: c.maxRedemptions === null ? '' : String(c.maxRedemptions), redemptions: c.redemptions, isActive: c.isActive, isDemo: c.isDemo,
      live: c.isActive && (!c.startsAt || c.startsAt.getTime() <= now) && (!c.endsAt || c.endsAt.getTime() > now) && (c.maxRedemptions === null || c.redemptions < c.maxRedemptions),
    }));
  } catch { return null; }
}

/** Real customers for the dashboard, or null when the database cannot be read. */
export async function loadCustomerItems(db: Db): Promise<{ items: CustomerItem[]; total: number } | null> {
  try {
    const { rows, total } = await listCustomers(db);
    return {
      total,
      items: rows.map((c) => ({
        id: c.id, name: c.name, email: c.email, orders: c.orders, spent: formatINR(c.spentPaise), city: c.city,
        joined: c.joined.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }),
        status: c.orders >= 5 || c.spentPaise >= 2_000_000 ? 'VIP Customer' : 'Active', whatsapp: c.whatsapp,
      })),
    };
  } catch { return null; }
}
