'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { useShop } from '@/store/shop-context';
import { startAurnyaLoader } from './route-loader';

const Heart = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill={on ? '#b05a7a' : 'none'} stroke={on ? '#b05a7a' : 'currentColor'} strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />
  </svg>
);

const toLine = (p: Product, variant: string | null, qty: number) => ({
  productId: p.id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  pricePaise: p.pricePaise,
  variant,
  qty,
});

export function WishButton({ id, name, className = '' }: { id: number; name: string; className?: string }) {
  const { hasWish, toggleWish, notify } = useShop();
  const on = hasWish(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${on ? 'Remove from' : 'Add to'} wishlist: ${name}`}
      className={className}
      onClick={() => { toggleWish(id); notify(on ? 'Removed from wishlist' : 'Saved to wishlist'); }}
    >
      <Heart on={on} />
    </button>
  );
}

export function QuickAdd({ product }: { product: Product }) {
  const { add } = useShop();
  const cls = 'mt-3 block w-full rounded-full border border-charcoal/20 py-2 text-center text-xs uppercase tracking-widest transition hover:bg-charcoal hover:text-ivory';
  if (product.stock <= 0) return null;
  if (product.variants) return <Link href={`/product/${product.slug}`} className={cls}>Select {product.variants.label.toLowerCase()}</Link>;
  return <button type="button" className={cls} onClick={() => add(toLine(product, null, 1))}>Quick add</button>;
}

export function AddToCart({ product }: { product: Product }) {
  const { add, hasWish, toggleWish, notify } = useShop();
  const router = useRouter();
  const [variant, setVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  // Stock is per size for products with sizes, so each size can sell out on its own.
  const stockFor = (v: string | null) => (product.variants && v ? product.variants.optionStock?.[v] ?? product.stock : product.stock);
  const maxFor = (v: string | null) => Math.max(1, Math.min(10, stockFor(v)));
  const left = stockFor(variant);
  const out = product.stock <= 0;
  const max = maxFor(variant);
  const wished = hasWish(product.id);

  const submit = () => {
    if (product.variants && !variant) {
      setError(`Please choose a ${product.variants.label.toLowerCase()}.`);
      return;
    }
    setError('');
    add(toLine(product, variant, qty));
  };

  const buyNow = () => {
    if (product.variants && !variant) {
      setError(`Please choose a ${product.variants.label.toLowerCase()} before proceeding to checkout.`);
      return;
    }
    setError('');
    startAurnyaLoader('Securing your order...');
    add(toLine(product, variant, qty));
    router.push('/checkout');
  };

  return (
    <div>
      {product.variants && (
        <fieldset className="my-5">
          <legend className="mb-2 text-xs uppercase tracking-widest text-muted">{product.variants.label}</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.options.map((o) => {
              const gone = product.variants!.optionStock ? (product.variants!.optionStock[o] ?? 0) <= 0 : false;
              return (
                <label key={o} className="cursor-pointer">
                  <input
                    type="radio"
                    name="variant"
                    value={o}
                    disabled={gone}
                    className="peer sr-only"
                    checked={variant === o}
                    onChange={() => {
                      setVariant(o);
                      setQty((q) => Math.min(q, maxFor(o)));
                      setError('');
                    }}
                  />
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-charcoal/20 peer-checked:bg-charcoal peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold peer-disabled:cursor-not-allowed peer-disabled:line-through peer-disabled:opacity-40">
                    {o}{gone && <span className="sr-only"> (sold out)</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={`mb-3 text-sm ${out ? 'text-danger' : 'text-success'}`}>
        {out ? 'Currently sold out' : left <= 5 ? (variant ? `Only ${left} left in ${product.variants?.label.toLowerCase()} ${variant}` : 'Only a few left') : 'In stock'}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-charcoal/20">
          <button type="button" aria-label="Decrease quantity" className="h-11 w-10" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <output aria-live="polite" className="w-6 text-center">{qty}</output>
          <button type="button" aria-label="Increase quantity" className="h-11 w-10" onClick={() => setQty((q) => Math.min(max || 1, q + 1))}>+</button>
        </div>
        <button
          type="button"
          disabled={out}
          onClick={submit}
          className="rounded-full bg-charcoal px-8 py-3 text-xs uppercase tracking-widest text-ivory transition hover:bg-plum disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add to bag
        </button>
        <button
          type="button"
          aria-pressed={wished}
          onClick={() => { toggleWish(product.id); notify(wished ? 'Removed from wishlist' : 'Saved to wishlist'); }}
          className="inline-flex items-center gap-2 rounded-full border border-charcoal px-5 py-3 text-xs uppercase tracking-widest transition hover:bg-charcoal hover:text-ivory"
        >
          <Heart on={wished} /> Wishlist
        </button>
      </div>

      {error && <p role="alert" className="mt-2 text-sm text-red-600 font-medium">{error}</p>}

      {/* Functioning Instant Buy Now button */}
      <button
        type="button"
        disabled={out}
        onClick={buyNow}
        className="mt-3 w-full rounded-full border-2 border-charcoal bg-ivory py-3.5 text-xs uppercase tracking-widest text-charcoal transition hover:bg-charcoal hover:text-ivory disabled:opacity-40"
      >
        Buy Now · Instant Checkout →
      </button>
    </div>
  );
}
