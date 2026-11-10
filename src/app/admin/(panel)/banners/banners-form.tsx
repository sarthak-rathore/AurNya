'use client';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { PictureAdder, Thumb } from '@/components/admin/image-picker';
import { Card, btnOutline, btnPrimary, input, label } from '@/components/admin/ui';
import { useAction } from '@/components/admin/use-action';
import { DEMO_HERO_IMAGES, type HeroImageConfig } from '@/lib/hero-images';

interface Ann {
  visible: boolean;
  message: string;
  href: string;
  linkText: string;
  start: string;
  end: string;
}

const SLOTS: { key: keyof HeroImageConfig; title: string; where: string }[] = [
  { key: 'slide_rings_art', title: 'Rings slide', where: 'Home page slideshow, slide 2 (“Stack. Mix. Repeat.”)' },
  { key: 'slide_gifts_art', title: 'Gift slide', where: 'Home page slideshow, slide 3 (“Unbox your kind of everyday”)' },
  { key: 'promo_gift_bg', title: 'Gift Edit card', where: 'Large card under the product rail (background picture)' },
  { key: 'promo_rings_art', title: 'Stack it your way card', where: 'Second large card (rings picture)' },
  { key: 'col_everyday', title: 'Everyday Essentials', where: 'Collections row, first card' },
  { key: 'col_statement', title: 'Statement Pieces', where: 'Collections row, second card' },
  { key: 'col_gifts', title: 'The Gift Edit', where: 'Collections row, third card' },
];

export function BannersForm({
  announcement,
  pictures,
}: {
  announcement: Ann;
  pictures: HeroImageConfig;
}) {
  const a1 = useAction();
  const a2 = useAction();
  const [a, setA] = useState(announcement);
  const [p, setP] = useState(pictures);
  const setAnn = <K extends keyof Ann>(k: K, v: Ann[K]) => setA((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-6">
      <Card title="Announcement bar">
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              a1.run(
                () =>
                  adminFetch('/api/admin/announcement', 'PUT', {
                    ...a,
                    start: a.start || null,
                    end: a.end || null,
                  }),
                'Saved. The bar is updated ✓'
              );
            }}
          >
            <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={a.visible}
                onChange={(e) => setAnn('visible', e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#121018] text-[#D4A843] focus:ring-[#D4A843]"
              />
              <span>Show the announcement bar on shopfront</span>
            </label>

            <div>
              <label htmlFor="msg" className={label}>
                Message ({a.message.length}/200)
              </label>
              <input
                id="msg"
                maxLength={200}
                value={a.message}
                onChange={(e) => setAnn('message', e.target.value)}
                className={input}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lt" className={label}>
                  Link words
                </label>
                <input
                  id="lt"
                  maxLength={40}
                  value={a.linkText}
                  onChange={(e) => setAnn('linkText', e.target.value)}
                  className={input}
                  placeholder="Shop now"
                />
              </div>
              <div>
                <label htmlFor="href" className={label}>
                  Link to
                </label>
                <input
                  id="href"
                  value={a.href}
                  onChange={(e) => setAnn('href', e.target.value)}
                  className={input}
                  placeholder="/shop or https://…"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="s" className={label}>
                  Show from (IST)
                </label>
                <input
                  id="s"
                  type="datetime-local"
                  value={a.start}
                  onChange={(e) => setAnn('start', e.target.value)}
                  className={input}
                />
              </div>
              <div>
                <label htmlFor="e" className={label}>
                  Hide after (IST)
                </label>
                <input
                  id="e"
                  type="datetime-local"
                  value={a.end}
                  onChange={(e) => setAnn('end', e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={a1.busy} className={btnPrimary}>
                {a1.busy ? 'Saving…' : 'Save announcement'}
              </button>
              {a1.message}
            </div>
            <p className="text-xs text-[#8E869B]">
              Leave the dates empty to show it all the time. Changes appear on the shop within seconds.
            </p>
          </form>

          <div>
            <p className={label}>Live Preview</p>
            {a.visible && a.message ? (
              <div className="rounded-xl border border-white/10 bg-[#121018] px-4 py-3 text-center text-xs tracking-wider text-white">
                {a.message}
                {a.href && a.linkText && (
                  <span className="ml-2 text-[#D4A843] underline font-semibold">{a.linkText}</span>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-4 text-xs text-[#8E869B]">
                The bar is switched off or has no message, so nothing shows.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Home page pictures">
        <p className="mb-4 text-xs text-[#8E869B]">
          Square pictures with a plain or transparent background work best. &quot;Use drawing&quot; shows the built-in illustration instead of a photo; &quot;Reset&quot; brings back the original picture.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {SLOTS.map((s) => (
            <div key={s.key} className="rounded-xl border border-white/10 bg-[#121018] p-3.5 space-y-2">
              <div className="flex gap-3">
                <Thumb src={p[s.key]} size={80} alt={s.title} />
                <div>
                  <p className="font-semibold text-white text-xs">{s.title}</p>
                  <p className="text-[11px] text-[#8E869B] mt-0.5">{s.where}</p>
                  {!p[s.key] && (
                    <p className="text-[10px] text-[#D4A843] font-semibold mt-1">Showing built-in illustration</p>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <PictureAdder
                  label={`Change ${s.title}`}
                  onPick={(url) => setP((x) => ({ ...x, [s.key]: url }))}
                />
              </div>
              <div className="flex gap-3 text-xs pt-1">
                <button
                  type="button"
                  className="text-xs text-[#8E869B] hover:text-white underline"
                  onClick={() => setP((x) => ({ ...x, [s.key]: '' }))}
                >
                  Use drawing
                </button>
                <button
                  type="button"
                  className="text-xs text-[#D4A843] hover:underline"
                  onClick={() => setP((x) => ({ ...x, [s.key]: DEMO_HERO_IMAGES[s.key] }))}
                >
                  Reset to original
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={a2.busy}
            className={btnPrimary}
            onClick={() =>
              a2.run(
                () => adminFetch('/api/admin/banners', 'PUT', p),
                'Saved. The home page is updated ✓'
              )
            }
          >
            {a2.busy ? 'Saving…' : 'Save home page pictures'}
          </button>
          <button type="button" className={btnOutline} onClick={() => setP(pictures)}>
            Discard changes
          </button>
          {a2.message}
        </div>
      </Card>
    </div>
  );
}
