// DEMO IMAGES — Phase 6 admin replaces these via the settings table (key: 'hero_images').
// When a 'hero_images' setting exists in the database, these static values are ignored.
// src/lib/hero-images.ts

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
    return {
      slide_rings_art: typeof r.slide_rings_art === 'string' ? r.slide_rings_art : DEMO_HERO_IMAGES.slide_rings_art,
      slide_gifts_art: typeof r.slide_gifts_art === 'string' ? r.slide_gifts_art : DEMO_HERO_IMAGES.slide_gifts_art,
      promo_gift_bg: typeof r.promo_gift_bg === 'string' ? r.promo_gift_bg : DEMO_HERO_IMAGES.promo_gift_bg,
      promo_rings_art: typeof r.promo_rings_art === 'string' ? r.promo_rings_art : DEMO_HERO_IMAGES.promo_rings_art,
      col_everyday: typeof r.col_everyday === 'string' ? r.col_everyday : DEMO_HERO_IMAGES.col_everyday,
      col_statement: typeof r.col_statement === 'string' ? r.col_statement : DEMO_HERO_IMAGES.col_statement,
      col_gifts: typeof r.col_gifts === 'string' ? r.col_gifts : DEMO_HERO_IMAGES.col_gifts,
    };
  }
  return DEMO_HERO_IMAGES;
}
