import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <h1 className="font-serif text-5xl">Page not found</h1>
      <p className="mt-2 text-muted">That page does not exist or has moved.</p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-charcoal px-8 py-3 text-xs uppercase tracking-widest text-ivory">
        Back to shop
      </Link>
    </div>
  );
}
