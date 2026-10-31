// Calm placeholder shapes shown while a page is loading. Pulse stops for people who prefer reduced motion.
const pulse = 'animate-pulse motion-reduce:animate-none bg-gradient-to-br from-cream to-sage/60';
const Bar = ({ w }: { w: string }) => <div className={`h-4 rounded-full ${pulse}`} style={{ width: w }} />;

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}><div className={`aspect-[4/5] rounded-2xl ${pulse}`} /><div className="mt-3 space-y-2"><Bar w="70%" /><Bar w="40%" /><Bar w="30%" /></div></li>
      ))}
    </ul>
  );
}

export function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-10" role="status" aria-label="Loading products">
      <span className="sr-only">Loading products…</span>
      <div className="mb-8 space-y-3"><Bar w="30%" /><div className={`h-12 w-2/3 rounded-full md:w-1/3 ${pulse}`} /></div>
      <div className="grid gap-10 md:grid-cols-[230px_1fr]">
        <div className="hidden space-y-4 md:block" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <Bar key={i} w={`${90 - i * 8}%`} />)}</div>
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-10" role="status" aria-label="Loading product">
      <span className="sr-only">Loading product…</span>
      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]" aria-hidden="true">
        <div className={`aspect-square rounded-3xl ${pulse}`} />
        <div className="space-y-4"><Bar w="25%" /><div className={`h-12 w-4/5 rounded-full ${pulse}`} /><Bar w="20%" /><Bar w="90%" /><Bar w="75%" /><div className={`mt-6 h-12 w-full rounded-full ${pulse}`} /></div>
      </div>
    </div>
  );
}
