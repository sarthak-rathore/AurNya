import { notFound } from 'next/navigation';
import { site } from '@/config/site';

// Checked here, before the loading skeleton starts streaming, so an unknown category is answered with a real 404 status.
export default async function CategoryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!site.categories.some((c) => c.toLowerCase() === slug)) notFound();
  return children;
}
