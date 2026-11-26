import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Edit3, Plus, Search, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCategories, usePageTitle } from '@/hooks/useStoreQueries';
import {
  archiveOrDeleteProduct,
  fetchAdminProducts,
  upsertAdminProduct,
} from '@/services/api';
import type { AdminProduct, ProductLine } from '@/types/database';
import { formatRupiah, slugify } from '@/utils/format';

interface ProductEditorState {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  product_line: ProductLine;
  short_description: string;
  description: string;
  materials: string;
  dimensions: string;
  care_instructions: string;
  processing_estimate: string;
  selling_price: string;
  compare_at_price: string;
  price_unit: string;
  cost_price: string;
  is_price_on_request: boolean;
  is_customizable: boolean;
  customization_prompt: string;
  occasions: string;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  allow_backorder: boolean;
  seo_title: string;
  seo_description: string;
  primary_image_url: string;
}

const EMPTY_FORM: ProductEditorState = {
  name: '',
  slug: '',
  sku: '',
  category_id: '',
  product_line: 'fresh',
  short_description: '',
  description: '',
  materials: '',
  dimensions: '',
  care_instructions: '',
  processing_estimate: '',
  selling_price: '',
  compare_at_price: '',
  price_unit: 'buket',
  cost_price: '',
  is_price_on_request: false,
  is_customizable: true,
  customization_prompt: '',
  occasions: 'Wisuda, Ulang tahun',
  is_active: true,
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: true,
  allow_backorder: true,
  seo_title: '',
  seo_description: '',
  primary_image_url: '/images/hero-abadikala.jpg',
};

