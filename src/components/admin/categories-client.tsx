'use client';
import { useState } from 'react';
import { useSection } from './use-section';

export interface CategoryItem {
  name: string;
  slug: string;
  sortOrder: number;
  status: string;
}

export function CategoriesClient({ initial }: { initial: CategoryItem[] }) {
  const sec = useSection<CategoryItem[]>('categories', initial);
  const items = sec.value;
  // Saves on the server. An admin's or manager's change waits for the owner; this list only changes once it is really applied.
  const change = async (fn: (prev: CategoryItem[]) => CategoryItem[], msg: string) => {
    const r = await sec.commit(fn(items));
    if (r === 'applied') showToast(msg);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(initial.length + 1);
  const [status, setStatus] = useState('Active');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditingItem(null);
    setName('');
    setSlug('');
    setSortOrder(items.length + 1);
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEdit = (item: CategoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setSlug(item.slug);
    setSortOrder(item.sortOrder);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingItem) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    if (editingItem) {
      void change((prev) =>
        prev.map((c) =>
          c.slug === editingItem.slug
            ? { ...c, name: name.trim(), slug: slug.trim(), sortOrder: Number(sortOrder), status }
            : c
        )
      , `Category "${name}" updated successfully`);
    } else {
      const newItem: CategoryItem = {
        name: name.trim(),
        slug: slug.trim(),
        sortOrder: Number(sortOrder) || items.length + 1,
        status,
      };
      void change((prev) => [...prev, newItem], `Category "${name}" created successfully`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (slugToDelete: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      void change((prev) => prev.filter((c) => c.slug !== slugToDelete), 'Category removed');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#D4A843]/40 bg-[#1D1926] px-4 py-3 text-xs font-semibold text-white shadow-2xl flex items-center gap-2">
          <span className="text-[#4ADE80]">✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">Product Categories</h1>
          <p className="text-xs text-[#968E9F] mt-0.5">
            Organize jewellery collections into shopfront browsing categories
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2.5 transition-all shadow-md shadow-[#D4A843]/10 flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Add Category</span>
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-[#181521] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-white/5 bg-[#14121A]/50">
              <tr className="text-[10px] font-semibold uppercase text-[#736B7F]">
                <th className="px-5 py-3">Category Name</th>
                <th className="px-5 py-3">Slug (URL)</th>
                <th className="px-5 py-3">Sort Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((c) => (
                <tr key={c.slug} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white">{c.name}</td>
                  <td className="px-5 py-3.5 text-[#736B7F]">/category/{c.slug}</td>
                  <td className="px-5 py-3.5 text-[#A59CB0]">{c.sortOrder}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        c.status === 'Active'
                          ? 'bg-[#153424] text-[#4ADE80]'
                          : 'bg-[#2E2838] text-[#A59CB0]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-[#C7C0D2] hover:text-white hover:bg-white/10 hover:border-[#D4A843]/40 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#181521] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-base font-bold font-serif text-white">
                {editingItem ? `Edit Category: ${editingItem.name}` : 'Add New Category'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8E869B] hover:text-white text-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chokers &amp; Collars"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                  Slug (URL Path) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. chokers"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white placeholder-[#5E566A] focus:outline-none focus:border-[#D4A843]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#C7C0D2] mb-1">
                    Display Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#121018] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A843]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {editingItem ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingItem.slug)}
                    className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Delete Category
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-medium text-[#C7C0D2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#D4A843] hover:bg-[#E5B558] text-[#14121A] text-xs font-bold px-4 py-2 shadow-md shadow-[#D4A843]/10"
                  >
                    {editingItem ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
