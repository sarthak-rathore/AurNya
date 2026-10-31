'use client';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductGrid } from '@/components/product-card';
import { useShop } from '@/store/shop-context';
export function WishlistClient({ products }: { products: Product[] }) {
  const { wishlist } = useShop();
  const items = products.filter((p) => wishlist.includes(p.id));
  if (!items.length) return <div className="py-16 text-center"><p className="text-muted">Nothing saved yet. Tap the heart on any piece.</p><Link href="/shop" className="mt-5 inline-block rounded-full bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-ivory">Start browsing</Link></div>;
  return <ProductGrid items={items} heading="Saved pieces" />;
}
