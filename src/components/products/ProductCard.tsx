import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import type { PublicProduct } from '@/types/database';
import { formatRupiah } from '@/utils/format';

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const wishlisted = isWishlisted(product.id);
  const primaryImage =
    product.images.find((i) => i.is_primary)?.image_url ||
    product.images[0]?.image_url ||
    '/images/hero-abadikala.jpg';

  const isOutOfStock =
    product.is_stock_configured && !product.allow_backorder && product.stock_quantity <= 0;

  const handleAddToCart = () => {
    const res = addItem(product, 1, product.variants[0] || null, null);
    if (!res.ok) {
      showToast(res.message || 'Tidak dapat menambahkan ke keranjang.', 'info');
      return;
    }
    showToast(`${product.name} ditambahkan ke keranjang.`);
  };

  const handleWishlist = () => {
    const added = toggleWishlist(product.id);
    showToast(
      added ? `${product.name} disimpan ke wishlist.` : `${product.name} dihapus dari wishlist.`,
      'info'
    );
  };

  return (
    <article className="group card-editorial flex flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
        <Link to={`/produk/${product.slug}`} className="block h-full w-full">
          <img
            src={primaryImage}
            alt={product.images[0]?.alt_text || product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm ${
              product.product_line === 'fresh'
                ? 'bg-brand-sage-soft/95 text-brand-sage'
                : 'bg-brand-blush/95 text-brand-primary'
            }`}
          >
            {product.product_line === 'fresh' ? 'Lini Segar' : 'Lini Abadi'}
          </span>
          {product.is_best_seller && (
            <span className="rounded-full bg-brand-primary/90 px-2.5 py-0.5 text-[11px] font-medium text-white">
              Best Seller
            </span>
          )}
          {product.is_new_arrival && !product.is_best_seller && (
            <span className="rounded-full bg-surface-card/95 px-2.5 py-0.5 text-[11px] font-medium text-ink-primary">
              Baru
            </span>
          )}
        </div>

        {/* Wishlist toggle */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
            wishlisted
              ? 'border-brand-primary bg-brand-primary text-white'
              : 'border-white/70 bg-surface-card/90 text-ink-primary hover:border-brand-primary hover:text-brand-primary'
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-ink-secondary">
          <span className="truncate">{product.category_name || 'Koleksi Abadikala'}</span>
          {product.average_rating !== null && product.review_count > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-ink-primary">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {product.average_rating} ({product.review_count})
            </span>
          )}
        </div>

        <Link
          to={`/produk/${product.slug}`}
          className="mt-1.5 font-serif text-xl font-semibold leading-snug text-ink-primary transition-colors hover:text-brand-primary"
        >
          {product.name}
        </Link>

        {product.short_description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-secondary">
            {product.short_description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {product.is_price_on_request || product.selling_price === null ? (
                <p className="text-sm font-semibold text-brand-primary">Harga Menyesuaikan</p>
              ) : (
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-semibold text-brand-primary">
                    {formatRupiah(product.selling_price)}
                  </p>
                  {product.compare_at_price && product.compare_at_price > product.selling_price && (
                    <span className="text-xs text-ink-muted line-through">
                      {formatRupiah(product.compare_at_price)}
                    </span>
                  )}
                </div>
              )}
              {product.price_unit && product.selling_price !== null && (
                <p className="text-[11px] text-ink-muted">per {product.price_unit}</p>
              )}
            </div>

            <span className="text-[11px] text-ink-secondary">
              {isOutOfStock
                ? 'Stok Habis'
                : product.is_stock_configured
                  ? `Stok: ${product.stock_quantity}`
                  : 'Made to order'}
            </span>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <Link
              to={`/produk/${product.slug}`}
              className="flex-1 rounded-full border border-line-subtle px-3 py-2 text-center text-xs font-medium text-ink-primary transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              Detail
            </Link>
            {product.is_price_on_request || product.selling_price === null ? (
              <Link
                to={`/custom-order?produk=${encodeURIComponent(product.name)}`}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-primary-hover"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Request
              </Link>
            ) : (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Tambah
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
