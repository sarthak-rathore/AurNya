import { requireRole } from '@/lib/role-auth';
import { PageHeader } from '@/components/admin/ui';
import { CouponManager } from '@/app/admin/(panel)/coupons/coupon-manager';
import { CouponsClient, type CouponItem } from '@/components/admin/coupons-client';
import { getDb } from '@/db/client';
import { readSection } from '@/db/sections';
import { loadCouponRows } from '@/lib/admin-loaders';

export const metadata = { title: 'Coupons & Offers' };

const DEMO: CouponItem[] = [
  { code: 'AURDEMO10', kind: '10% OFF', minSubtotal: '₹1,500', redemptions: 48, max: 200, status: 'Active' },
  { code: 'FIRST15', kind: '15% OFF', minSubtotal: '₹999', redemptions: 112, max: 500, status: 'Active' },
  { code: 'FESTIVE500', kind: '₹500 Flat OFF', minSubtotal: '₹3,000', redemptions: 29, max: 100, status: 'Active' },
  { code: 'GOLD20', kind: '20% OFF', minSubtotal: '₹5,000', redemptions: 15, max: 50, status: 'Active' },
];

export default async function Coupons() {
  await requireRole('owner');
  const db = getDb();
  const rows = db ? await loadCouponRows(db) : null;
  if (rows) {
    return (<>
      <PageHeader title="Coupons & Offers" sub="Create promotional discount codes and track customer redemptions. New live offers are announced to subscribed customers on WhatsApp automatically." />
      <CouponManager rows={rows} />
    </>);
  }
  const saved = await readSection<CouponItem[]>(null, 'coupons-demo', DEMO);
  return <CouponsClient initial={saved} />;
}
