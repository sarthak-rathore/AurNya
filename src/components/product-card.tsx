import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { discountPercent, formatINR } from '@/lib/money';
import { PlaceholderArt } from './placeholder-art';
import { QuickAdd, WishButton } from './product-actions';

export function ProductCard({ product: p, priority = false }: { product: Product; priority?: boolean }) {
  const d = discountPercent(p.pricePaise, p.originalPricePaise);
  const badge = p.stock <= 0 ? 'Sold out' : d ? `${d}% off` : p.tags.includes('new') ? 'New' : p.tags.includes('bestseller') ? 'Bestseller' : '';
  return (
    <article className="group relative">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-3xl border border-charcoal/10 bg-gradient-to-br from-cream to-sage transition duration-500 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-shade/20">
          {badge && <span className="absolute left-3 top-3 z-10 rounded-full bg-ivory px-3 py-0.5 text-[10px] uppercase tracking-widest">{badge}</span>}
          {p.image ? <Image src={p.image} alt={p.imageAlt ?? p.name} fill sizes="(max-width:768px) 50vw, 25vw" priority={priority} className="object-cover" />
            : (<><PlaceholderArt category={p.category} className="w-3/5" /><span aria-hidden="true" className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest text-muted">Photo coming soon</span></>)}
        </div>
        <h3 className="mt-3 font-serif text-xl leading-tight">{p.name}</h3>
      </Link>
      <WishButton id={p.id} name={p.name} className="absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full bg-ivory/80" />
      <p className="text-xs uppercase tracking-[.12em] text-muted">{p.category}</p>
      <p className="font-medium">{formatINR(p.pricePaise)}{p.originalPricePaise && <s className="ml-2 font-normal text-muted">{formatINR(p.originalPricePaise)}</s>}</p>
      <QuickAdd product={p} />
    </article>
  );
}
export const ProductGrid = ({ items, heading }: { items: Product[]; heading?: string }) => (
  <>
    {/* Screen-reader-only heading keeps heading levels in order on pages where the grid follows the page title directly. */}
    {heading && <h2 className="sr-only">{heading}</h2>}
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
  </>
);
