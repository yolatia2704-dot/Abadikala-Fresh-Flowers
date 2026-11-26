import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle, usePublicProducts } from '@/hooks/useStoreQueries';
import { formatRupiah } from '@/utils/format';

export function WishlistPage() {
  usePageTitle('Wishlist');
  const { productIds, removeWishlist } = useWishlist();
  const { data: products } = usePublicProducts();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const savedProducts = (products || []).filter((p) => productIds.includes(p.id));

  return (
    <div className="py-10 lg:py-14">
      <div className="container-editorial">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
          Favorit Anda
        </p>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-primary">Daftar Wishlist</h1>

        <div className="mt-8">
          {savedProducts.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="Belum ada produk di wishlist"
              description="Simpan rangkaian bunga favorit Anda agar mudah ditemukan kembali kapan saja."
              action={
                <Link to="/shop" className="btn-primary">
                  Jelajahi Katalog
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {savedProducts.map((product) => {
                const img =
                  product.images.find((i) => i.is_primary)?.image_url ||
                  product.images[0]?.image_url ||
                  '/images/hero-abadikala.jpg';
                return (
                  <div key={product.id} className="card-editorial flex flex-col overflow-hidden">
                    <Link to={`/produk/${product.slug}`} className="aspect-[3/4] overflow-hidden">
                      <img
                        src={img}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <Link
                        to={`/produk/${product.slug}`}
                        className="font-serif text-xl font-semibold text-ink-primary hover:text-brand-primary"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-sm font-semibold text-brand-primary">
                        {formatRupiah(product.selling_price)}
                      </p>
                      <div className="mt-auto flex gap-2 pt-4">
                        {!product.is_price_on_request && product.selling_price !== null ? (
                          <button
                            type="button"
                            onClick={() => {
                              const res = addItem(product, 1, product.variants[0] || null);
                              if (res.ok) showToast(`${product.name} dipindahkan ke keranjang.`);
                            }}
                            className="btn-primary flex-1 px-3 py-2 text-xs"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Ke Keranjang
                          </button>
                        ) : (
                          <Link
                            to={`/custom-order?produk=${encodeURIComponent(product.name)}`}
                            className="btn-primary flex-1 px-3 py-2 text-xs"
                          >
                            Custom Order
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            removeWishlist(product.id);
                            showToast('Dihapus dari wishlist.', 'info');
                          }}
                          aria-label={`Hapus ${product.name} dari wishlist`}
                          className="rounded-full border border-line-subtle p-2 text-ink-muted hover:border-rose-300 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
