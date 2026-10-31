import type { Category } from '@/lib/types';
// Drawn placeholder. NOT a product photo: shown until a real image is added to the product.
export function PlaceholderArt({ category, className = '' }: { category: Category; className?: string }) {
  const g = '#B07F2A', l = '#BBA3D9';
  const pearl = (x: number, y: number, r: number) => <circle cx={x} cy={y} r={r} fill="#fffaf0" stroke="#e6dcc8" />;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={`${category} illustration`} className={className}>
      {category === 'Necklaces' && (<><path d="M30 40Q100 190 170 40" fill="none" stroke={g} strokeWidth="2" />{pearl(100, 140, 12)}</>)}
      {category === 'Rings' && (<><ellipse cx="100" cy="120" rx="40" ry="44" fill="none" stroke={g} strokeWidth="8" /><path d="M100 62l14-20-14-14-14 14z" fill={l} stroke={g} strokeWidth="2" /></>)}
      {category === 'Earrings' && [62, 138].map((x) => (<g key={x}><path d={`M${x} 40v40`} stroke={g} strokeWidth="2" />{pearl(x, 100, 16)}</g>))}
      {category === 'Bracelets' && (<><circle cx="100" cy="100" r="60" fill="none" stroke={g} strokeWidth="4" /><circle cx="100" cy="40" r="8" fill={l} stroke={g} strokeWidth="2" /></>)}
    </svg>
  );
}
