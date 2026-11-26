import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/contexts/CartContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { formatRupiah } from '@/utils/format';

export function CartPage() {
  usePageTitle('Keranjang Belanja');
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="py-10 lg:py-14">
      <div className="container-editorial">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
              Belanja Anda
            </p>
            <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-primary">
              Keranjang Belanja
            </h1>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        <div className="mt-8">
          {items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Keranjang belanja masih kosong"
              description="Tambahkan buket segar atau karya bunga awetan pilihan Anda dari katalog Abadikala."
              action={
                <Link to="/shop" className="btn-primary">
                  Belanja Sekarang
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                {items.map((item) => {
                  const img =
                    item.product.images.find((i) => i.is_primary)?.image_url ||
                    item.product.images[0]?.image_url ||
                    '/images/hero-abadikala.jpg';
                  return (
                    <div
                      key={item.id}
                      className="card-editorial flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      <img
                        src={img}
                        alt={item.product.name}
                        className="h-28 w-24 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/produk/${item.product.slug}`}
                          className="font-serif text-2xl font-semibold text-ink-primary hover:text-brand-primary"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant_name && (
                          <p className="mt-0.5 text-xs text-ink-secondary">
                            Varian: {item.variant_name}
                          </p>
                        )}
                        {item.customization_notes && (
                          <p className="mt-1 text-xs italic text-ink-secondary">
                            Catatan: {item.customization_notes}
                          </p>
                        )}
                        <p className="mt-2 text-sm font-semibold text-brand-primary">
                          {formatRupiah(item.unit_price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="inline-flex items-center rounded-full border border-line-subtle bg-surface-base">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 text-ink-secondary hover:text-brand-primary"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[2.5rem] text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 text-ink-secondary hover:text-brand-primary"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-base font-semibold text-ink-primary">
                            {formatRupiah(item.unit_price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded-full p-2 text-ink-muted hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Hapus ${item.product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="lg:col-span-4">
                <div className="card-editorial sticky top-28 p-6">
                  <h2 className="font-serif text-2xl font-semibold text-ink-primary">
                    Ringkasan Belanja
                  </h2>
                  <div className="mt-5 space-y-3 border-b border-line-subtle pb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">Subtotal</span>
                      <span className="font-medium text-ink-primary">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">Pengiriman</span>
                      <span className="text-xs text-ink-muted">Dihitung saat checkout</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-medium text-ink-primary">Estimasi Total</span>
                    <span className="text-xl font-bold text-brand-primary">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                  <Link to="/checkout" className="btn-primary mt-6 w-full py-3.5">
                    Lanjut ke Checkout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/shop" className="btn-secondary mt-3 w-full">
                    Lanjut Berbelanja
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
