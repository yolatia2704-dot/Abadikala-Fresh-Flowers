import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatRupiah } from '@/utils/format';

export function CartDrawer() {
  const { items, isDrawerOpen, setDrawerOpen, subtotal, updateQuantity, removeItem } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-ink-primary/40 backdrop-blur-[2px]"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Keranjang Belanja"
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface-base shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-line-subtle bg-surface-card px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-brand-primary" />
            <h2 className="font-serif text-2xl font-semibold text-ink-primary">Keranjang Anda</h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-full p-2 text-ink-secondary hover:bg-surface-muted hover:text-ink-primary"
            aria-label="Tutup keranjang"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="font-serif text-2xl font-medium text-ink-primary">Keranjang masih kosong</p>
            <p className="mt-2 text-sm text-ink-secondary">
              Temukan rangkaian bunga segar atau karya bunga awetan untuk orang tersayang.
            </p>
            <Link
              to="/shop"
              onClick={() => setDrawerOpen(false)}
              className="btn-primary mt-6"
            >
              Jelajahi Produk
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-line-subtle overflow-y-auto px-6 py-2">
              {items.map((item) => {
                const img =
                  item.product.images.find((i) => i.is_primary)?.image_url ||
                  item.product.images[0]?.image_url ||
                  '/images/hero-abadikala.jpg';
                return (
                  <div key={item.id} className="flex gap-4 py-4">
                    <img
                      src={img}
                      alt={item.product.name}
                      className="h-20 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/produk/${item.product.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="font-serif text-lg font-semibold leading-snug text-ink-primary hover:text-brand-primary"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-ink-muted hover:text-rose-600"
                          aria-label={`Hapus ${item.product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.variant_name && (
                        <p className="mt-0.5 text-xs text-ink-secondary">Varian: {item.variant_name}</p>
                      )}
                      {item.customization_notes && (
                        <p className="mt-0.5 line-clamp-2 text-xs italic text-ink-secondary">
                          Catatan: {item.customization_notes}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-line-subtle bg-surface-card">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-ink-secondary hover:text-brand-primary"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2rem] text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-ink-secondary hover:text-brand-primary"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-brand-primary">
                          {formatRupiah(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-line-subtle bg-surface-card p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-secondary">Subtotal</span>
                <span className="text-lg font-semibold text-ink-primary">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Biaya pengiriman dan diskon (jika ada) dihitung pada halaman checkout.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  to="/checkout"
                  onClick={() => setDrawerOpen(false)}
                  className="btn-primary w-full"
                >
                  Lanjut ke Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setDrawerOpen(false)}
                  className="btn-secondary w-full"
                >
                  Lihat Keranjang Lengkap
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
