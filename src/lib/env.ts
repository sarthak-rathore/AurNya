export const siteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
export const social = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || '',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '',
  email: process.env.NEXT_PUBLIC_EMAIL || '',
};
