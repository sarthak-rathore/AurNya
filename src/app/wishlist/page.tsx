import type { Metadata } from 'next';
import { catalog } from '@/lib/catalog';
import { WishlistClient } from './wishlist-client';
export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };
export const revalidate = 60;
export default async function Wishlist() {
  return (<div className="mx-auto max-w-7xl px-6 pb-20 pt-8"><h1 className="mb-8 font-serif text-5xl">Your wishlist</h1><WishlistClient products={await catalog.all()} /><p className="mt-8 text-sm text-muted">Pieces saved to your account sync across all your devices.</p></div>);
}
