import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightCircle, Eye, X } from 'lucide-react';
import { EmptyState, StatusBadge } from '@/components/common/EmptyState';
import { CUSTOM_ORDER_STATUS_META } from '@/constants/abadikala';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import {
  adminUpdateCustomOrder,
  convertCustomOrderToOrder,
  fetchAdminCustomOrders,
} from '@/services/api';
import type { CustomOrder, CustomOrderStatus } from '@/types/database';
import { formatDate, formatRupiah } from '@/utils/format';

export function AdminCustomOrdersPage() {
  usePageTitle('Custom Order — Admin');
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['admin-custom-orders'],
    queryFn: fetchAdminCustomOrders,
  });

  const [selected, setSelected] = useState<CustomOrder | null>(null);
  const [status, setStatus] = useState<CustomOrderStatus>('new');
  const [quote, setQuote] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const openItem = (item: CustomOrder) => {
    setSelected(item);
    setStatus(item.status);
    setQuote(item.quoted_price !== null ? String(item.quoted_price) : '');
    setNotes(item.admin_quote_notes || '');
  };

  const handleSave = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      await adminUpdateCustomOrder(
        selected.id,
        {
          status,
          quoted_price: quote === '' ? null : Number(quote),
          admin_quote_notes: notes,
        },
        { email: user.email, role: user.role }
      );
      await qc.invalidateQueries({ queryKey: ['admin-custom-orders'] });
      showToast(`Custom request ${selected.request_number} diperbarui.`);
      setSelected(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async (item: CustomOrder) => {
    if (!user) return;
    try {
      const order = await convertCustomOrderToOrder(item.id, {
        email: user.email,
        role: user.role,
      });
      await qc.invalidateQueries({ queryKey: ['admin-custom-orders'] });
      await qc.invalidateQueries({ queryKey: ['admin-orders'] });
      showToast(`Berhasil dikonversi menjadi pesanan ${order.order_number}.`);
      setSelected(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal konversi.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-ink-primary">
          Manajemen Custom Order
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Tinjau permintaan buket custom dan pengawetan, lihat gambar referensi, berikan penawaran
          harga, lalu konversi ke pesanan hanya setelah disetujui pelanggan.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="Belum ada permintaan custom order"
          description="Permintaan dari halaman Custom Bouquet pelanggan akan tampil di sini."
        />
      ) : (
        <div className="card-editorial overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">No. Request</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Produk & Acara</th>
                  <th className="px-4 py-3">Tanggal Butuh</th>
                  <th className="px-4 py-3">Penawaran Harga</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-primary">
                      {r.request_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-primary">{r.customer_name}</p>
                      <p className="text-[11px] text-ink-muted">{r.customer_whatsapp}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.product_type}</p>
                      <p className="text-[11px] text-ink-secondary">{r.occasion}</p>
                    </td>
                    <td className="px-4 py-3">{formatDate(r.needed_date)}</td>
                    <td className="px-4 py-3 font-semibold">
                      {r.quoted_price !== null ? formatRupiah(r.quoted_price) : 'Belum ditawarkan'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={CUSTOM_ORDER_STATUS_META[r.status].label}
                        className={CUSTOM_ORDER_STATUS_META[r.status].colorClass}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openItem(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-line-subtle px-2.5 py-1.5 font-medium text-brand-primary hover:bg-brand-blush/50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Tinjau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-surface-card p-6 shadow-elevated">
            <div className="flex items-center justify-between border-b border-line-subtle pb-4">
              <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                {selected.request_number} — {selected.product_type}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-2 hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-base p-4">
                <p className="font-semibold text-ink-secondary">Pelanggan</p>
                <p className="mt-1 font-semibold text-ink-primary">{selected.customer_name}</p>
                <p>WhatsApp: {selected.customer_whatsapp}</p>
                <p>Acara: {selected.occasion}</p>
                <p>Tanggal Kebutuhan: {formatDate(selected.needed_date)}</p>
              </div>
              <div className="rounded-2xl bg-surface-base p-4">
                <p className="font-semibold text-ink-secondary">Preferensi Rangkaian</p>
                <p className="mt-1">Warna Dominan: {selected.dominant_colors || '-'}</p>
                <p>Bunga Diinginkan: {selected.preferred_flowers || '-'}</p>
                <p>Ukuran: {selected.size_preference || '-'}</p>
                <p>
                  Budget:{' '}
                  {selected.budget_min || selected.budget_max
                    ? `${formatRupiah(selected.budget_min)} – ${formatRupiah(selected.budget_max)}`
                    : 'Fleksibel'}
                </p>
              </div>
            </div>

            {selected.attachments.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-ink-secondary">
                  Gambar Referensi Pelanggan
                </p>
                <div className="flex flex-wrap gap-3">
                  {selected.attachments.map((att) => (
                    <img
                      key={att.id}
                      src={att.file_url}
                      alt={att.file_name}
                      className="h-28 w-28 rounded-xl border border-line-subtle object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 space-y-4 rounded-2xl border border-line-subtle bg-surface-base p-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">Status Request</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CustomOrderStatus)}
                    className="input-field text-xs"
                  >
                    {Object.entries(CUSTOM_ORDER_STATUS_META).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-ink-secondary">
                    Penawaran Harga Khusus (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Contoh: 185000"
                    className="input-field text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-ink-secondary">
                  Catatan Penawaran / Respon Admin
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {selected.status === 'approved' && selected.quoted_price && !selected.linked_order_id ? (
                  <button
                    type="button"
                    onClick={() => handleConvert(selected)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-sage px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <ArrowRightCircle className="h-4 w-4" />
                    Konversi ke Pesanan Resmi
                  </button>
                ) : (
                  <span className="text-[11px] text-ink-muted">
                    {selected.linked_order_id
                      ? 'Sudah terhubung ke pesanan resmi.'
                      : 'Ubah status ke "Disetujui" dengan penawaran harga untuk mengonversi ke pesanan.'}
                  </span>
                )}
                <div className="flex gap-2">
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
                    onClick={handleSave}
                    className="btn-primary py-2 text-xs"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
