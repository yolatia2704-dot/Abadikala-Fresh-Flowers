import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Clock,
  Heart,
  Info,
  Leaf,
  Minus,
  Plus,
  Ruler,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import {
  useBusinessSettings,
  usePageTitle,
  useProductReviews,
  usePublicProduct,
  usePublicProducts,
} from '@/hooks/useStoreQueries';
import type { ProductVariant } from '@/types/database';
import { formatDate, formatRupiah } from '@/utils/format';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading } = usePublicProduct(slug);
  const { data: allProducts } = usePublicProducts();
  const { data: reviews } = useProductReviews(product?.id);
  const { data: settings } = useBusinessSettings();

  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState('');

  usePageTitle(
    product?.seo_title || product?.name || 'Detail Produk',
    product?.seo_description || product?.short_description || undefined
  );

  useEffect(() => {
    if (product) {
      const primary =
        product.images.find((i) => i.is_primary)?.image_url ||
        product.images[0]?.image_url ||
        '/images/hero-abadikala.jpg';
      setSelectedImage(primary);
      setSelectedVariant(product.variants[0] || null);
      setQuantity(1);
      setCustomNotes('');
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-editorial py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="aspect-[3/4] animate-pulse rounded-3xl bg-surface-muted lg:col-span-6" />
          <div className="space-y-4 lg:col-span-6">
            <div className="h-6 w-32 animate-pulse rounded bg-surface-muted" />
            <div className="h-12 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-editorial py-16">
        <EmptyState
          title="Produk tidak ditemukan"
          description="Produk yang Anda cari mungkin sudah tidak tersedia atau alamat tautannya berubah."
          action={
            <Link to="/shop" className="btn-primary">
              Kembali ke Katalog
            </Link>
          }
        />
      </div>
    );
  }

  const effectivePrice =
    product.selling_price !== null
      ? product.selling_price + (selectedVariant?.price_delta || 0)
      : null;

  const isOutOfStock =
    product.is_stock_configured && !product.allow_backorder && product.stock_quantity <= 0;

  const wishlisted = isWishlisted(product.id);
  const related = (allProducts || [])
    .filter((p) => p.id !== product.id && p.product_line === product.product_line)
    .slice(0, 4);

  const handleAdd = () => {
    const res = addItem(product, quantity, selectedVariant, customNotes);
    if (!res.ok) {
      showToast(res.message || 'Gagal menambahkan produk.', 'info');
      return;
    }
    showToast(`${product.name} (${quantity}x) masuk ke keranjang.`);
  };

  // Structured Data JSON-LD (only valid public fields)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || product.description,
    image: selectedImage,
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: 'Abadikala Fresh Flowers' },
    ...(effectivePrice !== null
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'IDR',
            price: effectivePrice,
            availability: isOutOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          },
        }
      : {}),
  };

  return (
    <div className="py-8 lg:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-editorial">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink-secondary">
          <Link to="/" className="hover:text-brand-primary">Beranda</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/shop" className="hover:text-brand-primary">Produk</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            to={`/koleksi/${product.product_line}`}
            className="hover:text-brand-primary"
          >
            {product.product_line === 'fresh' ? 'Lini Segar' : 'Lini Abadi'}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-ink-primary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-3xl border border-line-subtle bg-surface-card p-2 shadow-card">
              <img
                src={selectedImage}
                alt={product.name}
                className="aspect-[3/4] w-full rounded-2xl object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImage === img.image_url
                        ? 'border-brand-primary'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || product.name}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Actions */}
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  product.product_line === 'fresh'
                    ? 'bg-brand-sage-soft text-brand-sage'
                    : 'bg-brand-blush text-brand-primary'
                }`}
              >
                {product.product_line === 'fresh' ? 'Lini Segar' : 'Lini Abadi'}
              </span>
              {product.category_name && (
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-ink-secondary">
                  {product.category_name}
                </span>
              )}
              {product.is_best_seller && (
                <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-medium text-white">
                  Best Seller
                </span>
              )}
            </div>

            <h1 className="mt-3 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              {product.is_price_on_request || effectivePrice === null ? (
                <span className="text-2xl font-semibold text-brand-primary">
                  Harga Menyesuaikan Pilihan Bunga
                </span>
              ) : (
                <>
                  <span className="text-3xl font-semibold text-brand-primary">
                    {formatRupiah(effectivePrice)}
                  </span>
                  {product.price_unit && (
                    <span className="text-sm text-ink-secondary">/ {product.price_unit}</span>
                  )}
                  {product.compare_at_price && product.compare_at_price > effectivePrice && (
                    <span className="text-base text-ink-muted line-through">
                      {formatRupiah(product.compare_at_price)}
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-ink-secondary sm:text-base">
              {product.description || product.short_description}
            </p>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                  Pilih Varian
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-line-subtle bg-surface-card text-ink-primary hover:border-brand-primary'
                      }`}
                    >
                      {variant.name}
                      {variant.price_delta !== 0 &&
                        ` (${variant.price_delta > 0 ? '+' : ''}${formatRupiah(variant.price_delta)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customization */}
            {product.is_customizable && !product.is_price_on_request && (
              <div className="mt-6">
                <label
                  htmlFor="custom-notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary"
                >
                  Catatan Personalisasi (Opsional)
                </label>
                <textarea
                  id="custom-notes"
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder={
                    product.customization_prompt ||
                    'Tulis request nuansa warna, nama/gelar, atau catatan khusus...'
                  }
                  className="input-field mt-2"
                />
              </div>
            )}

            {/* Quantity & CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {!product.is_price_on_request && effectivePrice !== null ? (
                <>
                  <div className="inline-flex items-center rounded-full border border-line-subtle bg-surface-card px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="rounded-full p-2 text-ink-secondary hover:bg-surface-muted hover:text-brand-primary"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="rounded-full p-2 text-ink-secondary hover:bg-surface-muted hover:text-brand-primary"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAdd}
                    className="btn-primary flex-1 py-3.5"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {isOutOfStock ? 'Stok Sedang Habis' : 'Tambah ke Keranjang'}
                  </button>
                </>
              ) : (
                <Link
                  to={`/custom-order?produk=${encodeURIComponent(product.name)}`}
                  className="btn-primary flex-1 py-3.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Konsultasi & Request via Custom Order
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  const added = toggleWishlist(product.id);
                  showToast(
                    added ? 'Disimpan ke wishlist.' : 'Dihapus dari wishlist.',
                    'info'
                  );
                }}
                aria-label="Simpan ke wishlist"
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                  wishlisted
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-line-subtle bg-surface-card text-ink-primary hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Product Specs */}
            <div className="mt-8 space-y-4 rounded-2xl border border-line-subtle bg-surface-card p-5 text-sm">
              <div className="flex items-start gap-3">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-brand-sage" />
                <div>
                  <p className="font-semibold text-ink-primary">Detail Bahan</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                    {product.materials || 'Menyesuaikan kurasi bunga terbaik yang tersedia.'}
                  </p>
                </div>
              </div>
              {product.dimensions && (
                <div className="flex items-start gap-3">
                  <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <div>
                    <p className="font-semibold text-ink-primary">Ukuran / Dimensi</p>
                    <p className="mt-0.5 text-xs text-ink-secondary">{product.dimensions}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <div>
                  <p className="font-semibold text-ink-primary">Estimasi Pengerjaan & Stok</p>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    {product.processing_estimate || 'Dikonfirmasi oleh admin setelah pemesanan.'} •{' '}
                    {product.is_stock_configured
                      ? `Stok tersedia: ${product.stock_quantity}`
                      : 'Dirangkai berdasarkan pesanan (made-to-order)'}
                  </p>
                </div>
              </div>
              {product.care_instructions && (
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
                  <div>
                    <p className="font-semibold text-ink-primary">Instruksi Perawatan</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                      {product.care_instructions}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 border-t border-line-subtle pt-4">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-sage" />
                <div>
                  <p className="font-semibold text-ink-primary">Informasi Pengiriman</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                    {settings?.delivery_policy?.is_configured
                      ? `${settings.delivery_policy.service_areas || 'Lhokseumawe & sekitarnya'} • ${settings.delivery_policy.courier_info || ''}`
                      : 'Wilayah jangkauan, kurir, dan ongkos kirim mengikuti konfigurasi operasional yang dikonfirmasi admin saat checkout.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Verified Reviews */}
        <section className="mt-16 border-t border-line-subtle pt-12">
          <h2 className="font-serif text-3xl font-semibold text-ink-primary">Ulasan Pelanggan</h2>
          {reviews && reviews.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {reviews.map((rev) => (
                <div key={rev.id} className="card-editorial p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-primary">{rev.reviewer_name}</p>
                    <span className="text-xs text-ink-muted">{formatDate(rev.created_at)}</span>
                  </div>
                  <div className="mt-1 flex gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  {rev.comment && (
                    <p className="mt-2.5 text-sm leading-relaxed text-ink-secondary">{rev.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-secondary">
              Belum ada ulasan terverifikasi untuk produk ini.
            </p>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-line-subtle pt-12">
            <h2 className="font-serif text-3xl font-semibold text-ink-primary">Produk Terkait</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