export function AdminProductsPage() {
  usePageTitle('Manajemen Produk — Admin');
  const { user, isManager } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAdminProducts,
  });
  const { data: categories = [] } = useCategories(true);

  const [search, setSearch] = useState('');
  const [lineFilter, setLineFilter] = useState<'all' | ProductLine>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductEditorState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = products.filter((p) => {
    const matchesLine = lineFilter === 'all' || p.product_line === lineFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.category_name || '').toLowerCase().includes(q);
    return matchesLine && matchesQuery;
  });

  const openNew = () => {
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || '',
      category_id: p.category_id || categories[0]?.id || '',
      product_line: p.product_line,
      short_description: p.short_description || '',
      description: p.description || '',
      materials: p.materials || '',
      dimensions: p.dimensions || '',
      care_instructions: p.care_instructions || '',
      processing_estimate: p.processing_estimate || '',
      selling_price: p.selling_price !== null ? String(p.selling_price) : '',
      compare_at_price: p.compare_at_price !== null ? String(p.compare_at_price) : '',
      price_unit: p.price_unit || 'item',
      cost_price: p.cost_price !== null ? String(p.cost_price) : '',
      is_price_on_request: p.is_price_on_request,
      is_customizable: p.is_customizable,
      customization_prompt: p.customization_prompt || '',
      occasions: p.occasions.join(', '),
      is_active: p.is_active,
      is_featured: p.is_featured,
      is_best_seller: p.is_best_seller,
      is_new_arrival: p.is_new_arrival,
      allow_backorder: p.allow_backorder,
      seo_title: p.seo_title || '',
      seo_description: p.seo_description || '',
      primary_image_url:
        p.images.find((i) => i.is_primary)?.image_url ||
        p.images[0]?.image_url ||
        '/images/hero-abadikala.jpg',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await upsertAdminProduct(
        {
          id: form.id,
          name: form.name.trim(),
          slug: form.slug.trim() || slugify(form.name),
          sku: form.sku.trim() || null,
          category_id: form.category_id || null,
          product_line: form.product_line,
          short_description: form.short_description.trim() || null,
          description: form.description.trim() || null,
          materials: form.materials.trim() || null,
          dimensions: form.dimensions.trim() || null,
          care_instructions: form.care_instructions.trim() || null,
          processing_estimate: form.processing_estimate.trim() || null,
          selling_price:
            form.is_price_on_request || form.selling_price === ''
              ? null
              : Number(form.selling_price),
          compare_at_price:
            form.compare_at_price === '' ? null : Number(form.compare_at_price),
          price_unit: form.price_unit.trim() || 'item',
          cost_price: form.cost_price === '' ? null : Number(form.cost_price),
          is_price_on_request: form.is_price_on_request,
          is_customizable: form.is_customizable,
          customization_prompt: form.customization_prompt.trim() || null,
          occasions: form.occasions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          is_active: form.is_active,
          is_featured: form.is_featured,
          is_best_seller: form.is_best_seller,
          is_new_arrival: form.is_new_arrival,
          allow_backorder: form.allow_backorder,
          seo_title: form.seo_title.trim() || null,
          seo_description: form.seo_description.trim() || null,
          primary_image_url: form.primary_image_url.trim(),
        },
        { email: user.email, role: user.role }
      );
      await qc.invalidateQueries({ queryKey: ['admin-products'] });
      await qc.invalidateQueries({ queryKey: ['public-products'] });
      await qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      setModalOpen(false);
      showToast(form.id ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan produk.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrArchive = async (p: AdminProduct) => {
    if (!user) return;
    const confirmed = window.confirm(
      `Hapus atau arsipkan "${p.name}"? Jika produk sudah pernah dipesan, sistem akan mengarsipkannya secara otomatis agar histori transaksi tetap utuh.`
    );
    if (!confirmed) return;
    try {
      const outcome = await archiveOrDeleteProduct(p.id, { email: user.email, role: user.role });
      await qc.invalidateQueries({ queryKey: ['admin-products'] });
      await qc.invalidateQueries({ queryKey: ['public-products'] });
      showToast(
        outcome === 'archived'
          ? `"${p.name}" diarsipkan karena memiliki riwayat pesanan.`
          : `"${p.name}" berhasil dihapus.`,
        'info'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus produk.', 'error');
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) {
      showToast('File gambar maksimal 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, primary_image_url: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink-primary">
            Manajemen Produk & HPP Internal
          </h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Data HPP (Harga Pokok Penjualan) bersifat rahasia internal dan tidak pernah dikirim ke
            halaman pelanggan.
          </p>
        </div>
        {isManager && (
          <button type="button" onClick={openNew} className="btn-primary py-2.5 text-xs">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card-editorial flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, SKU, atau kategori..."
            className="input-field pl-9 text-xs"
          />
        </div>
        <select
          value={lineFilter}
          onChange={(e) => setLineFilter(e.target.value as 'all' | ProductLine)}
          className="input-field w-44 text-xs"
        >
          <option value="all">Semua Lini</option>
          <option value="fresh">Lini Segar</option>
          <option value="preserved">Lini Abadi</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="card-editorial overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Lini & Kategori</th>
                <th className="px-4 py-3">Harga Jual</th>
                <th className="px-4 py-3">HPP Internal</th>
                <th className="px-4 py-3">Estimasi Margin</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted">
                    Memuat data produk...
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const margin =
                    p.selling_price !== null && p.cost_price !== null
                      ? p.selling_price - p.cost_price
                      : null;
                  const marginPct =
                    margin !== null && p.selling_price && p.selling_price > 0
                      ? Math.round((margin / p.selling_price) * 100)
                      : null;
                  const img =
                    p.images.find((i) => i.is_primary)?.image_url ||
                    p.images[0]?.image_url ||
                    '/images/hero-abadikala.jpg';

                  return (
                    <tr key={p.id} className={p.is_archived ? 'opacity-55' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt={p.name}
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-semibold text-ink-primary">{p.name}</p>
                            <p className="text-[11px] text-ink-muted">{p.sku || p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            p.product_line === 'fresh'
                              ? 'bg-brand-sage-soft text-brand-sage'
                              : 'bg-brand-blush text-brand-primary'
                          }`}
                        >
                          {p.product_line === 'fresh' ? 'Lini Segar' : 'Lini Abadi'}
                        </span>
                        <p className="mt-1 text-ink-secondary">{p.category_name || '-'}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-primary">
                        {p.is_price_on_request ? 'Menyesuaikan' : formatRupiah(p.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {p.cost_price !== null ? formatRupiah(p.cost_price) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {margin !== null ? (
                          <span className="font-semibold text-brand-sage">
                            {formatRupiah(margin)} ({marginPct}%)
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              p.is_archived
                                ? 'bg-slate-200 text-slate-700'
                                : p.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {p.is_archived ? 'Diarsipkan' : p.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                          {p.is_best_seller && (
                            <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] text-white">
                              Best Seller
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isManager ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="rounded-lg border border-line-subtle p-1.5 text-ink-primary hover:border-brand-primary hover:text-brand-primary"
                              aria-label={`Edit ${p.name}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrArchive(p)}
                              className="rounded-lg border border-line-subtle p-1.5 text-rose-600 hover:bg-rose-50"
                              aria-label={`Arsipkan atau hapus ${p.name}`}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-ink-muted">Read-only (Staff)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-elevated">
            <div className="flex items-center justify-between border-b border-line-subtle pb-4">
              <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                {form.id ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">Nama Produk *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: form.id ? form.slug : slugify(e.target.value),
                      })
                    }
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">Slug SEO *</label>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">Lini Produk *</label>
                  <select
                    value={form.product_line}
                    onChange={(e) =>
                      setForm({ ...form, product_line: e.target.value as ProductLine })
                    }
                    className="input-field text-xs"
                  >
                    <option value="fresh">Lini Segar</option>
                    <option value="preserved">Lini Abadi</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">Kategori *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="input-field text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">SKU</label>
                  <input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Pricing + Internal HPP */}
              <div className="rounded-2xl border border-brand-secondary/30 bg-brand-blush/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-brand-primary">
                    <ShieldAlert className="h-4 w-4" />
                    Harga Jual & HPP Internal
                  </span>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={form.is_price_on_request}
                      onChange={(e) =>
                        setForm({ ...form, is_price_on_request: e.target.checked })
                      }
                    />
                    Harga Menyesuaikan (seperti Flower Bar)
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block font-semibold text-ink-secondary">
                      Harga Jual (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={form.is_price_on_request}
                      value={form.selling_price}
                      onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-ink-secondary">
                      Harga Coret / Diskon (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.compare_at_price}
                      onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                      className="input-field text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-brand-primary">
                      HPP Internal (Rahasia)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.cost_price}
                      onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                      className="input-field border-brand-secondary/50 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-ink-secondary">Satuan</label>
                    <input
                      value={form.price_unit}
                      onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
                      placeholder="buket / bulan / pcs"
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink-secondary">
                  Gambar Utama (URL atau Unggah Foto)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    required
                    value={form.primary_image_url}
                    onChange={(e) => setForm({ ...form, primary_image_url: e.target.value })}
                    className="input-field flex-1 text-xs"
                  />
                  <label className="btn-secondary cursor-pointer py-2 text-xs">
                    Upload Foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink-secondary">
                  Deskripsi Singkat
                </label>
                <input
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink-secondary">
                  Deskripsi Lengkap
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">Bahan</label>
                  <input
                    value={form.materials}
                    onChange={(e) => setForm({ ...form, materials: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Ukuran / Dimensi
                  </label>
                  <input
                    value={form.dimensions}
                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Acara (pisahkan dengan koma)
                  </label>
                  <input
                    value={form.occasions}
                    onChange={(e) => setForm({ ...form, occasions: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Estimasi Pengerjaan
                  </label>
                  <input
                    value={form.processing_estimate}
                    onChange={(e) => setForm({ ...form, processing_estimate: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-5 rounded-xl bg-surface-muted/60 p-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  Aktif di Toko
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_best_seller}
                    onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })}
                  />
                  Best Seller
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  />
                  Unggulan
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_new_arrival}
                    onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })}
                  />
                  Baru
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.allow_backorder}
                    onChange={(e) => setForm({ ...form, allow_backorder: e.target.checked })}
                  />
                  Izinkan Made-to-Order
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-line-subtle pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Batal
                </button>
                <button type="submit" disabled={saving} className="btn-primary py-2 text-xs">
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
