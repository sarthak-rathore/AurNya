import type { Category } from '@/lib/types';

// Larger DRAWN illustrations for the hero, category tiles, menus and banners.
// They are decorative artwork (hidden from screen readers), NOT product photos, and never appear as a product's picture.
// `uid` keeps the gradient ids unique when several illustrations share a page.
export type ArtKind = Category | 'Gift';

const spark = (x: number, y: number, s: number) => <path key={`${x}-${y}`} d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}z`} fill="#FFF3CF" />;

export function ShowcaseArt({ kind, uid, className = '' }: { kind: ArtKind; uid: string; className?: string }) {
  const gold = `${uid}-gold`, gem = `${uid}-gem`, pearl = `${uid}-pearl`, silk = `${uid}-silk`;
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F1D58F" /><stop offset=".5" stopColor="#C99A3D" /><stop offset="1" stopColor="#8A5F17" /></linearGradient>
        <linearGradient id={gem} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E3D5F5" /><stop offset=".55" stopColor="#B89AE0" /><stop offset="1" stopColor="#7C5AB0" /></linearGradient>
        <radialGradient id={pearl} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#FFFFFF" /><stop offset=".6" stopColor="#F6EBD9" /><stop offset="1" stopColor="#D9C7A8" /></radialGradient>
        <linearGradient id={silk} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C9B3EA" /><stop offset="1" stopColor="#9577C6" /></linearGradient>
      </defs>
      {kind === 'Necklaces' && (<g>
        <path d="M34 48Q120 214 206 48" fill="none" stroke={`url(#${gold})`} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M34 48Q120 214 206 48" fill="none" stroke="#FFF3CF" strokeWidth="1" strokeDasharray="1 7" strokeLinecap="round" />
        <circle cx="120" cy="132" r="5" fill="none" stroke={`url(#${gold})`} strokeWidth="3" />
        <path d="M120 140C145 164 145 190 120 210C95 190 95 164 120 140z" fill={`url(#${gem})`} stroke={`url(#${gold})`} strokeWidth="4" strokeLinejoin="round" />
        <path d="M120 150C132 166 132 180 120 194" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
        {spark(62, 118, 9)}{spark(188, 96, 7)}</g>)}
      {kind === 'Rings' && (<g>
        <ellipse cx="96" cy="152" rx="50" ry="54" fill="none" stroke={`url(#${gold})`} strokeWidth="11" />
        <ellipse cx="150" cy="164" rx="38" ry="42" fill="none" stroke={`url(#${gold})`} strokeWidth="8" />
        <path d="M96 84l22-30-22-24-22 24z" fill={`url(#${gem})`} stroke={`url(#${gold})`} strokeWidth="4" strokeLinejoin="round" />
        <path d="M74 54h44M96 30v24" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
        {spark(190, 98, 10)}{spark(48, 70, 7)}</g>)}
      {kind === 'Earrings' && (<g>
        {[70, 170].map((x) => (<g key={x}>
          <path d={`M${x} 34v30`} stroke={`url(#${gold})`} strokeWidth="3" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={x} cy="74" rx="9" ry="15" fill={`url(#${gem})`} stroke={`url(#${gold})`} strokeWidth="2" transform={`rotate(${a} ${x} 88)`} />)}
          <circle cx={x} cy="88" r="7" fill={`url(#${gold})`} />
          <path d={`M${x} 104v26`} stroke={`url(#${gold})`} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={x} cy="150" r="20" fill={`url(#${pearl})`} stroke="#D9C7A8" /></g>))}
        {spark(120, 70, 9)}{spark(120, 176, 7)}</g>)}
      {kind === 'Bracelets' && (<g>
        <ellipse cx="120" cy="124" rx="76" ry="66" fill="none" stroke={`url(#${gold})`} strokeWidth="9" />
        <ellipse cx="120" cy="124" rx="66" ry="56" fill="none" stroke="#FFF3CF" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="2 8" />
        <circle cx="120" cy="196" r="7" fill="none" stroke={`url(#${gold})`} strokeWidth="3" />
        <path d="M120 203l13 14-13 16-13-16z" fill={`url(#${gem})`} stroke={`url(#${gold})`} strokeWidth="3.5" strokeLinejoin="round" />
        {spark(46, 62, 9)}{spark(198, 70, 7)}</g>)}
      {kind === 'Gift' && (<g>
        <rect x="52" y="104" width="136" height="100" rx="8" fill="#DDE5C0" stroke="#A9C98A" strokeWidth="3" />
        <rect x="44" y="84" width="152" height="30" rx="8" fill="#C9D9A5" stroke="#A9C98A" strokeWidth="3" />
        <rect x="108" y="84" width="24" height="120" fill={`url(#${silk})`} />
        <path d="M120 84C96 40 58 56 82 80C92 90 112 88 120 84zM120 84C144 40 182 56 158 80C148 90 128 88 120 84z" fill={`url(#${silk})`} stroke="#7C5AB0" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="120" cy="84" r="9" fill={`url(#${gold})`} />
        {spark(40, 60, 10)}{spark(204, 50, 8)}{spark(210, 150, 7)}</g>)}
    </svg>
  );
}
