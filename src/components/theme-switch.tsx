'use client';
import { setThemePref, useThemePref, type ThemePref } from '@/lib/theme';

const OPTIONS: [ThemePref, string][] = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']];

// Three-way choice. Real radio buttons, so arrow keys, screen readers and focus all work without extra code.
// tone="page" is for light/dark page surfaces (the phone menu); tone="footer" is for the always-dark footer.
export function ThemeSwitch({ tone = 'page' }: { tone?: 'page' | 'footer' }) {
  const pref = useThemePref();
  const frame = tone === 'footer' ? 'border-white/30' : 'border-charcoal/25';
  const idle = tone === 'footer' ? 'text-[#ece3f3]' : 'text-charcoal';
  const on = tone === 'footer' ? 'peer-checked:bg-[#ece3f3] peer-checked:text-deep' : 'peer-checked:bg-charcoal peer-checked:text-ivory';
  const ring = tone === 'footer' ? 'peer-focus-visible:outline-champagne' : 'peer-focus-visible:outline-gold';
  return (
    <fieldset>
      <legend className="sr-only">Colour theme</legend>
      <div className={`inline-flex rounded-full border p-0.5 ${frame}`}>
        {OPTIONS.map(([value, label]) => (
          <label key={value} className="relative cursor-pointer">
            <input type="radio" name={`theme-${tone}`} value={value} checked={pref === value} onChange={() => setThemePref(value)} className="peer sr-only" />
            <span className={`block rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${ring} ${idle} ${on}`}>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
