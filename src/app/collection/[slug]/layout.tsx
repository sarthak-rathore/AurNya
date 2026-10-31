import { notFound } from 'next/navigation';
import { site } from '@/config/site';

// Checked here, before the loading skeleton starts streaming, so an unknown collection is answered with a real 404 status.
export default async function CollectionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!site.collections.some((c) => c.slug === slug)) notFound();
  return children;
}
