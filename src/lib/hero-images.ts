// DEMO IMAGES — Phase 6 admin replaces these via the settings table (key: 'hero_images').
// When a 'hero_images' setting exists in the database, these static values are ignored.
// src/lib/hero-images.ts
import { isAllowedImageUrl } from './image-url';

export interface HeroImageConfig {
  /** Hero slide 2 (rings/stack-mix-repeat): art panel image */
  slide_rings_art: string;
  /** Hero slide 3 (gift edit): art panel image */
  slide_gifts_art: string;
  /** Promo card: "The Gift Edit" large card background */
  promo_gift_bg: string;
  /** Promo card: "Stack it your way" rings card - art overlay */
  promo_rings_art: string;
  /** Collection card: Everyday Essentials */
  col_everyday: string;
  /** Collection card: Statement Pieces */
  col_statement: string;
  /** Collection card: The Gift Edit */
  col_gifts: string;
}

export const DEMO_HERO_IMAGES: HeroImageConfig = {
  slide_rings_art: '/images/aurnya-floral-gold-ring-showcase.png',
  slide_gifts_art: '/images/aurnya-floral-gold-jewellery-gift-set.png',
  promo_gift_bg: '/images/aurnya-gifting-and-jewellery-elegance.png',
  promo_rings_art: '/images/aurnya-botanical-ring-showcase.png',
  col_everyday: '/images/aurnya-gold-earrings-display.png',
  col_statement: '/images/aurnya-floral-gold-necklace-showcase.png',
  col_gifts: '/images/aurnya-luxury-necklace-gift-set.png',
};

/** Phase 6: reads from DB settings table key 'hero_images', falls back to demo config */
export function parseHeroImages(raw: unknown): HeroImageConfig {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    // '' means "show the drawn illustration instead of a photo". Anything that is not a safe picture address falls back to the default.
    const pick = (k: keyof HeroImageConfig): string => { const v = r[k]; return typeof v === 'string' && (v === '' || isAllowedImageUrl(v)) ? v : DEMO_HERO_IMAGES[k]; };
    return {
      slide_rings_art: pick('slide_rings_art'), slide_gifts_art: pick('slide_gifts_art'), promo_gift_bg: pick('promo_gift_bg'), promo_rings_art: pick('promo_rings_art'),
      col_everyday: pick('col_everyday'), col_statement: pick('col_statement'), col_gifts: pick('col_gifts'),
    };
  }
  return DEMO_HERO_IMAGES;
}
