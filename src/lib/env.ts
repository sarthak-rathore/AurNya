export const siteUrl = (): string => {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  // Prevent new URL() crashes by ensuring a protocol always exists
  const url = rawUrl.trim();
  return url.startsWith("http") ? url : `https://${url}`;
};
export const social = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  email: process.env.NEXT_PUBLIC_EMAIL || "",
};
