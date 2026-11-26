import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  useGallery,
  useHomepageSections,
  usePageTitle,
  useTestimonials,
} from '@/hooks/useStoreQueries';
import {
  deleteTestimonial,
  saveGalleryItems,
  saveTestimonial,
  updateHomepageSection,
} from '@/services/api';
import type { GalleryItem } from '@/types/database';

export function AdminCmsPage() {
  usePageTitle('CMS Konten Website — Admin');
  const { user, isManager } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: sections = [] } = useHomepageSections();
  const { data: galleryData = [] } = useGallery(true);
  const { data: testimonials = [] } = useTestimonials(true);

  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [storySubtitle, setStorySubtitle] = useState('');
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const [newTesti, setNewTesti] = useState({
    customer_name: '',
    occasion: 'Wisuda',
    rating: 5,
    quote: '',
    is_published: true,
  });

  useEffect(() => {
    const ann = sections.find((s) => s.section_key === 'announcement_bar');
    const hero = sections.find((s) => s.section_key === 'hero');
    const story = sections.find((s) => s.section_key === 'brand_story');
    if (ann) {
      setAnnouncementText(String(ann.content?.text || ''));
      setAnnouncementActive(ann.is_active);
    }
    if (hero) {
      setHeroTitle(hero.title || '');
      setHeroSubtitle(hero.subtitle || '');
    }
    if (story) {
      setStoryTitle(story.title || '');
      setStorySubtitle(story.subtitle || '');
    }
  }, [sections]);

  useEffect(() => {
    setGallery(galleryData);
  }, [galleryData]);

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const actor = { email: user.email, role: user.role };
    const heroSec = sections.find((s) => s.section_key === 'hero');
    const storySec = sections.find((s) => s.section_key === 'brand_story');

    await updateHomepageSection(
      'announcement_bar',
      { is_active: announcementActive, content: { text: announcementText } },
      actor
    );
    await updateHomepageSection(
      'hero',
      { title: heroTitle, subtitle: heroSubtitle, content: heroSec?.content || {} },
      actor
    );
    await updateHomepageSection(
      'brand_story',
      { title: storyTitle, subtitle: storySubtitle, content: storySec?.content || {} },
      actor
    );
    await qc.invalidateQueries({ queryKey: ['homepage-sections'] });
    showToast('Konten homepage berhasil diperbarui.');
  };

  const handleSaveGallery = async () => {
    if (!user) return;
    await saveGalleryItems(gallery, { email: user.email, role: user.role });
    await qc.invalidateQueries({ queryKey: ['gallery'] });
    showToast('Galeri visual berhasil diperbarui.');
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTesti.customer_name.trim() || !newTesti.quote.trim()) return;
    await saveTestimonial(newTesti, { email: user.email, role: user.role });
    await qc.invalidateQueries({ queryKey: ['testimonials'] });
    setNewTesti({ customer_name: '', occasion: 'Wisuda', rating: 5, quote: '', is_published: true });
    showToast('Testimoni terverifikasi ditambahkan.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-ink-primary">
          Manajemen Konten Website (CMS)
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Perbarui announcement bar, hero homepage, cerita brand, galeri karya, dan testimoni
          pelanggan asli tanpa menyentuh source code.
        </p>
      </div>

      {/* Homepage Sections */}
      <form onSubmit={handleSaveHomepage} className="card-editorial space-y-5 p-6 text-xs">
        <h2 className="font-serif text-2xl font-semibold text-ink-primary">
          Announcement Bar, Hero & Brand Story
        </h2>
        <div className="space-y-3 rounded-2xl bg-surface-base p-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-ink-secondary">Teks Announcement Bar</label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
              />
              Tampilkan di Header
            </label>
          </div>
          <input
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="input-field text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Judul Hero</label>
            <input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Judul Brand Story</label>
            <input
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              className="input-field text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Subheadline Hero</label>
            <textarea
              rows={2}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">
              Subheadline Brand Story
            </label>
            <textarea
              rows={2}
              value={storySubtitle}
              onChange={(e) => setStorySubtitle(e.target.value)}
              className="input-field text-xs"
            />
          </div>
        </div>

        {isManager && (
          <button type="submit" className="btn-primary py-2.5 text-xs">
            <Save className="h-4 w-4" />
            Simpan Konten Homepage
          </button>
        )}
      </form>

      {/* Gallery Editor */}
      <div className="card-editorial space-y-4 p-6 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink-primary">
              Galeri Visual Studio & Tautan Sosial
            </h2>
            <p className="text-ink-secondary">
              Kelola gambar karya Abadikala dan tautan postingan sosial secara manual.
            </p>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() =>
                setGallery((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    title: 'Karya Baru Abadikala',
                    caption: '',
                    image_url: '/images/hero-abadikala.jpg',
                    external_link: null,
                    category_tag: 'Lini Segar',
                    is_active: true,
                    sort_order: prev.length + 1,
                  },
                ])
              }
              className="btn-secondary py-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Foto
            </button>
          )}
        </div>

        <div className="space-y-3">
          {gallery.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-line-subtle bg-surface-base p-3 sm:grid-cols-12"
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="h-14 w-14 rounded-lg object-cover sm:col-span-1"
              />
              <input
                value={item.title}
                onChange={(e) => {
                  const next = [...gallery];
                  next[idx] = { ...item, title: e.target.value };
                  setGallery(next);
                }}
                placeholder="Judul"
                className="input-field text-xs sm:col-span-3"
              />
              <input
                value={item.image_url}
                onChange={(e) => {
                  const next = [...gallery];
                  next[idx] = { ...item, image_url: e.target.value };
                  setGallery(next);
                }}
                placeholder="URL Gambar"
                className="input-field text-xs sm:col-span-4"
              />
              <input
                value={item.external_link || ''}
                onChange={(e) => {
                  const next = [...gallery];
                  next[idx] = { ...item, external_link: e.target.value || null };
                  setGallery(next);
                }}
                placeholder="Tautan Instagram/Sosial (opsional)"
                className="input-field text-xs sm:col-span-3"
              />
              <button
                type="button"
                onClick={() => setGallery((prev) => prev.filter((g) => g.id !== item.id))}
                className="justify-self-end rounded-lg p-2 text-rose-600 hover:bg-rose-50 sm:col-span-1"
                aria-label="Hapus item galeri"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {isManager && (
          <button type="button" onClick={handleSaveGallery} className="btn-primary py-2 text-xs">
            <Save className="h-4 w-4" /> Simpan Galeri
          </button>
        )}
      </div>

      {/* Verified Testimonials Manager */}
      <div className="card-editorial space-y-4 p-6 text-xs">
        <h2 className="font-serif text-2xl font-semibold text-ink-primary">
          Testimoni Pelanggan Nyata
        </h2>
        <p className="text-ink-secondary">
          Hanya tambahkan ulasan nyata dari pelanggan Abadikala yang telah bertransaksi.
        </p>

        {isManager && (
          <form onSubmit={handleAddTestimonial} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <input
              required
              placeholder="Nama Pelanggan"
              value={newTesti.customer_name}
              onChange={(e) => setNewTesti({ ...newTesti, customer_name: e.target.value })}
              className="input-field text-xs sm:col-span-3"
            />
            <input
              placeholder="Acara (mis: Wisuda)"
              value={newTesti.occasion}
              onChange={(e) => setNewTesti({ ...newTesti, occasion: e.target.value })}
              className="input-field text-xs sm:col-span-2"
            />
            <input
              required
              placeholder="Kutipan ulasan asli pelanggan..."
              value={newTesti.quote}
              onChange={(e) => setNewTesti({ ...newTesti, quote: e.target.value })}
              className="input-field text-xs sm:col-span-5"
            />
            <button type="submit" className="btn-primary py-2 text-xs sm:col-span-2">
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          </form>
        )}

        {testimonials.length === 0 ? (
          <p className="text-ink-muted">Belum ada testimoni yang tersimpan.</p>
        ) : (
          <ul className="divide-y divide-line-subtle">
            {testimonials.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold text-ink-primary">
                    {t.customer_name} {t.occasion ? `• ${t.occasion}` : ''}
                  </p>
                  <p className="mt-0.5 italic text-ink-secondary">"{t.quote}"</p>
                </div>
                {isManager && user && (
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteTestimonial(t.id, { email: user.email, role: user.role });
                      await qc.invalidateQueries({ queryKey: ['testimonials'] });
                      showToast('Testimoni dihapus.', 'info');
                    }}
                    className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                    aria-label="Hapus testimoni"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
