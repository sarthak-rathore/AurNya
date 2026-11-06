'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { PictureAdder, Thumb } from '@/components/admin/image-picker';
import { Card, btnDanger, btnOutline, btnPrimary, input, label } from '@/components/admin/ui';
import { useAction } from '@/components/admin/use-action';
import { slugify } from '@/lib/admin-format';

export interface VariantRow { value: string; stock: string; sku: string; existing: boolean }
export interface FormState {
  name: string; slug: string; sku: string; category: string; short: string; description: string; price: string; comparePrice: string; stock: string;
  tags: string[]; material: string; dimensions: string; weight: string; images: { src: string; alt: string }[]; video: string; seoTitle: string; seoDescription: string;
  status: 'draft' | 'active' | 'archived'; collections: string[]; hasVariants: boolean; variantLabel: string; variants: VariantRow[];
}
export const emptyForm = (category: string): FormState => ({ name: '', slug: '', sku: '', category, short: '', description: '', price: '', comparePrice: '', stock: '0', tags: [], material: '', dimensions: '', weight: '', images: [], video: '', seoTitle: '', seoDescription: '', status: 'draft', collections: [], hasVariants: false, variantLabel: 'Size', variants: [] });

interface Props { id?: number; initial: FormState; categories: string[]; collections: { slug: string; name: string }[]; storefrontSlug?: string }

