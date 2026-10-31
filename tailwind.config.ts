import type { Config } from 'tailwindcss';

// Every colour is a CSS variable (see src/app/globals.css), so one class such as `bg-ivory` or `text-charcoal/60` follows the light or dark theme.
const c = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: { extend: {
    colors: {
      ivory: c('ivory'), cream: c('cream'), champagne: c('champagne'), charcoal: c('charcoal'), gold: c('gold'), 'gold-ink': c('gold-ink'),
      sage: c('sage'), 'sage-deep': c('sage-deep'), lavender: c('lavender'), plum: c('plum'), muted: c('muted'),
      surface: c('surface'), danger: c('danger'), success: c('success'), bar: c('bar'), bone: c('bone'), deep: c('deep'), shade: c('shade'), scrim: c('scrim'),
    },
    fontFamily: { serif: ['var(--font-serif)', 'Georgia', 'serif'], sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    keyframes: { float: { '50%': { translate: '0 -14px' } }, up: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'none' } } },
    animation: { float: 'float 7s ease-in-out infinite', up: 'up .9s cubic-bezier(.2,.7,.2,1) both' },
  } },
  plugins: [],
};
export default config;
