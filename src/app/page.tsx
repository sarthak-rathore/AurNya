import Image from 'next/image';
import Link from 'next/link';
import { budgets, site } from '@/config/site';
import { catalog } from '@/lib/catalog';
import { ProductCard, ProductGrid } from '@/components/product-card';
import { HeroCarousel, type Slide } from '@/components/hero-carousel';
import { Rail } from '@/components/rail';
import { Reveal } from '@/components/reveal';
import { ShowcaseArt, type ArtKind } from '@/components/showcase-art';
import { social } from '@/lib/env';
import { getHeroImages } from '@/lib/get-hero-images';
import { NewsletterForm } from '@/components/newsletter-form';
import { isDemoMode } from '@/lib/demo-mode';

const eyebrow = 'mb-3 text-xs uppercase tracking-[.22em] text-gold-ink';
const btn = 'inline-block rounded-full px-8 py-3 text-xs uppercase tracking-[.14em] transition hover:-translate-y-0.5';
const solid = `${btn} bg-charcoal text-ivory hover:bg-plum`;
const outline = `${btn} border border-charcoal hover:bg-charcoal hover:text-ivory`;

const Section = ({ title, sub, children, tint = false, action }: { title: string; sub?: string; children: React.ReactNode; tint?: boolean; action?: React.ReactNode }) => (
  <section className={`py-16 md:py-20 ${tint ? 'bg-cream' : ''}`}><Reveal className="mx-auto max-w-7xl px-6">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 md:mb-10"><div><h2 className="font-serif text-4xl md:text-5xl">{title}</h2>{sub && <p className="mt-2 text-muted">{sub}</p>}</div>{action}</div>{children}</Reveal></section>
);
const ViewAll = ({ href, label }: { href: string; label: string }) => <Link href={href} className="text-xs uppercase tracking-[.14em] underline underline-offset-4 hover:text-gold-ink">{label} →</Link>;

// One slide: words on the left, a big drawn illustration on the right (hidden on phones to keep the words front and centre).
function SlideFrame({ tone, kicker, title, text, art, ctas, h = 'h2' }: { tone: string; kicker: string; title: React.ReactNode; text: string; art: React.ReactNode; ctas: React.ReactNode; h?: 'h1' | 'h2' }) {
  const H = h;
  return (
    <div className={`h-full bg-gradient-to-br ${tone}`}><div className="mx-auto grid h-full max-w-7xl items-center gap-6 px-6 pb-24 pt-10 md:grid-cols-2">
      <div className="max-w-lg"><p className={eyebrow}>{kicker}</p><H className="font-serif text-6xl leading-none md:text-8xl">{title}</H><p className="my-6 text-lg">{text}</p><div className="flex flex-wrap gap-3">{ctas}</div></div>
      <div className="hidden place-items-center md:grid">{art}</div></div></div>
  );
}

const promises = [
  { t: 'Versatile everyday pieces', d: 'Easy to wear, easy to mix', icon: 'M4 12h16M12 4v16M6.5 6.5l11 11M17.5 6.5l-11 11' },
  { t: 'Youth-friendly pricing', d: 'Priced for real budgets', icon: 'M6 8h12M6 12h12M10 8c4 0 4 8 0 8M8 16l8 0' },
  { t: 'Gift-ready packaging', d: 'Box, pouch and care card', icon: 'M4 10h16v10H4zM3 6h18v4H3zM12 6v14M12 6c-3-4-7-2-5 0M12 6c3-4 7-2 5 0' },
  { t: site.motto, d: site.tagline, icon: 'M12 3l2.5 6 6.5.5-5 4.300 1.600 6.400L12 16.500 6.400 20.200 8 13.800 3 9.500 9.500 9z' },
];