export function ProductForm({ id, initial, categories, collections, storefrontSlug }: Props) {
  const router = useRouter(); const save = useAction(); const del = useAction();
  const [f, setF] = useState<FormState>(initial); const [slugTouched, setSlugTouched] = useState(id !== undefined);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const editing = id !== undefined;
  const toggle = (k: 'tags' | 'collections', v: string) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  const setVariant = (i: number, patch: Partial<VariantRow>) => set('variants', f.variants.map((v, n) => (n === i ? { ...v, ...patch } : v)));
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= f.images.length) return; const a = [...f.images]; [a[i], a[j]] = [a[j], a[i]]; set('images', a); };

  const payload = () => ({
    name: f.name, slug: f.slug, sku: f.sku, category: f.category, short: f.short, description: f.description, price: f.price, comparePrice: f.comparePrice,
    stock: Number(f.stock || 0), tags: f.tags, material: f.material, dimensions: f.dimensions, weight: f.weight, images: f.images, video: f.video, seoTitle: f.seoTitle, seoDescription: f.seoDescription,
    status: f.status, collections: f.collections,
    variants: f.hasVariants ? { label: f.variantLabel, options: f.variants.map((v) => ({ value: v.value.trim(), stock: Number(v.stock || 0), sku: v.sku.trim() || null })) } : null,
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await save.run(async () => {
      const res = await adminFetch<{ id?: number }>(editing ? `/api/admin/products/${id}` : '/api/admin/products', editing ? 'PUT' : 'POST', payload());
      if (res.ok && !editing && res.data.id) router.replace(`/admin/products/${res.data.id}?created=1`);
      return res;
    }, editing ? 'Saved. The shop is updated ✓' : 'Created ✓');
    if (r && editing) router.refresh();
  }
  async function remove() {
    if (!window.confirm(`Delete “${f.name}” permanently? Orders already placed keep their own copy of the details. (To just hide it, set it to Archived instead.)`)) return;
    if (await del.run(() => adminFetch(`/api/admin/products/${id}`, 'DELETE'), 'Deleted')) router.replace('/admin/products');
  }
  const counter = (v: string, max: number) => <span className={`text-xs ${v.length > max ? 'text-danger' : 'text-muted'}`}>{v.length}/{max}</span>;

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <Card title="Basics">
          <div className="space-y-4">
            <div><label htmlFor="name" className={label}>Name *</label><input id="name" required maxLength={120} value={f.name} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} className={input} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="sku" className={label}>SKU *</label><input id="sku" required maxLength={40} value={f.sku} onChange={(e) => set('sku', e.target.value)} className={input} placeholder="AUR-RING-001" /></div>
              <div><label htmlFor="cat" className={label}>Category *</label><select id="cat" value={f.category} onChange={(e) => set('category', e.target.value)} className={input}>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><label htmlFor="slug" className={label}>Web address name (slug)</label><input id="slug" value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} className={input} placeholder="made-from-the-name" /><p className="mt-1 text-xs text-muted">The page will be at /product/{f.slug || 'your-slug'}. {editing && 'Changing it breaks old links to this product.'}</p></div>
            <div><label htmlFor="short" className={label}>Short description {counter(f.short, 200)}</label><input id="short" maxLength={200} value={f.short} onChange={(e) => set('short', e.target.value)} className={input} placeholder="One line shown on cards and search" /></div>
            <div><label htmlFor="desc" className={label}>Full description</label><textarea id="desc" rows={6} maxLength={5000} value={f.description} onChange={(e) => set('description', e.target.value)} className={input} /></div>
          </div>
        </Card>

        <Card title="Pictures">
          <p className="mb-3 text-sm text-muted">The first picture is the main one (shop cards, search, sharing). Use the arrows to reorder.</p>
          {f.images.length > 0 && <ul className="mb-4 space-y-3">{f.images.map((im, i) => (
            <li key={im.src} className="flex flex-wrap items-center gap-3 rounded-xl border border-charcoal/10 p-2">
              <Thumb src={im.src} alt={im.alt} />
              <div className="min-w-[10rem] flex-1"><label htmlFor={`alt${i}`} className="sr-only">Description of picture {i + 1}</label><input id={`alt${i}`} value={im.alt} maxLength={200} onChange={(e) => set('images', f.images.map((x, n) => (n === i ? { ...x, alt: e.target.value } : x)))} placeholder="Describe the picture (helps search engines and screen readers)" className={input} />{i === 0 && <span className="text-xs text-gold-ink">Main picture</span>}</div>
              <div className="flex gap-1"><button type="button" aria-label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0} className={`${btnOutline} !px-3`}>↑</button><button type="button" aria-label="Move later" onClick={() => move(i, 1)} disabled={i === f.images.length - 1} className={`${btnOutline} !px-3`}>↓</button><button type="button" aria-label="Remove picture" onClick={() => set('images', f.images.filter((_, n) => n !== i))} className={`${btnDanger} !px-3`}>✕</button></div>
            </li>))}</ul>}
          {f.images.length < 10 ? <PictureAdder label="Upload picture" onPick={(url) => { if (f.images.some((x) => x.src === url)) return; set('images', [...f.images, { src: url, alt: f.name }]); }} /> : <p className="text-sm text-muted">10 pictures is the most a product can have.</p>}
          <div className="mt-4"><label htmlFor="video" className={label}>Video (optional)</label><input id="video" value={f.video} onChange={(e) => set('video', e.target.value)} className={input} placeholder="https://…/video.mp4" /></div>
        </Card>

        <Card title="Details & search listing">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label htmlFor="mat" className={label}>Material</label><input id="mat" value={f.material} onChange={(e) => set('material', e.target.value)} className={input} /></div>
              <div><label htmlFor="dim" className={label}>Dimensions</label><input id="dim" value={f.dimensions} onChange={(e) => set('dimensions', e.target.value)} className={input} /></div>
              <div><label htmlFor="wt" className={label}>Weight</label><input id="wt" value={f.weight} onChange={(e) => set('weight', e.target.value)} className={input} /></div>
            </div>
            <div><label htmlFor="st" className={label}>Search title {counter(f.seoTitle, 70)}</label><input id="st" value={f.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} className={input} placeholder={f.name || 'Defaults to the product name'} /></div>
            <div><label htmlFor="sd" className={label}>Search description {counter(f.seoDescription, 170)}</label><textarea id="sd" rows={2} value={f.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} className={input} placeholder="Defaults to the short description and price" /></div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Publish">
          <label htmlFor="status" className={label}>Status</label>
          <select id="status" value={f.status} onChange={(e) => set('status', e.target.value as FormState['status'])} className={input}>
            <option value="draft">Draft (hidden from the shop)</option><option value="active">Active (visible, can be bought)</option><option value="archived">Archived (hidden)</option>
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-3"><button type="submit" disabled={save.busy} className={btnPrimary}>{save.busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>{storefrontSlug && f.status === 'active' && <Link href={`/product/${storefrontSlug}`} target="_blank" className="text-xs uppercase tracking-widest underline">View in shop ↗</Link>}</div>
          <div className="mt-2">{save.message}</div>
        </Card>

        <Card title="Price">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="price" className={label}>Selling price (₹) *</label><input id="price" required inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} className={input} placeholder="799" /></div>
            <div><label htmlFor="cmp" className={label}>Original price (₹)</label><input id="cmp" inputMode="decimal" value={f.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} className={input} placeholder="Shown struck through" /></div>
          </div>
        </Card>

        <Card title="Stock">
          <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.hasVariants} onChange={(e) => set('hasVariants', e.target.checked)} /> This product comes in sizes or options (like ring sizes)</label>
          {!f.hasVariants ? (
            <div><label htmlFor="stock" className={label}>Pieces in stock</label><input id="stock" type="number" min={0} value={f.stock} onChange={(e) => set('stock', e.target.value)} disabled={editing && !initial.hasVariants} className={input} />{editing && !initial.hasVariants && <p className="mt-1 text-xs text-muted">To change stock safely while orders are coming in, use <Link className="underline" href="/admin/inventory">Inventory</Link>.</p>}</div>
          ) : (
            <div className="space-y-3">
              <div><label htmlFor="vl" className={label}>Option name</label><input id="vl" value={f.variantLabel} onChange={(e) => set('variantLabel', e.target.value)} className={input} /></div>
              {f.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_5rem_auto] items-end gap-2">
                  <div><label className={label} htmlFor={`vv${i}`}>{f.variantLabel || 'Option'}</label><input id={`vv${i}`} value={v.value} maxLength={20} onChange={(e) => setVariant(i, { value: e.target.value })} disabled={v.existing} className={input} /></div>
                  <div><label className={label} htmlFor={`vs${i}`}>Stock</label><input id={`vs${i}`} type="number" min={0} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} disabled={v.existing} className={input} /></div>
                  <button type="button" aria-label={`Remove ${v.value || 'option'}`} onClick={() => set('variants', f.variants.filter((_, n) => n !== i))} className={`${btnDanger} !px-3`}>✕</button>
                </div>))}
              <button type="button" onClick={() => set('variants', [...f.variants, { value: '', stock: '0', sku: '', existing: false }])} className={btnOutline}>+ Add {f.variantLabel?.toLowerCase() || 'option'}</button>
              {editing && f.variants.some((v) => v.existing) && <p className="text-xs text-muted">Existing sizes keep their live stock. Change it in <Link className="underline" href="/admin/inventory">Inventory</Link>.</p>}
            </div>)}
        </Card>

        <Card title="Tags & collections">
          <p className={label}>Badges</p>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">{[['new', 'New arrival'], ['bestseller', 'Bestseller']].map(([k, t]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f.tags.includes(k)} onChange={() => toggle('tags', k)} /> {t}</label>)}</div>
          <p className={label}>Collections</p>
          <div className="flex flex-wrap gap-4 text-sm">{collections.map((c) => <label key={c.slug} className="flex items-center gap-2"><input type="checkbox" checked={f.collections.includes(c.slug)} onChange={() => toggle('collections', c.slug)} /> {c.name}</label>)}{collections.length === 0 && <span className="text-sm text-muted">No collections in the database yet.</span>}</div>
        </Card>

        {editing && <Card title="Danger zone"><p className="mb-3 text-sm text-muted">Deleting removes the product from the shop for good. Hiding it (Archived) is usually better.</p><button type="button" disabled={del.busy} onClick={remove} className={btnDanger}>Delete product</button><div className="mt-2">{del.message}</div></Card>}
      </div>
    </form>
  );
}
