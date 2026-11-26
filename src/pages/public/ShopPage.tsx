import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState, ProductGridSkeleton } from '@/components/common/EmptyState';
import { OCCASIONS } from '@/constants/abadikala';
import { useCategories, usePageTitle, usePublicProducts } from '@/hooks/useStoreQueries';

const PAGE_SIZE = 8;

export function ShopPage() {
  const { line: routeLine } = useParams<{ line?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialLine =
    routeLine === 'fresh' || routeLine === 'preserved'
      ? routeLine
      : (searchParams.get('line') as 'all' | 'fresh' | 'preserved') || 'all';

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [line, setLine] = useState<'all' | 'fresh' | 'preserved'>(initialLine);
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') || '');
  const [occasion, setOccasion] = useState(searchParams.get('occasion') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price_asc' | 'price_desc'>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (routeLine === 'fresh' || routeLine === 'preserved') {
      setLine(routeLine);
    } else if (!routeLine) {
      setLine((searchParams.get('line') as 'all' | 'fresh' | 'preserved') || 'all');
    }
    setSearch(searchParams.get('q') || '');
    setOccasion(searchParams.get('occasion') || '');
    setCategorySlug(searchParams.get('category') || '');
  }, [routeLine, searchParams]);

  const titleText =
    line === 'fresh'
      ? 'Koleksi Lini Segar'
      : line === 'preserved'
        ? 'Koleksi Lini Abadi'
        : 'Katalog Produk';
  usePageTitle(titleText);

  const { data: categories } = useCategories();
  const { data: products, isLoading, isError } = usePublicProducts({
    search,
    line,
    categorySlug: categorySlug || undefined,
    occasion: occasion || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sortBy,
  });

  const filteredCategories = (categories || []).filter(
    (c) => line === 'all' || c.product_line === line
  );

  const paginatedProducts = (products || []).slice(0, visibleCount);
  const hasMore = (products?.length || 0) > visibleCount;

  const resetFilters = () => {
    setSearch('');
    if (!routeLine) setLine('all');
    setCategorySlug('');
    setOccasion('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="py-10 lg:py-14">
      <div className="container-editorial">
        {/* Page Header */}
        <div className="rounded-3xl border border-line-subtle bg-surface-muted/60 px-6 py-10 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
            Abadikala Fresh Flowers
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
            {titleText}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary sm:text-base">
            {line === 'fresh'
              ? 'Rangkaian bunga segar pilihan hari ini—dari buket mungil yang ramah di kantong, buket gaya Korea, bunga meja langganan, hingga Flower Bar.'
              : line === 'preserved'
                ? 'Karya bunga awetan untuk menyimpan kenangan lebih lama—buket kering, pressed flower, plakat akrilik, shadow-box, mawar kubah kaca, resin, dan jasa pengawetan buket.'
                : 'Jelajahi seluruh rangkaian Lini Segar dan Lini Abadi Abadikala dengan kualitas premium dan harga bersahabat.'}
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="mt-8 rounded-2xl border border-line-subtle bg-surface-card p-5 shadow-card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="relative md:col-span-4">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Cari nama produk atau acara..."
                className="input-field pl-10"
              />
            </div>

            {!routeLine && (
              <div className="md:col-span-2">
                <select
                  aria-label="Filter lini produk"
                  value={line}
                  onChange={(e) => {
                    setLine(e.target.value as 'all' | 'fresh' | 'preserved');
                    setCategorySlug('');
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="input-field"
                >
                  <option value="all">Semua Lini</option>
                  <option value="fresh">Lini Segar</option>
                  <option value="preserved">Lini Abadi</option>
                </select>
              </div>
            )}

            <div className={routeLine ? 'md:col-span-3' : 'md:col-span-2'}>
              <select
                aria-label="Filter kategori"
                value={categorySlug}
                onChange={(e) => {
                  setCategorySlug(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="input-field"
              >
                <option value="">Semua Kategori</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={routeLine ? 'md:col-span-2' : 'md:col-span-2'}>
              <select
                aria-label="Filter acara"
                value={occasion}
                onChange={(e) => {
                  setOccasion(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="input-field"
              >
                <option value="">Semua Acara</option>
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            <div className={routeLine ? 'md:col-span-3' : 'md:col-span-2'}>
              <select
                aria-label="Urutkan produk"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'newest' | 'price_asc' | 'price_desc')
                }
                className="input-field"
              >
                <option value="featured">Produk Unggulan</option>
                <option value="newest">Terbaru</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
            </div>
          </div>

          {/* Price Range & Reset */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Rentang Harga (Rp):</span>
              <input
                type="number"
                min={0}
                step={5000}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-28 rounded-lg border border-line-subtle bg-surface-base px-2.5 py-1.5 text-xs"
              />
              <span>–</span>
              <input
                type="number"
                min={0}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Maks"
                className="w-28 rounded-lg border border-line-subtle bg-surface-base px-2.5 py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-ink-secondary">
                Menampilkan <strong>{products?.length || 0}</strong> produk
              </span>
              {(search || categorySlug || occasion || minPrice || maxPrice || (!routeLine && line !== 'all')) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 font-medium text-ink-primary hover:bg-brand-blush hover:text-brand-primary"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : isError ? (
            <EmptyState
              title="Gagal memuat produk"
              description="Terjadi kendala saat mengambil data katalog. Silakan muat ulang halaman."
            />
          ) : paginatedProducts.length === 0 ? (
            <EmptyState
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci pencarian, kategori, atau rentang harga Anda."
              action={
                <button type="button" onClick={resetFilters} className="btn-secondary">
                  Reset Semua Filter
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="btn-secondary"
                  >
                    Muat Lebih Banyak ({(products?.length || 0) - visibleCount} tersisa)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
