import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Flower2,
  Gift,
  Heart,
  HeartHandshake,
  Palette,
  PenLine,
  Sparkles,
  Star,
  ExternalLink,
  Send,
} from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState, ProductGridSkeleton } from '@/components/common/EmptyState';
import { OCCASIONS } from '@/constants/abadikala';
import {
  useBusinessSettings,
  useGallery,
  useHomepageSections,
  usePageTitle,
  usePublicProducts,
  useTestimonials,
} from '@/hooks/useStoreQueries';
import { subscribeNewsletter } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export function HomePage() {
  usePageTitle(
    'Segar Hari Ini, Abadi Selamanya',
    'Abadikala Fresh Flowers — Florist modern di Lhokseumawe, Aceh yang menghadirkan bunga segar dan produk bunga awetan.'
  );

  const { data: sections } = useHomepageSections();
  const { data: products, isLoading: loadingProducts } = usePublicProducts({ sortBy: 'featured' });
  const { data: gallery } = useGallery();
  const { data: testimonials } = useTestimonials();
  const { data: settings } = useBusinessSettings();
  const { showToast } = useToast();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const getSection = (key: string) => sections?.find((s) => s.section_key === key);
  const hero = getSection('hero');
  const brandIntro = getSection('brand_intro');
  const brandStory = getSection('brand_story');
  const newsletterSection = getSection('newsletter');

  const bestSellers = (products || []).filter((p) => p.is_best_seller).slice(0, 4);
  const displayFeatured = bestSellers.length > 0 ? bestSellers : (products || []).slice(0, 4);

  const servicesConfig = settings?.personalized_services;
  const serviceCards = [
    {
      key: 'handwritten_card',
      enabled: servicesConfig?.handwritten_card ?? true,
      icon: PenLine,
      title: 'Kartu Ucapan Tulisan Tangan',
      desc: 'Sampaikan pesan personal Anda dengan tulisan tangan yang hangat pada setiap rangkaian.',
    },
    {
      key: 'custom_bouquet',
      enabled: servicesConfig?.custom_bouquet ?? true,
      icon: Sparkles,
      title: 'Custom Bouquet',
      desc: 'Sesuaikan ukuran, nuansa warna, jenis bunga, dan budget untuk momen istimewa Anda.',
    },
    {
      key: 'color_request',
      enabled: servicesConfig?.color_request ?? true,
      icon: Palette,
      title: 'Request Warna Bunga',
      desc: 'Pilih palet romantis mulai dari blush lembut, burgundy elegan, hingga cream natural.',
    },
    {
      key: 'bouquet_preservation',
      enabled: servicesConfig?.bouquet_preservation ?? true,
      icon: Flower2,
      title: 'Pengawetan Buket',
      desc: 'Ubah buket wisuda, lamaran, atau pernikahan Anda menjadi bingkai dan karya awetan.',
    },
    {
      key: 'gift_arrangement',
      enabled: servicesConfig?.gift_arrangement ?? false,
      icon: Gift,
      title: 'Gift Arrangement',
      desc: 'Penataan hadiah personal memadukan bunga dengan kado pilihan Anda.',
    },
  ].filter((s) => s.enabled);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      showToast('Masukkan alamat email yang valid.', 'error');
      return;
    }
    setSubmittingNewsletter(true);
    try {
      await subscribeNewsletter(newsletterEmail);
      setNewsletterEmail('');
      showToast('Terima kasih! Email Anda telah terdaftar.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mendaftar newsletter.', 'error');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  return (
    <div>
      {/* HERO SECTION */}
      {hero?.is_active !== false && (
        <section className="relative overflow-hidden border-b border-line-subtle bg-surface-muted/40">
          <div className="container-editorial grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-secondary/40 bg-brand-blush/70 px-3.5 py-1 text-xs font-medium tracking-wide text-brand-primary">
                <Flower2 className="h-3.5 w-3.5" />
                Abadikala Fresh Flowers • Lhokseumawe, Aceh
              </span>
              <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.08] text-ink-primary sm:text-6xl">
                {hero?.title || 'Setiap Bunga Punya Cerita.'}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-secondary sm:text-lg">
                {hero?.subtitle ||
                  'Rayakan momen berharga dengan rangkaian bunga segar dan kenangan indah yang dapat diabadikan bersama Abadikala.'}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to={String(hero?.content?.primary_cta_url || '/shop')}
                  className="btn-primary px-7 py-3.5"
                >
                  {String(hero?.content?.primary_cta_label || 'Belanja Sekarang')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to={String(hero?.content?.secondary_cta_url || '/koleksi/fresh')}
                  className="btn-secondary px-7 py-3.5"
                >
                  {String(hero?.content?.secondary_cta_label || 'Jelajahi Koleksi')}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-subtle pt-6 text-xs text-ink-secondary">
                <span>• Kualitas Premium, Harga Bersahabat</span>
                <span>• Lini Segar & Lini Abadi</span>
                <span>• Custom Bouquet Personal</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-[2rem] border border-line-subtle bg-surface-card p-2.5 shadow-elevated">
                <img
                  src={String(hero?.content?.image_url || '/images/hero-abadikala.jpg')}
                  alt="Rangkaian bunga segar editorial Abadikala Fresh Flowers"
                  className="aspect-[16/11] w-full rounded-[1.5rem] object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/60 bg-surface-base/90 px-5 py-3.5 backdrop-blur-md sm:right-auto sm:max-w-xs">
                  <p className="font-serif text-lg font-semibold text-brand-primary">
                    Segar Hari Ini, Abadi Selamanya
                  </p>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    Dari rangkaian bunga segar pilihan hingga karya bunga awetan penuh makna.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OFFICIAL BRAND CORE VALUES STRIP (from Logo Brand Guide: Forest Green #1F3D2F) */}
      <section className="bg-brand-forest py-5 text-[#F6F1E7]">
        <div className="container-editorial grid grid-cols-1 gap-4 text-center sm:grid-cols-3 sm:divide-x sm:divide-white/15">
          <div className="flex items-center justify-center gap-3 px-4 py-1">
            <Flower2 className="h-5 w-5 shrink-0 text-[#D9A9A3]" />
            <span className="text-xs font-medium tracking-wide sm:text-sm">
              Keindahan dalam Setiap Momen
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 px-4 py-1">
            <Clock className="h-5 w-5 shrink-0 text-[#D9A9A3]" />
            <span className="text-xs font-medium tracking-wide sm:text-sm">
              Ketahanan Sepanjang Waktu
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 px-4 py-1">
            <Heart className="h-5 w-5 shrink-0 text-[#D9A9A3]" />
            <span className="text-xs font-medium tracking-wide sm:text-sm">
              Kehangatan untuk Selamanya
            </span>
          </div>
        </div>
      </section>

      {/* BRAND INTRODUCTION */}
      {brandIntro?.is_active !== false && (
        <section className="py-16 lg:py-24">
          <div className="container-editorial">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
                Filosofi Abadikala
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
                {brandIntro?.title || 'Satu bunga, dua bentuk keindahan.'}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-secondary">
                {brandIntro?.subtitle ||
                  'Makna Abadikala berasal dari "abadi" dan "kala"—waktu yang diabadikan. Bunga bukan sekadar hadiah sesaat, tetapi cara lembut menyimpan kenangan dan menyampaikan perasaan.'}
              </p>
            </div>

            {/* FEATURED COLLECTIONS: LINI SEGAR & LINI ABADI */}
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Lini Segar */}
              <div className="group card-editorial overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-12">
                  <div className="aspect-[4/5] overflow-hidden sm:col-span-5 sm:aspect-auto">
                    <img
                      src="/images/lini-segar.jpg"
                      alt="Koleksi Lini Segar Abadikala"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-7 sm:col-span-7">
                    <div>
                      <span className="inline-block rounded-full bg-brand-sage-soft px-3 py-1 text-xs font-medium text-brand-sage">
                        Untuk Dinikmati Hari Ini
                      </span>
                      <h3 className="mt-3 font-serif text-3xl font-semibold text-ink-primary">
                        {String(brandIntro?.content?.fresh_title || 'Lini Segar')}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                        {String(
                          brandIntro?.content?.fresh_desc ||
                            'Rangkaian bunga segar pilihan dengan tampilan elegan dan harga terjangkau.'
                        )}
                      </p>
                      <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-ink-primary">
                        <li>• Buket kecil</li>
                        <li>• Buket besar Korea</li>
                        <li>• Flower bar</li>
                        <li>• Bunga meja langganan</li>
                      </ul>
                    </div>
                    <Link
                      to="/koleksi/fresh"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
                    >
                      Lihat Lini Segar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Lini Abadi */}
              <div className="group card-editorial overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-12">
                  <div className="aspect-[4/5] overflow-hidden sm:col-span-5 sm:aspect-auto">
                    <img
                      src="/images/lini-abadi.jpg"
                      alt="Koleksi Lini Abadi Abadikala"
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-7 sm:col-span-7">
                    <div>
                      <span className="inline-block rounded-full bg-brand-blush px-3 py-1 text-xs font-medium text-brand-primary">
                        Kenangan yang Tersimpan
                      </span>
                      <h3 className="mt-3 font-serif text-3xl font-semibold text-ink-primary">
                        {String(brandIntro?.content?.preserved_title || 'Lini Abadi')}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                        {String(
                          brandIntro?.content?.preserved_desc ||
                            'Bunga awetan dan jasa pengawetan buket agar momen terindah Anda tetap abadi.'
                        )}
                      </p>
                      <ul className="mt-4 grid grid-cols-2 gap-1.5 text-xs text-ink-primary">
                        <li>• Buket bunga kering</li>
                        <li>• Bingkai pressed flower</li>
                        <li>• Plakat akrilik</li>
                        <li>• Shadow-box</li>
                        <li>• Mawar kubah kaca</li>
                        <li>• Resin & pengawetan</li>
                      </ul>
                    </div>
                    <Link
                      to="/koleksi/preserved"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
                    >
                      Lihat Lini Abadi
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BEST SELLER / PRODUK UNGGULAN */}
      <section className="border-y border-line-subtle bg-surface-muted/45 py-16 lg:py-24">
        <div className="container-editorial">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
                Pilihan Favorit
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-ink-primary">
                Koleksi Unggulan Abadikala
              </h2>
            </div>
            <Link to="/shop" className="btn-secondary">
              Lihat Semua Produk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10">
            {loadingProducts ? (
              <ProductGridSkeleton count={4} />
            ) : displayFeatured.length === 0 ? (
              <EmptyState
                title="Katalog sedang disiapkan"
                description="Produk unggulan akan segera tampil setelah diaktifkan oleh admin."
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {displayFeatured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SHOP BY OCCASION */}
      <section className="py-16 lg:py-24">
        <div className="container-editorial">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
              Rayakan Setiap Momen
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-ink-primary">
              Belanja Berdasarkan Acara
            </h2>
            <p className="mt-3 text-sm text-ink-secondary">
              Temukan rangkaian yang selaras dengan suasana hati dan momen spesial orang terkasih.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {OCCASIONS.map((occasion) => (
              <Link
                key={occasion}
                to={`/shop?occasion=${encodeURIComponent(occasion)}`}
                className="group flex items-center justify-between rounded-2xl border border-line-subtle bg-surface-card px-5 py-4 transition-all hover:border-brand-primary/40 hover:bg-brand-blush/35"
              >
                <span className="font-serif text-xl font-medium text-ink-primary group-hover:text-brand-primary">
                  {occasion}
                </span>
                <ArrowRight className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY: DARI SEGAR MENJADI ABADI */}
      {brandStory?.is_active !== false && (
        <section className="border-y border-line-subtle bg-brand-blush/30 py-16 lg:py-24">
          <div className="container-editorial grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-[2rem] border border-line-subtle bg-surface-card p-2 shadow-soft">
                <img
                  src={String(brandStory?.content?.image_url || '/images/product-jasa-pengawetan.jpg')}
                  alt="Proses pengawetan bunga segar menjadi bunga abadi di studio Abadikala"
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded-[1.5rem] object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7 lg:pl-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-card px-3.5 py-1 text-xs font-medium text-brand-primary shadow-sm">
                <HeartHandshake className="h-3.5 w-3.5" />
                Keunikan Abadikala
              </span>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
                {brandStory?.title || 'Dari Segar Menjadi Abadi.'}
              </h2>
              <p className="mt-3 font-serif text-xl italic text-brand-primary">
                {brandStory?.subtitle}
              </p>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-secondary sm:text-base">
                {(Array.isArray(brandStory?.content?.paragraphs)
                  ? (brandStory.content.paragraphs as string[])
                  : [
                      'Di Abadikala, bunga segar yang tidak terjual maupun buket penuh kenangan milik pelanggan dapat diolah menjadi karya seni awetan yang penuh makna.',
                    ]
                ).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line-subtle bg-surface-card p-3.5">
                  <p className="text-xs font-semibold text-brand-primary">Bunga Tidak Terbuang</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-secondary">
                    Bunga sisa dan buket pelanggan diolah menjadi karya awetan bernilai.
                  </p>
                </div>
                <div className="rounded-2xl border border-line-subtle bg-surface-card p-3.5">
                  <p className="text-xs font-semibold text-brand-primary">Kenangan Bisa Disimpan</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-secondary">
                    Bunga dari momen penting diabadikan bertahun-tahun dalam bingkai & kubah.
                  </p>
                </div>
                <div className="rounded-2xl border border-line-subtle bg-surface-card p-3.5">
                  <p className="text-xs font-semibold text-brand-primary">Kado Siap Kirim</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-secondary">
                    Gift set kotak kraft produk awetan siap dikirim online ke luar kota.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/produk/jasa-pengawetan-buket" className="btn-primary">
                  Pelajari Jasa Pengawetan Buket
                </Link>
                <Link to="/about" className="btn-secondary">
                  Kisah Kami Selengkapnya
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PERSONALIZED SERVICES */}
      {serviceCards.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container-editorial">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
                  Layanan Personal
                </p>
                <h2 className="mt-2 font-serif text-4xl font-semibold text-ink-primary">
                  Dirangkai Khusus untuk Cerita Anda
                </h2>
              </div>
              <Link to="/custom-order" className="btn-primary">
                Buat Custom Order
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {serviceCards.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.key} className="card-editorial p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blush text-brand-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-serif text-2xl font-semibold text-ink-primary">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{service.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS (Real database entries only — transparent empty state when none exist) */}
      <section className="border-t border-line-subtle bg-surface-muted/35 py-16">
        <div className="container-editorial">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
              Cerita Pelanggan
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-ink-primary">
              Ulasan Nyata dari Pelanggan Abadikala
            </h2>
          </div>

          <div className="mt-10">
            {testimonials && testimonials.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {testimonials.map((t) => (
                  <blockquote key={t.id} className="card-editorial flex flex-col justify-between p-6">
                    <div>
                      {t.rating && (
                        <div className="mb-3 flex gap-1 text-amber-400">
                          {Array.from({ length: t.rating }).map((_, idx) => (
                            <Star key={idx} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      )}
                      <p className="font-serif text-lg italic leading-relaxed text-ink-primary">
                        "{t.quote}"
                      </p>
                    </div>
                    <footer className="mt-5 border-t border-line-subtle pt-4 text-xs">
                      <p className="font-semibold text-ink-primary">{t.customer_name}</p>
                      {t.occasion && <p className="text-ink-secondary">{t.occasion}</p>}
                    </footer>
                  </blockquote>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Belum ada ulasan terpublikasi"
                description="Abadikala hanya menampilkan ulasan asli dari pelanggan yang telah menyelesaikan pesanan. Jadilah bagian dari cerita pertama kami."
                action={
                  <Link to="/shop" className="btn-secondary">
                    Mulai Berbelanja
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* STUDIO VISUAL GALLERY (CMS Managed — no fabricated Instagram account) */}
      {gallery && gallery.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="container-editorial">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
                Galeri Karya
              </p>
              <h2 className="mt-2 font-serif text-4xl font-semibold text-ink-primary">
                Potret Keindahan dari Studio Abadikala
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {gallery.map((item) => (
                <figure
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-card"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = '1';
                        e.currentTarget.src = '/images/hero-abadikala.jpg';
                      }
                    }}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-primary/80 via-ink-primary/30 to-transparent p-4 text-white">
                    <p className="font-serif text-lg font-medium">{item.title}</p>
                    {item.caption && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-white/85">{item.caption}</p>
                    )}
                    {item.external_link && (
                      <a
                        href={item.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-blush hover:underline"
                      >
                        Lihat Postingan <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEWSLETTER */}
      {newsletterSection?.is_active !== false && (
        <section className="border-t border-line-subtle bg-brand-primary py-14 text-white">
          <div className="container-editorial flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
                {newsletterSection?.title || 'Kabar Hangat dari Studio Abadikala'}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {newsletterSection?.subtitle ||
                  'Berlangganan untuk menerima informasi koleksi terbaru dan panduan merawat bunga.'}
              </p>
            </div>
            <form
              onSubmit={handleNewsletter}
              className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Masukkan alamat email Anda"
                className="flex-1 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/65 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={submittingNewsletter}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-surface-base px-6 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-blush disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submittingNewsletter ? 'Mengirim...' : 'Berlangganan'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
