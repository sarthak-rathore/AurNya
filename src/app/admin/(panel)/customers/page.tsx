import { requireAdminPage } from '@/lib/admin-auth';
import { CustomersClient, type CustomerItem } from '@/components/admin/customers-client';
import { getDb } from '@/db/client';
import { loadCustomerItems } from '@/lib/admin-loaders';

export const metadata = { title: 'Customers' };

const DEMO: CustomerItem[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya.sharma@gmail.com', orders: 4, spent: '₹14,960', city: 'Mumbai', joined: 'Oct 12, 2026', status: 'Active' },
  { id: '2', name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', orders: 2, spent: '₹8,499', city: 'Delhi NCR', joined: 'Oct 18, 2026', status: 'Active' },
  { id: '3', name: 'Neha Verma', email: 'neha.verma@gmail.com', orders: 3, spent: '₹9,890', city: 'Bangalore', joined: 'Oct 24, 2026', status: 'Active' },
  { id: '4', name: 'Rohit Singh', email: 'rohit.singh@gmail.com', orders: 1, spent: '₹1,799', city: 'Pune', joined: 'Nov 2, 2026', status: 'Active' },
  { id: '5', name: 'Kavya Iyer', email: 'kavya.iyer@gmail.com', orders: 5, spent: '₹22,400', city: 'Chennai', joined: 'Sep 29, 2026', status: 'VIP Customer' },
];

export default async function Customers() {
  await requireAdminPage();
  const db = getDb();
  const real = db ? await loadCustomerItems(db) : null;
  if (real) return <CustomersClient initial={real.items} total={real.total} />;
  return <CustomersClient initial={DEMO} demo />;
}
