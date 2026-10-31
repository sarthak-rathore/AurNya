import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { social } from '@/lib/env';
type Props = { params: Promise<{ slug: string }> };
export const generateStaticParams = () => Object.keys(site.info).map((slug) => ({ slug }));
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const t = site.info[slug]; return t ? { title: t, alternates: { canonical: `/info/${slug}` } } : {}; }
export default async function Info({ params }: Props) {
  const { slug } = await params;
  const t = site.info[slug]; if (!t) notFound();
  const todo = <p className="text-gold-ink">This page needs your real business details and policies (see README, “Content you must provide”). It is left unwritten rather than filled with invented terms.</p>;
  const body = slug === 'tracking' ? (<div><p className="mb-4 text-muted">Order tracking switches on with orders and shipping in Phase 5.</p><form className="space-y-3"><label className="block text-sm">Order number<input disabled className="mt-1 w-full rounded-full border border-charcoal/20 bg-surface px-4 py-2 opacity-60" /></label><label className="block text-sm">Email<input disabled type="email" className="mt-1 w-full rounded-full border border-charcoal/20 bg-surface px-4 py-2 opacity-60" /></label><button disabled className="rounded-full bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-ivory opacity-50">Track order</button></form></div>)
    : slug === 'contact' ? (social.email || social.whatsapp || social.instagram ? <ul className="space-y-2">{social.email && <li><a className="underline" href={`mailto:${social.email}`}>{social.email}</a></li>}{social.whatsapp && <li><a className="underline" href={social.whatsapp} rel="noopener noreferrer">WhatsApp</a></li>}{social.instagram && <li><a className="underline" href={social.instagram} rel="noopener noreferrer">Instagram</a></li>}</ul> : <p className="text-gold-ink">Contact details appear here once you add them in the environment variables (NEXT_PUBLIC_EMAIL, NEXT_PUBLIC_WHATSAPP, NEXT_PUBLIC_INSTAGRAM).</p>)
    : slug === 'faq' ? (<div className="space-y-6"><div><h2 className="font-serif text-2xl">How do I care for my jewellery?</h2><ul className="mt-1 list-disc pl-5 text-muted">{site.care.map((c) => <li key={c}>{c}</li>)}</ul></div><div><h2 className="font-serif text-2xl">Can I order online yet?</h2><p className="mt-1 text-muted">Not yet. Online ordering opens in a later phase of this build.</p></div>{todo}</div>)
    : slug === 'care' ? <ul className="list-disc space-y-1 pl-5">{site.care.map((c) => <li key={c}>{c}</li>)}</ul> : todo;
  return (<div className="mx-auto max-w-2xl px-6 pb-20 pt-12"><h1 className="mb-4 font-serif text-5xl">{t}</h1>{body}</div>);
}
