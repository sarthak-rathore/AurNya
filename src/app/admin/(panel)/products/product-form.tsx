'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/components/admin/api';
import { PictureAdder, Thumb } from '@/components/admin/image-picker';
import { useAction } from '@/components/admin/use-action';
import { slugify } from '@/lib/admin-format';

export interface VariantRow {
  value: string;
  stock: string;
  sku: string;
  existing: boolean;
}

export interface FormState {
  name: string;
  slug: string;
  sku: string;
  category: string;
  short: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  tags: string[];
  material: string;
  dimensions: string;
  weight: string;
  images: { src: string; alt: string }[];
  video: string;
  seoTitle: string;
  seoDescription: string;
  status: 'draft' | 'active' | 'archived';
  collections: string[];
  hasVariants: boolean;
  variantLabel: string;
  variants: VariantRow[];
}

export const emptyForm = (category: string): FormState => ({
  name: '',
  slug: '',
  sku: '',
  category,
  short: '',
  description: '',
  price: '',
  comparePrice: '',
  stock: '0',
  tags: [],
  material: '',
  dimensions: '',
  weight: '',
  images: [],
  video: '',
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
  collections: [],
  hasVariants: false,
  variantLabel: 'Size',
  variants: [],
});

interface Props {
  id?: number;
  initial?: FormState;
  categories: string[];
  collections: { slug: string; name: string }[];
  storefrontSlug?: string;
}

