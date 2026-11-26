import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCategories, usePageTitle } from '@/hooks/useStoreQueries';
import { deleteCategory, upsertCategory } from '@/services/api';
import type { Category, ProductLine } from '@/types/database';
import { slugify } from '@/utils/format';

export function AdminCategoriesPage() {
  usePageTitle('Manajemen Kategori — Admin');
  const { user, isManager } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories(true);

  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !user) return;
    try {
      await upsertCategory(
        {
          ...editing,
          slug: editing.slug?.trim() || slugify(editing.name || ''),
        },
        { email: user.email, role: user.role }
      );
      await qc.invalidateQueries({ queryKey: ['categories'] });
      setEditing(null);
      showToast('Kategori berhasil disimpan.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan kategori.', 'error');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!user || !window.confirm(`Hapus kategori "${cat.name}"?`)) return;
    await deleteCategory(cat.id, { email: user.email, role: user.role });
    await qc.invalidateQueries({ queryKey: ['categories'] });
    showToast('Kategori dihapus.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink-primary">Manajemen Kategori</h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Atur kategori untuk Lini Segar dan Lini Abadi beserta urutan tampilnya.
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={() =>
              setEditing({
                name: '',
                slug: '',
                product_line: 'fresh',
                description: '',
                image_url: '/images/hero-abadikala.jpg',
                sort_order: categories.length + 1,
                is_active: true,
              })
            }
            className="btn-primary py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="card-editorial space-y-4 p-6 text-xs">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            {editing.id ? 'Edit Kategori' : 'Kategori Baru'}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              required
              placeholder="Nama Kategori"
              value={editing.name || ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  name: e.target.value,
                  slug: editing.id ? editing.slug : slugify(e.target.value),
                })
              }
              className="input-field text-xs"
            />
            <input
              required
              placeholder="Slug"
              value={editing.slug || ''}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              className="input-field font-mono text-xs"
            />
            <select
              value={editing.product_line || 'fresh'}
              onChange={(e) =>
                setEditing({ ...editing, product_line: e.target.value as ProductLine })
              }
              className="input-field text-xs"
            >
              <option value="fresh">Lini Segar</option>
              <option value="preserved">Lini Abadi</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              placeholder="URL Gambar Kategori"
              value={editing.image_url || ''}
              onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
              className="input-field text-xs sm:col-span-2"
            />
            <input
              type="number"
              placeholder="Urutan"
              value={editing.sort_order ?? 1}
              onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              className="input-field text-xs"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Deskripsi kategori"
            value={editing.description || ''}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="input-field text-xs"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.is_active ?? true}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
              />
              Kategori Aktif
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn-secondary py-2 text-xs"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary py-2 text-xs">
                Simpan
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="card-editorial flex gap-4 p-4">
            <img
              src={cat.image_url || '/images/hero-abadikala.jpg'}
              alt={cat.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    cat.product_line === 'fresh'
                      ? 'bg-brand-sage-soft text-brand-sage'
                      : 'bg-brand-blush text-brand-primary'
                  }`}
                >
                  {cat.product_line === 'fresh' ? 'Lini Segar' : 'Lini Abadi'}
                </span>
                <span className="text-[11px] text-ink-muted">#{cat.sort_order}</span>
              </div>
              <h3 className="mt-1 font-serif text-xl font-semibold text-ink-primary">{cat.name}</h3>
              <p className="line-clamp-2 text-xs text-ink-secondary">{cat.description}</p>
              {isManager && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(cat)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
