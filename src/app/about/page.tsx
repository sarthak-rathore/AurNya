import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/config/site';

export const metadata: Metadata = { title: 'About', description: `${site.motto}. ${site.promise}` };

const eyebrow = 'mb-3 text-xs uppercase tracking-[.22em] text-gold-ink';
const btn = 'inline-block rounded-full px-8 py-3 text-xs uppercase tracking-[.14em] transition hover:-translate-y-0.5';
const solid = `${btn} bg-charcoal text-ivory hover:bg-plum`;

export default function About() {
  return (
    <>
      {/* Hero banner */}
      <section className="relative isolate overflow-hidden bg-cream py-20">
        <Image
          src="/images/aurnya-gifting-and-jewellery-elegance.png"
          alt="AurNya jewellery — gifting and elegance"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center opacity-25"
        />
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className={eyebrow}>Our story</p>
          <h1 className="font-serif text-5xl md:text-7xl">About AurNya</h1>
          <p className="mt-4 font-serif text-2xl text-plum">{site.motto}.</p>
        </div>
      </section>

      {/* Founder story */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="space-y-5">
          <p className={eyebrow}>By Shagun Tomar</p>
          <h2 className="font-serif text-4xl">Jewellery that follows you.</h2>
          <p>AurNya (by Shagun Tomar) makes versatile, modern jewellery for your kind of everyday: necklaces, rings, earrings and bracelets that are easy to wear and easy on the wallet.</p>
          <p>Our promise: <em>{site.promise}</em></p>
          <p className="text-sm text-gold-ink">Founder story, workshop details and materials sourcing: to be added by the store owner.</p>
          <Link href="/shop" className={solid}>Shop the collection</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-xl">
            <Image src="/images/aurnya-floral-gold-necklace-showcase.png" alt="AurNya floral gold necklace" fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
          </div>
          <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-3xl shadow-xl">
            <Image src="/images/aurnya-earrings-in-lavender-luxe.png" alt="AurNya earrings in lavender luxe" fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Packaging promise */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-[1.1fr_1fr]">
          <Image src="/images/packaging.jpg" alt="AurNya packaging: green box, lavender pouch and care cards" width={1200} height={800} className="rounded-3xl shadow-2xl shadow-plum/30" />
          <div>
            <p className={eyebrow}>Gift-ready packaging</p>
            <h2 className="font-serif text-4xl">Unbox a feeling.</h2>
            <p className="my-5 max-w-md">Every AurNya order arrives in a sage green box with a lavender pouch, a handwritten-style thank-you card and a care guide so your jewellery stays beautiful.</p>
            <Link href="/collection/gifts" className={solid}>Shop the gift edit</Link>
          </div>
        </div>
      </section>

      {/* Jewellery showcase strip */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <p className={`${eyebrow} text-center`}>Our craft</p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { src: '/images/aurnya-botanical-ring-showcase.png', alt: 'AurNya botanical ring showcase' },
              { src: '/images/aurnya-gold-and-pearl-bracelet-showcase.png', alt: 'AurNya gold and pearl bracelet' },
              { src: '/images/aurnya-gold-jhumkas-in-bloom.png', alt: 'AurNya gold jhumkas in bloom' },
              { src: '/images/lavender-gemstone-rings-in-bloom.png', alt: 'Lavender gemstone rings in bloom' },
            ].map((img) => (
              <div key={img.src} className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                <Image src={img.src} alt={img.alt} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition duration-500 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