export function ProductForm({ id, initial, categories, collections, storefrontSlug }: Props) {
  const router = useRouter();
  // Stay inside the dashboard the person is using (owner or admin); this form is shared.
  const base = `/${(usePathname() || '').split('/')[1] === 'owner' ? 'owner' : 'admin'}`;
  const save = useAction();
  const del = useAction();
  const [f, setF] = useState<FormState>(() => initial ?? emptyForm(categories[0] || 'Necklaces'));
  const [slugTouched, setSlugTouched] = useState(id !== undefined);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));
  const editing = id !== undefined;
  const toggle = (k: 'tags' | 'collections', v: string) =>
    set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  const setVariant = (i: number, patch: Partial<VariantRow>) =>
    set(
      'variants',
      f.variants.map((v, n) => (n === i ? { ...v, ...patch } : v))
    );
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= f.images.length) return;
    const a = [...f.images];
    [a[i], a[j]] = [a[j], a[i]];
    set('images', a);
  };

  const payload = () => ({
    name: f.name,
    slug: f.slug,
    sku: f.sku,
    category: f.category,
    short: f.short,
    description: f.description,
    price: f.price,
    comparePrice: f.comparePrice,
    stock: Number(f.stock || 0),
    tags: f.tags,
    material: f.material,
    dimensions: f.dimensions,
    weight: f.weight,
    images: f.images,
    video: f.video,
    seoTitle: f.seoTitle,
    seoDescription: f.seoDescription,
    status: f.status,
    collections: f.collections,
    variants: f.hasVariants
      ? {
          label: f.variantLabel,
          options: f.variants.map((v) => ({
            value: v.value.trim(),
            stock: Number(v.stock || 0),
            sku: v.sku.trim() || null,
          })),
        }
      : null,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await save.run(async () => {
      const res = await adminFetch<{ id?: number }>(
        editing ? `/api/admin/products/${id}` : '/api/admin/products',
        editing ? 'PUT' : 'POST',
        payload()
      );
      if (res.ok && !editing && res.data?.id) {
        router.replace(`${base}/products/${res.data.id}?created=1`);
      }
      return res;
    }, editing ? 'Product saved successfully ✓' : 'Product created successfully ✓');
    if (r && editing) router.refresh();
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete "${f.name}" permanently? Orders already placed keep their own copy of details.`
      )
    )
      return;
    if (await del.run(() => adminFetch(`/api/admin/products/${id}`, 'DELETE'), 'Deleted')) {
      router.replace(`${base}/products`);
    }
  }

  const counter = (v: string, max: number) => (
    <span className={`text-[10px] ${v.length > max ? 'text-red-400 font-bold' : 'text-[#8E869B]'}`}>
      {v.length}/{max}
    </span>
  );

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Basics Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Basics</h2>
            <span className="text-[11px] text-[#8E869B]">Essential product details</span>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
              Product Name *
            </label>
            <input
              id="name"
              required
              maxLength={120}
              placeholder="e.g. Royal Heritage Solitaire Ring"
              value={f.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sku" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                id="sku"
                required
                maxLength={40}
                value={f.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="AUR-RING-001"
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cat" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Category *
              </label>
              <select
                id="cat"
                value={f.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#181521] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="slug" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
              Web Address Slug (URL)
            </label>
            <input
              id="slug"
              value={f.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', slugify(e.target.value));
              }}
              placeholder="royal-heritage-solitaire-ring"
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[#8E869B]">
              Storefront link: <span className="text-[#D4A843]">/product/{f.slug || 'your-slug'}</span>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="short" className="text-xs font-semibold text-[#D1CADB]">
                Short Description (Cards &amp; Search)
              </label>
              {counter(f.short, 200)}
            </div>
            <input
              id="short"
              maxLength={200}
              value={f.short}
              onChange={(e) => set('short', e.target.value)}
              placeholder="e.g. Handcrafted 18K gold ring with brilliant-cut solitaire"
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="desc" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
              Full Product Description
            </label>
            <textarea
              id="desc"
              rows={5}
              maxLength={5000}
              value={f.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Detailed storytelling, craftsmanship notes, packaging, and styling suggestions..."
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Pictures Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Product Gallery</h2>
            <span className="text-[11px] text-[#8E869B]">Up to 10 high-resolution photos</span>
          </div>

          <p className="text-xs text-[#8E869B]">
            The first picture is the primary display image across the storefront and social sharing previews.
          </p>

          {f.images.length > 0 && (
            <ul className="space-y-3">
              {f.images.map((im, i) => (
                <li
                  key={im.src}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#121018] p-2.5"
                >
                  <Thumb src={im.src} alt={im.alt} />
                  <div className="min-w-[10rem] flex-1">
                    <input
                      id={`alt${i}`}
                      value={im.alt}
                      maxLength={200}
                      onChange={(e) =>
                        set(
                          'images',
                          f.images.map((x, n) => (n === i ? { ...x, alt: e.target.value } : x))
                        )
                      }
                      placeholder="Image alt description (SEO)"
                      className="w-full rounded-lg border border-white/10 bg-[#181521] px-3 py-1.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                    />
                    {i === 0 && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-[#D4A843]">
                        ★ Primary Cover Picture
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 text-xs text-white"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      onClick={() => move(i, 1)}
                      disabled={i === f.images.length - 1}
                      className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 text-xs text-white"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label="Remove picture"
                      onClick={() => set('images', f.images.filter((_, n) => n !== i))}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {f.images.length < 10 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-[#121018] p-4 text-center">
              <PictureAdder
                label="+ Add Product Picture"
                onPick={(url) => {
                  if (f.images.some((x) => x.src === url)) return;
                  set('images', [...f.images, { src: url, alt: f.name }]);
                }}
              />
            </div>
          ) : (
            <p className="text-xs text-[#8E869B]">Maximum limit of 10 pictures reached.</p>
          )}

          <div>
            <label htmlFor="video" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
              Product Video (Optional URL)
            </label>
            <input
              id="video"
              value={f.video}
              onChange={(e) => set('video', e.target.value)}
              placeholder="https://.../jewellery-spin.mp4"
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
            />
          </div>
        </div>

        {/* Specifications & SEO Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Specifications &amp; SEO</h2>
            <span className="text-[11px] text-[#8E869B]">Dimensions &amp; search meta</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="mat" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Material / Metal
              </label>
              <input
                id="mat"
                placeholder="e.g. 18K Gold Plated"
                value={f.material}
                onChange={(e) => set('material', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dim" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Dimensions
              </label>
              <input
                id="dim"
                placeholder="e.g. Adjustable / 45cm"
                value={f.dimensions}
                onChange={(e) => set('dimensions', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="wt" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Gross Weight
              </label>
              <input
                id="wt"
                placeholder="e.g. 14.2 grams"
                value={f.weight}
                onChange={(e) => set('weight', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="st" className="text-xs font-semibold text-[#D1CADB]">
                SEO Meta Title
              </label>
              {counter(f.seoTitle, 70)}
            </div>
            <input
              id="st"
              value={f.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
              placeholder={f.name || 'Defaults to product name'}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sd" className="text-xs font-semibold text-[#D1CADB]">
                SEO Meta Description
              </label>
              {counter(f.seoDescription, 170)}
            </div>
            <textarea
              id="sd"
              rows={2}
              value={f.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
              placeholder="Search snippet summary shown in Google search results..."
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Publish & Status Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Publish</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                f.status === 'active'
                  ? 'bg-[#153424] text-[#4ADE80]'
                  : f.status === 'draft'
                  ? 'bg-[#2E2838] text-[#A59CB0]'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {f.status}
            </span>
          </div>

          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
              Listing Status
            </label>
            <select
              id="status"
              value={f.status}
              onChange={(e) => set('status', e.target.value as FormState['status'])}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            >
              <option value="draft" className="bg-[#181521]">Draft (Hidden from shop)</option>
              <option value="active" className="bg-[#181521]">Active (Visible &amp; Purchasable)</option>
              <option value="archived" className="bg-[#181521]">Archived (Deactivated)</option>
            </select>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={save.busy}
              className="w-full rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold py-3 transition-all shadow-md shadow-[#D4A843]/10 flex items-center justify-center gap-2"
            >
              {save.busy ? 'Saving...' : editing ? 'Save Changes' : 'Create Product'}
            </button>

            {storefrontSlug && f.status === 'active' && (
              <Link
                href={`/product/${storefrontSlug}`}
                target="_blank"
                className="w-full text-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2.5 transition-colors"
              >
                View in Storefront ↗
              </Link>
            )}

            {editing && (
              <button
                type="button"
                onClick={remove}
                disabled={del.busy}
                className="w-full text-center text-xs text-red-400 hover:text-red-300 underline font-medium pt-1"
              >
                Delete This Product
              </button>
            )}
          </div>
          {save.message && <div className="text-xs text-[#4ADE80] font-semibold">{save.message}</div>}
        </div>

        {/* Pricing Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Pricing</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                id="price"
                required
                inputMode="decimal"
                value={f.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="2,999"
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white font-bold placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cmp" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Original MRP (₹)
              </label>
              <input
                id="cmp"
                inputMode="decimal"
                value={f.comparePrice}
                onChange={(e) => set('comparePrice', e.target.value)}
                placeholder="3,999 (Struck through)"
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:border-[#D4A843] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Variants Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Stock &amp; Variants</h2>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-[#D1CADB] cursor-pointer">
            <input
              type="checkbox"
              checked={f.hasVariants}
              onChange={(e) => set('hasVariants', e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#121018] text-[#D4A843] focus:ring-[#D4A843]"
            />
            <span>This product comes in sizes or options (e.g. Ring sizes)</span>
          </label>

          {!f.hasVariants ? (
            <div>
              <label htmlFor="stock" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                Total Pieces in Stock
              </label>
              <input
                id="stock"
                type="number"
                min={0}
                value={f.stock}
                onChange={(e) => set('stock', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white font-semibold focus:border-[#D4A843] focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="vl" className="block text-xs font-semibold text-[#D1CADB] mb-1.5">
                  Option Name
                </label>
                <input
                  id="vl"
                  value={f.variantLabel}
                  onChange={(e) => set('variantLabel', e.target.value)}
                  placeholder="Size"
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2 text-xs text-white focus:border-[#D4A843] focus:outline-none"
                />
              </div>

              {f.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_5rem_auto] items-end gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8E869B] mb-1">
                      {f.variantLabel || 'Size'}
                    </label>
                    <input
                      value={v.value}
                      maxLength={20}
                      onChange={(e) => setVariant(i, { value: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#121018] px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8E869B] mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => setVariant(i, { stock: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#121018] px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => set('variants', f.variants.filter((_, n) => n !== i))}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  set('variants', [
                    ...f.variants,
                    { value: '', stock: '10', sku: '', existing: false },
                  ])
                }
                className="w-full rounded-xl border border-dashed border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white py-2"
              >
                + Add Option Variant
              </button>
            </div>
          )}
        </div>

        {/* Collections Assignment Card */}
        <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-3">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-bold font-serif text-white">Collections</h2>
          </div>
          <p className="text-xs text-[#8E869B]">Feature this product under curated edits:</p>
          <div className="space-y-2">
            {collections.map((c) => {
              const active = f.collections.includes(c.slug);
              return (
                <label
                  key={c.slug}
                  className="flex items-center gap-2.5 text-xs text-[#D1CADB] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle('collections', c.slug)}
                    className="h-4 w-4 rounded border-white/20 bg-[#121018] text-[#D4A843] focus:ring-[#D4A843]"
                  />
                  <span>{c.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
}