export const revalidate = 60;   // picks up catalogue edits within a minute
export default async function Home() {
  const [all, fresh, heroImgs] = await Promise.all([catalog.all(), catalog.featured('new'), getHeroImages()]);
  const showingDemo = isDemoMode() && all.some((p) => p.sku.startsWith('DEMO-') || p.id <= 10);
  const arts: ArtKind[] = ['Necklaces', 'Rings', 'Earrings', 'Bracelets'];

  // Helper: pick the right demo image for a collection slug
  const colImg = (slug: string) =>
    slug === 'everyday' ? heroImgs.col_everyday
    : slug === 'statement' ? heroImgs.col_statement
    : slug === 'gifts' ? heroImgs.col_gifts
    : '';
  const colArtKind = (slug: string): ArtKind =>
    slug === 'gifts' ? 'Gift' : slug === 'statement' ? 'Necklaces' : 'Earrings';

  // Slides are built inside Home() so they can reference heroImgs
  const slides: Slide[] = [
    { id: 'rules', label: 'Adorn your own rules', content: (
      <div className="relative h-full">
        <Image src="/images/packaging.jpg" alt="AurNya gift box, velvet pouch, thank-you card and care card" fill priority fetchPriority="high" sizes="100vw" className="object-cover object-[65%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/95 via-ivory/80 to-ivory/40 md:bg-gradient-to-r md:from-ivory md:via-ivory/95 md:to-transparent md:to-70%" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 pb-16"><div className="max-w-lg animate-up">
          <p className={eyebrow}>AurNya · Jewellery</p>
          <h1 className="font-serif text-6xl leading-none md:text-8xl">Adorn your<br />own rules.</h1>
          <p className="my-6 text-lg">{site.promise} Modern pieces to stack, mix and make yours.</p>
          <div className="flex flex-wrap gap-3"><Link href="/shop" className={solid}>Shop all</Link><Link href="/shop?tag=new" className={outline}>New arrivals</Link></div>
        </div></div>
        <Image src="/images/logo.png" alt="" width={170} height={170} className="absolute bottom-[12%] left-[38%] z-10 hidden animate-float rounded-full shadow-2xl shadow-plum/40 [transform:perspective(600px)_rotateY(-14deg)_rotateX(6deg)] md:block" />
      </div>) },
    { id: 'rings', label: 'Stack. Mix. Repeat.', content: (
      <SlideFrame tone="from-lavender/35 via-cream to-ivory" kicker="Rings" title={<>Stack. Mix.<br />Repeat.</>} text="Slim bands and statement stones, made to be worn together."
        art={heroImgs.slide_rings_art
          ? <div className="relative w-[min(30rem,90%)] aspect-square drop-shadow-xl"><Image src={heroImgs.slide_rings_art} alt="AurNya rings collection" fill sizes="(max-width:768px) 90vw, 30rem" className="object-contain" /></div>
          : <ShowcaseArt kind="Rings" uid="hero-rings" className="w-[min(30rem,90%)] drop-shadow-xl" />}
        ctas={<><Link href="/category/rings" className={solid}>Shop rings</Link><Link href="/shop?price=0-49999" className={outline}>Under ₹500</Link></>} />) },
    { id: 'gifts', label: 'The Gift Edit', content: (
      <SlideFrame tone="from-sage via-cream to-ivory" kicker="The Gift Edit" title={<>Unbox your<br />kind of everyday.</>} text="Every piece is designed to arrive in a sage green box with a lavender pouch, thank-you card and care guide."
        art={heroImgs.slide_gifts_art
          ? <div className="relative w-[min(26rem,85%)] aspect-square drop-shadow-xl"><Image src={heroImgs.slide_gifts_art} alt="AurNya gift set" fill sizes="(max-width:768px) 85vw, 26rem" className="object-contain" /></div>
          : <ShowcaseArt kind="Gift" uid="hero-gift" className="w-[min(26rem,85%)] drop-shadow-xl" />}
        ctas={<Link href="/collection/gifts" className={solid}>Shop the gift edit</Link>} />) },
  ];

  return (
    <>
      <HeroCarousel slides={slides} />
      <section aria-label="Why AurNya" className="border-b border-charcoal/10 bg-surface"><ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 px-6 py-6 md:grid-cols-4">{promises.map((p) => (
        <li key={p.t} className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage text-charcoal"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.icon} /></svg></span><span className="text-sm leading-tight"><span className="block font-medium">{p.t}</span><span className="text-muted">{p.d}</span></span></li>))}</ul></section>
      <Section title="Shop by category" sub="Find your piece"><div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{site.categories.map((c, i) => (
        <Link key={c} href={`/category/${c.toLowerCase()}`} className="group overflow-hidden rounded-3xl border border-charcoal/10 bg-gradient-to-br from-cream to-sage p-4 text-center transition duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-shade/20 md:p-6">
          <ShowcaseArt kind={arts[i]} uid={`cat-${c}`} className="mx-auto w-4/5 transition duration-500 group-hover:scale-105" /><span className="mt-2 block font-serif text-2xl md:text-3xl">{c}</span><span className="text-xs uppercase tracking-[.14em] text-gold-ink">Shop now →</span></Link>))}</div></Section>
      <Section title="Shop by budget" sub="Pieces for every pocket" tint><div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{budgets.map((b) => (
        <Link key={b.price} href={`/shop?price=${b.price}`} className="group rounded-3xl border border-charcoal/10 bg-ivory px-6 py-8 text-center transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-shade/15"><span className="block font-serif text-3xl md:text-4xl">{b.label}</span><span className="mt-2 inline-block text-xs uppercase tracking-[.14em] text-gold-ink group-hover:underline">Shop now →</span></Link>))}</div></Section>
      <Section title="Everyday favourites" sub={showingDemo ? 'Sample picks (demo data)' : 'Our picks for you'} action={<ViewAll href="/shop" label="View all" />}><Rail label="Everyday favourites" items={all.slice(0, 12).map((p) => <ProductCard key={p.id} product={p} />)} /></Section>
      <section className="pb-16 md:pb-20"><Reveal className="mx-auto max-w-7xl px-6"><h2 className="sr-only">Featured</h2><div className="grid gap-5 md:grid-cols-2">
        {/* The Gift Edit promo card — uses real photo instead of packaging.jpg */}
        <Link href="/collection/gifts" className="group relative isolate flex min-h-[340px] items-end overflow-hidden rounded-3xl p-8 md:p-10">
          <Image src={heroImgs.promo_gift_bg || '/images/packaging.jpg'} alt="" fill sizes="(max-width:768px) 100vw, 50vw" className="-z-20 object-cover transition duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ivory via-ivory/70 to-transparent" />
          <span><span className={eyebrow + ' block'}>Gifting</span><h3 className="font-serif text-4xl md:text-5xl">The Gift Edit</h3><span className="mt-2 block text-muted">Boxed with pouch and care card.</span><span className={`${solid} mt-5`}>Shop gifts</span></span>
        </Link>
        {/* Stack it your way promo card — real photo as art overlay */}
        <Link href="/category/rings" className="group relative isolate flex min-h-[340px] items-end overflow-hidden rounded-3xl bg-gradient-to-br from-lavender/35 via-cream to-sage p-8 md:p-10">
          {heroImgs.promo_rings_art
            ? <div className="absolute -right-6 top-4 -z-10 w-64 transition duration-700 group-hover:scale-105 md:w-80"><div className="relative aspect-square w-full"><Image src={heroImgs.promo_rings_art} alt="AurNya rings" fill sizes="(max-width:768px) 16rem, 20rem" className="object-contain drop-shadow-xl" /></div></div>
            : <ShowcaseArt kind="Rings" uid="promo-rings" className="absolute -right-6 top-4 -z-10 w-64 transition duration-700 group-hover:scale-105 md:w-80" />}
          <span><span className={eyebrow + ' block'}>Rings</span><h3 className="font-serif text-4xl md:text-5xl">Stack it your way</h3><span className="mt-2 block text-muted">Slim bands, statement stones.</span><span className={`${outline} mt-5`}>Shop rings</span></span>
        </Link>
      </div></Reveal></section>
      {/* Collections — real photos replace ShowcaseArt per card */}
      <Section title="Collections" sub="Curated edits" tint><div className="grid gap-5 md:grid-cols-3">{site.collections.map((c) => {
        const img = colImg(c.slug);
        const artKind = colArtKind(c.slug);
        return (
          <Link key={c.slug} href={`/collection/${c.slug}`} className="group overflow-hidden rounded-3xl border border-charcoal/10 bg-ivory transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-shade/15">
            <span className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-gradient-to-br from-cream via-sage/60 to-lavender/30">
              {img
                ? <Image src={img} alt={c.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                : <ShowcaseArt kind={artKind} uid={`col-${c.slug}`} className="h-4/5 transition duration-500 group-hover:scale-105" />}
            </span>
            <span className="block p-6"><h3 className="font-serif text-3xl">{c.name}</h3><span className="my-1 block text-muted">{c.blurb}</span><span className="text-xs uppercase tracking-[.14em] text-gold-ink">Explore →</span></span>
          </Link>
        );
      })}</div></Section>
      <Section title="New arrivals" sub={showingDemo ? 'Just in (demo data)' : 'Just in'} action={<ViewAll href="/shop?tag=new" label="See all new" />}><ProductGrid items={fresh} /></Section>
      <section className="bg-cream py-16 md:py-20"><Reveal className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-[1.1fr_1fr]">
        <Image src="/images/packaging.jpg" alt="AurNya packaging: green box, lavender pouch and care cards" width={1200} height={800} className="rounded-3xl shadow-2xl shadow-plum/30" />
        <div><p className={eyebrow}>Our story</p><h2 className="font-serif text-5xl">{site.motto}.</h2><p className="my-5 max-w-md">AurNya, by Shagun Tomar, is jewellery that follows you, not the other way round. Light, modern and made for the way you really dress, from class to celebration.</p><Link href="/about" className={solid}>Read our story</Link></div></Reveal></section>
      {social.instagram && <section className="bg-cream py-16 text-center"><Reveal className="mx-auto max-w-xl px-6"><h2 className="font-serif text-4xl">Join the community</h2><p className="my-3 text-muted">Share how you wear AurNya and see how others make it theirs.</p><a href={social.instagram} target="_blank" rel="noopener noreferrer" className={`${btn} border border-charcoal hover:bg-charcoal hover:text-ivory`}>Follow on Instagram</a></Reveal></section>}
      <section className="py-20 text-center"><h2 className="font-serif text-4xl">Join the AurNya list</h2><p className="mt-2 text-muted">Subscribe for private sales, jewellery styling notes, and first access to new edits.</p><div className="mt-6"><NewsletterForm /></div></section>
    </>
  );
}
