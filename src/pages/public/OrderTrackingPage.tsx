import React, { useState } from 'react';
import { PackageSearch, CheckCircle2, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/common/EmptyState';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@/constants/abadikala';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { trackOrderPublic } from '@/services/api';
import type { Order } from '@/types/database';
import { formatDate, formatDateTime, formatRupiah } from '@/utils/format';

export function OrderTrackingPage() {
  usePageTitle('Lacak Pesanan');
  const [orderNumber, setOrderNumber] = useState('');
  const [verification, setVerification] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !verification.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await trackOrderPublic(orderNumber, verification);
      setOrder(result);
      setSearched(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal melacak pesanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 lg:py-16">
      <div className="container-editorial max-w-3xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blush text-brand-primary">
            <PackageSearch className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
            Lacak Pesanan Anda
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Masukkan nomor pesanan beserta email atau nomor WhatsApp yang digunakan saat checkout.
          </p>
        </div>

        <form onSubmit={handleTrack} className="card-editorial mt-8 grid grid-cols-1 gap-4 p-6 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Nomor Pesanan *
            </label>
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Contoh: ABK-20261126-XXXXXX"
              className="input-field font-mono"
            />
          </div>
          <div className="sm:col-span-5">
            <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
              Email atau Nomor WhatsApp *
            </label>
            <input
              required
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              placeholder="nama@email.com / 08xxx"
              className="input-field"
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Mencari...' : 'Lacak'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <p className="mt-4 rounded-xl bg-rose-50 p-4 text-center text-sm text-rose-700">
            {errorMsg}
          </p>
        )}

        {searched && !order && !errorMsg && (
          <div className="card-editorial mt-6 p-8 text-center">
            <p className="font-serif text-2xl font-medium text-ink-primary">
              Pesanan tidak ditemukan
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              Pastikan nomor pesanan dan email/WhatsApp yang Anda masukkan sudah sesuai.
            </p>
          </div>
        )}

        {order && (
          <div className="mt-8 space-y-6">
            <div className="card-editorial p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-subtle pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-secondary">
                    Nomor Pesanan
                  </p>
                  <p className="font-mono text-2xl font-bold text-brand-primary">
                    {order.order_number}
                  </p>
                  <p className="mt-1 text-xs text-ink-secondary">
                    Dipesan oleh {order.customer_name} • {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={ORDER_STATUS_META[order.status].label}
                    className={ORDER_STATUS_META[order.status].colorClass}
                  />
                  <StatusBadge
                    label={`Pembayaran: ${PAYMENT_STATUS_META[order.payment_status].label}`}
                    className={PAYMENT_STATUS_META[order.payment_status].colorClass}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-ink-secondary">Tanggal Kebutuhan</p>
                  <p className="font-medium">{formatDate(order.requested_delivery_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">Nomor Resi / Pengiriman</p>
                  <p className="font-medium">{order.tracking_number || 'Belum tersedia'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">Total Pesanan</p>
                  <p className="font-bold text-brand-primary">
                    {formatRupiah(order.total_amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card-editorial p-6">
              <h2 className="font-serif text-2xl font-semibold text-ink-primary">
                Riwayat Status Pesanan
              </h2>
              <ol className="mt-5 space-y-4 border-l-2 border-brand-blush pl-5">
                {order.history.map((h, idx) => (
                  <li key={h.id || idx} className="relative">
                    <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-white">
                      {idx === order.history.length - 1 ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                    </span>
                    <p className="text-sm font-semibold text-ink-primary">
                      {ORDER_STATUS_META[h.status]?.label || h.status}
                    </p>
                    {h.note && <p className="mt-0.5 text-xs text-ink-secondary">{h.note}</p>}
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {formatDateTime(h.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Items */}
            <div className="card-editorial p-6">
              <h2 className="font-serif text-2xl font-semibold text-ink-primary">Rincian Produk</h2>
              <ul className="mt-4 divide-y divide-line-subtle text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium text-ink-primary">
                        {item.product_name_snapshot} × {item.quantity}
                      </p>
                      {item.variant_name_snapshot && (
                        <p className="text-xs text-ink-secondary">{item.variant_name_snapshot}</p>
                      )}
                    </div>
                    <span className="font-semibold text-ink-primary">
                      {formatRupiah(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
