'use client';
import { useEffect } from 'react';
import Link from 'next/link';

// Shown when something unexpected breaks while a page is being built. Keeps the header and footer in place.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center" role="alert">
      {/* An error screen must never be saved by search engines as if it were the real page. */}
      <meta name="robots" content="noindex" />
      <h1 className="font-serif text-5xl">Something went wrong</h1>
      <p className="mt-3 text-muted">We couldn’t load this page. It’s not you. Please try again, or head back to the shop.</p>
      {error.digest && <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-charcoal px-8 py-3 text-xs uppercase tracking-widest text-ivory">Try again</button>
        <Link href="/shop" className="rounded-full border border-charcoal px-8 py-3 text-xs uppercase tracking-widest">Back to shop</Link>
      </div>
    </div>
  );
}
