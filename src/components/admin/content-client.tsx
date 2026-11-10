'use client';
import { useState } from 'react';
import { adminFetch } from './api';
import { useSection } from './use-section';

interface StaticPage {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  status: 'Published' | 'Draft';
  content: string;
}

interface Badge { title: string; desc: string }
interface Saved { badges: Badge[]; pages: StaticPage[] }
export interface LiveAnnouncement { visible: boolean; message: string; href: string; linkText: string }

export function ContentClient({ announcement, saved }: { announcement?: LiveAnnouncement; saved?: Partial<Saved> }) {
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<StaticPage | null>(null);

  // Announcement Bar State
  const [announcementActive, setAnnouncementActive] = useState(announcement?.visible ?? true);
  const [announcementText, setAnnouncementText] = useState(
    announcement?.message ?? 'Complimentary gift-ready packaging on all orders · Free shipping over ₹999'
  );
  const [announcementLink, setAnnouncementLink] = useState(announcement?.href ?? '/collection/everyday');
  const [announcementLinkText, setAnnouncementLinkText] = useState(announcement?.linkText ?? 'Shop the collection');

  // Trust Badges State
  const defaultBadges: Badge[] = [
    { title: '100% Certified Gold', desc: 'BIS Hallmarked 18K & 22K certified authentic jewellery' },
    { title: 'Complimentary Packaging', desc: 'Signature gold-foil embossed box, suede pouch & certificate' },
    { title: 'Free Insured Shipping', desc: 'Secure doorstep courier with tracking on all orders above ₹999' },
    { title: '7-Day Easy Returns', desc: 'Hassle-free reverse pickup with full refund guarantee' },
  ];
  const [badges, setBadges] = useState<Badge[]>(saved?.badges ?? defaultBadges);

  // Static Pages List
  const defaultPages: StaticPage[] = [
    {
      id: '1',
      title: 'About AurNya: Our Heritage & Story',
      slug: '/about',
      updatedAt: 'Nov 6, 2026',
      status: 'Published',
      content:
        'Founded with a passion for classic craftsmanship, AurNya blends centuries-old Indian goldsmith traditions with modern architectural silhouettes.',
    },
    {
      id: '2',
      title: 'Jewellery Care & Preservation Guide',
      slug: '/care',
      updatedAt: 'Nov 4, 2026',
      status: 'Published',
      content:
        'To preserve the brilliant lustre of your 18K gold and diamond jewellery, store each piece in the provided suede pouch and avoid contact with perfume and moisture.',
    },
    {
      id: '3',
      title: 'Shipping, Delivery & Insurance Policy',
      slug: '/shipping',
      updatedAt: 'Nov 2, 2026',
      status: 'Published',
      content:
        'All shipments are insured during transit. Express courier delivery takes 3 to 5 business days across major metro cities in India.',
    },
    {
      id: '4',
      title: 'Lifetime Authenticity Guarantee',
      slug: '/guarantee',
      updatedAt: 'Oct 28, 2026',
      status: 'Published',
      content:
        'Every AurNya creation arrives with a stamped certificate of authenticity verifying purity, hallmark license, and gemstone specifications.',
    },
    {
      id: '5',
      title: 'Frequently Asked Questions (FAQ)',
      slug: '/faq',
      updatedAt: 'Oct 24, 2026',
      status: 'Published',
      content:
        'Find answers regarding ring sizing guides, custom engraving orders, payment gateways, and COD verification procedures.',
    },
  ];
  const [pages, setPages] = useState<StaticPage[]>(saved?.pages ?? defaultPages);
  const sec = useSection<Saved>('content', { badges: saved?.badges ?? defaultBadges, pages: saved?.pages ?? defaultPages });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;
    const nextPages = pages.map((p) => (p.id === selectedPage.id ? { ...selectedPage, updatedAt: 'Just now' } : p));
    const r = await sec.commit({ badges: sec.value.badges, pages: nextPages });
    if (r === 'applied') { setPages(nextPages); showToast(`Page "${selectedPage.title}" updated successfully!`); }
    setSelectedPage(null);
  };

  // The real announcement bar on the storefront (same save as Website Control).
  const handleSaveAnnouncement = async () => {
    const r = await adminFetch('/api/admin/announcement', 'PUT', { visible: announcementActive, message: announcementText, href: announcementLink, linkText: announcementLinkText, start: null, end: null });
    if (!r.ok) showToast(r.error);
    else if (!r.data.pending) showToast('Announcement banner updated across the storefront ✓');
  };

  const handleSaveBadges = async () => {
    const r = await sec.commit({ badges: badges.map((b) => ({ ...b })), pages: sec.value.pages });
    if (r === 'applied') showToast('Homepage trust badges saved ✓');
    else setBadges(sec.value.badges.map((b) => ({ ...b })));   // not applied (waiting for the owner): show the live badges again
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#D4A843]/40 bg-[#1D1926] px-4 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="text-[#4ADE80]">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Content Management</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Customise boutique storefront pages, announcement header text, and homepage luxury trust badges
          </p>
        </div>
      </div>

      {/* Announcement Bar Control */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="text-base font-bold font-serif text-white">Top Announcement Header Bar</h2>
            <p className="text-[11px] text-[#8E869B]">Pinned top notice displayed above main navigation</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#D1CADB] font-medium">
              {announcementActive ? 'Enabled (Live)' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={() => {
                setAnnouncementActive(!announcementActive);
                showToast(`Announcement bar set to ${!announcementActive ? 'on' : 'off'}. Press Save to apply it.`);
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                announcementActive ? 'bg-[#22C55E]' : 'bg-[#3A3347]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition mt-0.5 ml-0.5 ${
                  announcementActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#D1CADB] mb-1">
              Banner Message Text
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#D1CADB] mb-1">
              Call to Action Link Text
            </label>
            <input
              type="text"
              value={announcementLinkText}
              onChange={(e) => setAnnouncementLinkText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAnnouncement}
            className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2 transition-all shadow-md shadow-[#D4A843]/10"
          >
            Update Banner
          </button>
        </div>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-white">Storefront Information Pages</h2>
            <p className="text-[11px] text-[#8E869B] mt-0.5">Brand story, jewellery care guidelines, and customer policies</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Page Title</th>
                <th className="px-5 py-3">Storefront URL</th>
                <th className="px-5 py-3">Last Modified</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white">{p.title}</td>
                  <td className="px-5 py-3.5 text-[#D4A843] font-mono">{p.slug}</td>
                  <td className="px-5 py-3.5 text-[#8E869B]">{p.updatedAt}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block rounded-full bg-[#153424] text-[#4ADE80] px-2.5 py-0.5 text-[10px] font-semibold">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedPage(p)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-[#C7C0D2] hover:text-white hover:bg-white/10 hover:border-[#D4A843]/40 transition-colors"
                    >
                      Edit Page
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Homepage Trust Badges */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="text-base font-bold font-serif text-white">Homepage Trust &amp; Craftsmanship Badges</h2>
            <p className="text-[11px] text-[#8E869B]">Key assurances highlighted beneath the homepage slideshow</p>
          </div>
          <button
            type="button"
            onClick={handleSaveBadges}
            className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2 transition-all shadow-md shadow-[#D4A843]/10"
          >
            Save Badges
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((b, idx) => (
            <div key={idx} className="rounded-xl border border-white/5 bg-[#121018] p-4 space-y-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#736B7F] mb-1">
                  Badge {idx + 1} Heading
                </label>
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => {
                    const next = badges.map((x, k) => (k === idx ? { ...x, title: e.target.value } : x));
                    setBadges(next);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-[#181521] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#736B7F] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={b.desc}
                  onChange={(e) => {
                    const next = badges.map((x, k) => (k === idx ? { ...x, desc: e.target.value } : x));
                    setBadges(next);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-[#181521] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Page Modal */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold font-serif text-white">
                  Edit Page: {selectedPage.title}
                </h3>
                <p className="text-[11px] text-[#D4A843] font-mono mt-0.5">{selectedPage.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className="text-[#8E869B] hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  value={selectedPage.title}
                  onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1CADB] mb-1">Content Body (Markdown / Text)</label>
                <textarea
                  rows={8}
                  required
                  value={selectedPage.content}
                  onChange={(e) => setSelectedPage({ ...selectedPage, content: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:border-[#D4A843] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedPage(null)}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-[#C7C0D2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-5 py-2 shadow-md shadow-[#D4A843]/10"
                >
                  Save Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
