// ONE place for brand copy, navigation, announcement and info pages.
// The announcement below is the default. With a database, the 'announcement' setting overrides it (Phase 6 adds the admin screen for that).
export const site = {
  name: 'AurNya', tagline: 'Adorn Your Own Rules', motto: 'Your identity is yours to wear',
  promise: 'Versatile jewellery. Your kind of everyday.',
  description: 'AurNya: versatile, modern jewellery for your kind of everyday. Necklaces, rings, earrings and bracelets.',
  announcement: { visible: true, message: 'Complimentary gift-ready packaging on all orders · Free shipping over ₹999', href: '/shop', linkText: 'Shop the collection', start: null as string | null, end: null as string | null },
  categories: ['Necklaces', 'Rings', 'Earrings', 'Bracelets'] as const,
  collections: [
    { slug: 'everyday', name: 'Everyday Essentials', blurb: 'Light pieces for every day.' },
    { slug: 'statement', name: 'Statement Pieces', blurb: 'Turn one piece into the look.' },
    { slug: 'gifts', name: 'The Gift Edit', blurb: 'Boxed with pouch and care card.' },
  ],
  care: ['Keep away from water', 'Store in pouch', 'Avoid harsh chemicals', 'Clean with soft cloth'],
  info: {
    faq: 'Help & FAQs',
    shipping: 'Shipping',
    returns: 'Returns & Refunds',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    care: 'Jewellery Care',
    tracking: 'Track Order',
    contact: 'Contact',
    'delivery-information': 'Delivery Information',
    'international-shipping': 'International Shipping',
    'payment-options': 'Payment Options',
    'track-your-order': 'Track Your Order',
    'returns-exchanges': 'Returns & Exchanges',
    'find-a-boutique': 'Find a Boutique',
    'exercise-your-rights': 'Exercise Your Rights',
    'cyber-security-policy': 'Cyber Security Policy',
    'terms-and-conditions': 'Terms & Conditions',
    'privacy-notice': 'Privacy Notice',
    'disclaimer': 'Disclaimer',
    'cookie-policy': 'Cookie Policy',
    'cookie-settings': 'Cookie Settings',
    'offers-contests': 'Offers & Contest Details',
    'blog': 'Blog & Stories',
  } as Record<string, string>,
};
export const mainNav = [
  { label: 'Home', href: '/' }, { label: 'Shop All', href: '/shop' }, { label: 'New Arrivals', href: '/shop?tag=new' },
  { label: 'Bestsellers', href: '/shop?tag=bestseller' }, { label: 'Categories', href: '/shop', mega: 'categories' as const },
  { label: 'Collections', href: '/shop', mega: 'collections' as const }, { label: 'Gifts', href: '/collection/gifts' }, { label: 'About', href: '/about' },
];

// "Shop by budget" bands, in paise, used by the home page tiles, the mega menu, the footer and the Price filter.
// Each band ends one paisa below the next one starts, so a piece never appears in two bands.
export const budgets = [
  { label: 'Under ₹500', price: '0-49999' },
  { label: '₹500 – ₹799', price: '50000-79999' },
  { label: '₹800 – ₹999', price: '80000-99999' },
  { label: '₹1,000 & above', price: '100000-100000000' },
] as const;
