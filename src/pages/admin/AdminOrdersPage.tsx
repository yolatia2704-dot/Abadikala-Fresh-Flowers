import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, Printer, Search, X } from 'lucide-react';
import { EmptyState, StatusBadge } from '@/components/common/EmptyState';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@/constants/abadikala';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { adminUpdateOrder, fetchAdminOrders } from '@/services/api';
import type { Order, OrderStatus, PaymentStatus } from '@/types/database';
import { formatDate, formatDateTime, formatRupiah } from '@/utils/format';

export function AdminOrdersPage() {
  usePageTitle('Manajemen Pesanan — Admin');
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: orders = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchAdminOrders });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('awaiting_payment');
  const [nextPaymentStatus, setNextPaymentStatus] = useState<PaymentStatus>('pending');
  const [statusNote, setStatusNote] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deductStock, setDeductStock] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_whatsapp.includes(q);
    return matchesStatus && matchesQ;
  });

  const openDetail = (order: Order) => {
    setSelected(order);
    setNextStatus(order.status);
    setNextPaymentStatus(order.payment_status);
    setStatusNote('');
    setInternalNotes(order.internal_notes || '');
    setTrackingNumber(order.tracking_number || '');
    setDeductStock(false);
  };

  const handleUpdate = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      await adminUpdateOrder(
        selected.id,
        {
          status: nextStatus,
          payment_status: nextPaymentStatus,
          note: statusNote.trim() || undefined,
          internal_notes: internalNotes,
          tracking_number: trackingNumber,
          deduct_stock: deductStock,
        },
        { email: user.email, role: user.role }
      );
      await qc.invalidateQueries({ queryKey: ['admin-orders'] });
      await qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      showToast(`Pesanan ${selected.order_number} diperbarui.`);
      setSelected(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui pesanan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-ink-primary">Manajemen Pesanan</h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Verifikasi pembayaran manual, perbarui status rangkaian, kelola resi, dan cetak invoice.
        </p>
      </div>

      {/* Filters */}
      <div className="card-editorial flex flex-wrap gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor order, nama pelanggan, atau WhatsApp..."
            className="input-field pl-9 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-56 text-xs"
        >
          <option value="all">Semua Status</option>
          {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Belum ada pesanan"
          description="Pesanan pelanggan dari halaman checkout atau hasil konversi custom order akan muncul di sini."
        />
      ) : (
        <div className="card-editorial overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">No. Pesanan</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Jadwal Kirim</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3">Status Order</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-primary">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-primary">{o.customer_name}</p>
                      <p className="text-[11px] text-ink-muted">{o.customer_whatsapp}</p>
                    </td>
                    <td className="px-4 py-3">{formatDate(o.requested_delivery_date)}</td>
                    <td className="px-4 py-3 font-semibold">{formatRupiah(o.total_amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={PAYMENT_STATUS_META[o.payment_status].label}
                        className={PAYMENT_STATUS_META[o.payment_status].colorClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={ORDER_STATUS_META[o.status].label}
                        className={ORDER_STATUS_META[o.status].colorClass}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(o)}
                        className="inline-flex items-center gap-1 rounded-lg border border-line-subtle px-2.5 py-1.5 font-medium text-brand-primary hover:bg-brand-blush/50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Invoice Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-elevated">
            <div className="no-print flex items-center justify-between border-b border-line-subtle pb-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                  Pesanan {selected.order_number}
                </h2>
                <p className="text-xs text-ink-secondary">
                  Dibuat: {formatDateTime(selected.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary py-2 text-xs"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-2 hover:bg-surface-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Header */}
            <div className="mt-5 grid grid-cols-1 gap-6 text-xs sm:grid-cols-2">
              <div className="rounded-2xl border border-line-subtle bg-surface-base p-4">
                <p className="font-semibold uppercase tracking-wider text-ink-secondary">
                  Data Pelanggan & Pengiriman
                </p>
                <p className="mt-2 font-semibold text-ink-primary">{selected.customer_name}</p>
                <p>{selected.customer_whatsapp} • {selected.customer_email}</p>
                <p className="mt-2 text-ink-secondary">
                  Alamat Kirim: {selected.delivery_address || selected.customer_address || '-'}
                </p>
                {selected.location_notes && (
                  <p className="text-ink-secondary">Patokan: {selected.location_notes}</p>
                )}
                <p className="mt-1 text-ink-secondary">
                  Jadwal: {formatDate(selected.requested_delivery_date)}{' '}
                  {selected.requested_delivery_time || ''}
                </p>
              </div>

              <div className="rounded-2xl border border-line-subtle bg-surface-base p-4">
                <p className="font-semibold uppercase tracking-wider text-ink-secondary">
                  Detail Hadiah & Kartu Ucapan
                </p>
                <p className="mt-2">Penerima: {selected.recipient_name || '-'}</p>
                <p>Jenis Kartu: {selected.greeting_card_type || '-'}</p>
                <p className="mt-1 italic text-ink-primary">
                  "{selected.greeting_card_message || 'Tidak ada pesan kartu ucapan'}"
                </p>
                {selected.custom_instructions && (
                  <p className="mt-2 text-ink-secondary">
                    Instruksi Custom: {selected.custom_instructions}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-line-subtle">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/60 text-ink-secondary">
                  <tr>
                    <th className="px-4 py-2.5">Produk</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Harga Satuan</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {selected.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-ink-primary">
                          {item.product_name_snapshot}
                        </p>
                        {item.variant_name_snapshot && (
                          <p className="text-ink-secondary">{item.variant_name_snapshot}</p>
                        )}
                        {item.customization_notes && (
                          <p className="italic text-ink-secondary">
                            Catatan: {item.customization_notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{item.quantity}</td>
                      <td className="px-4 py-2.5">{formatRupiah(item.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {formatRupiah(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end border-t border-line-subtle bg-surface-base px-4 py-3 text-xs">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{formatRupiah(selected.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line-subtle pt-1.5 text-sm font-bold text-brand-primary">
                    <span>Total</span>
                    <span>{formatRupiah(selected.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Proof Preview if submitted */}
            {selected.payment && (selected.payment.sender_name || selected.payment.proof_image_url) && (
              <div className="no-print mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
                <p className="font-semibold text-amber-950">Bukti Pembayaran Manual Pelanggan</p>
                <p className="mt-1">
                  Pengirim: <strong>{selected.payment.sender_name || '-'}</strong> • Ref:{' '}
                  {selected.payment.sender_reference || '-'}
                </p>
                {selected.payment.proof_image_url && (
                  <img
                    src={selected.payment.proof_image_url}
                    alt="Bukti pembayaran"
                    className="mt-3 max-h-48 rounded-xl border border-line-subtle object-contain"
                  />
                )}
              </div>
            )}

            {/* Admin Action Controls */}
            <div className="no-print mt-6 space-y-4 rounded-2xl border border-line-subtle bg-surface-base p-5 text-xs">
              <h3 className="font-serif text-xl font-semibold text-ink-primary">
                Pembaruan Status & Verifikasi Admin
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Status Pesanan
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                    className="input-field text-xs"
                  >
                    {Object.entries(ORDER_STATUS_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Status Pembayaran
                  </label>
                  <select
                    value={nextPaymentStatus}
                    onChange={(e) => setNextPaymentStatus(e.target.value as PaymentStatus)}
                    className="input-field text-xs"
                  >
                    {Object.entries(PAYMENT_STATUS_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Nomor Resi / Kurir (Opsional)
                  </label>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Isi jika menggunakan ekspedisi"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Catatan Riwayat Status / Alasan Pembatalan
                  </label>
                  <input
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Contoh: Pembayaran terverifikasi, mulai dirangkai"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink-secondary">
                  Catatan Internal (Hanya terlihat oleh Admin)
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              {!selected.inventory_deducted ? (
                <label className="flex items-center gap-2 font-medium text-ink-primary">
                  <input
                    type="checkbox"
                    checked={deductStock}
                    onChange={(e) => setDeductStock(e.target.checked)}
                  />
                  Kurangi stok produk terkonfigurasi sekarang (idempoten — hanya 1 kali per order)
                </label>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-brand-sage">
                  <CheckCircle2 className="h-4 w-4" />
                  Stok untuk pesanan ini sudah dikurangi sebelumnya (proteksi anti pengurangan ganda aktif).
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="btn-secondary py-2 text-xs"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleUpdate}
                  className="btn-primary py-2 text-xs"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan Pesanan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
