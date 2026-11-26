import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { fetchAdminOrders, fetchAdminProducts } from '@/services/api';
import { exportToCsv, formatDateTime, formatRupiah } from '@/utils/format';

type PeriodFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export function AdminReportsPage() {
  usePageTitle('Laporan Penjualan & Laba — Admin');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: orders = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchAdminOrders });
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAdminProducts,
  });

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const created = new Date(o.created_at);
      if (startDate && created < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      if (period === 'daily') {
        return created.toDateString() === now.toDateString();
      }
      if (period === 'weekly') {
        return now.getTime() - created.getTime() <= 7 * 86400000;
      }
      if (period === 'monthly') {
        return (
          created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'yearly') {
        return created.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, period, startDate, endDate]);

  const confirmed = filteredOrders.filter(
    (o) => o.payment_status === 'confirmed' && o.status !== 'cancelled'
  );

  let totalRevenue = 0;
  let totalHpp = 0;
  let freshRevenue = 0;
  let preservedRevenue = 0;

  for (const order of confirmed) {
    totalRevenue += order.total_amount;
    for (const item of order.items) {
      if (item.product_line_snapshot === 'fresh') freshRevenue += item.line_total;
      else preservedRevenue += item.line_total;
      const fallbackProd = products.find((p) => p.id === item.product_id);
      const unitCost = item.unit_cost_snapshot ?? fallbackProd?.cost_price ?? 0;
      totalHpp += unitCost * item.quantity;
    }
  }

  const estimatedProfit = totalRevenue - totalHpp;

  const handleExportCsv = () => {
    exportToCsv(
      `laporan-abadikala-${new Date().toISOString().split('T')[0]}.csv`,
      [
        'No Pesanan',
        'Tanggal',
        'Pelanggan',
        'Status Pesanan',
        'Status Pembayaran',
        'Subtotal',
        'Ongkir',
        'Diskon',
        'Total',
      ],
      filteredOrders.map((o) => [
        o.order_number,
        formatDateTime(o.created_at),
        o.customer_name,
        o.status,
        o.payment_status,
        o.subtotal,
        o.shipping_fee,
        o.discount_amount,
        o.total_amount,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink-primary">
            Laporan Penjualan & Estimasi Laba
          </h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Seluruh perhitungan berasal dari data transaksi aktual dan HPP internal (khusus admin).
          </p>
        </div>
        <button
          type="button"
          disabled={filteredOrders.length === 0}
          onClick={handleExportCsv}
          className="btn-primary py-2.5 text-xs"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Period & Date Filters */}
      <div className="card-editorial flex flex-wrap items-center gap-3 p-4 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'Semua'],
              ['daily', 'Harian'],
              ['weekly', 'Mingguan'],
              ['monthly', 'Bulanan'],
              ['yearly', 'Tahunan'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-full px-3.5 py-1.5 font-medium ${
                period === key
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-muted text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field w-40 py-1.5 text-xs"
          />
          <span>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field w-40 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-editorial p-5">
          <p className="text-xs text-ink-secondary">Pendapatan Terkonfirmasi</p>
          <p className="mt-2 text-2xl font-bold text-ink-primary">{formatRupiah(totalRevenue)}</p>
          <p className="mt-1 text-[11px] text-ink-muted">{confirmed.length} transaksi terkonfirmasi</p>
        </div>
        <div className="card-editorial p-5">
          <p className="text-xs text-ink-secondary">Total HPP Internal</p>
          <p className="mt-2 text-2xl font-bold text-ink-primary">{formatRupiah(totalHpp)}</p>
          <p className="mt-1 text-[11px] text-ink-muted">Berdasarkan snapshot HPP produk</p>
        </div>
        <div className="card-editorial p-5">
          <p className="text-xs text-ink-secondary">Estimasi Laba Kotor</p>
          <p className="mt-2 text-2xl font-bold text-brand-sage">{formatRupiah(estimatedProfit)}</p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Margin: {totalRevenue > 0 ? `${Math.round((estimatedProfit / totalRevenue) * 100)}%` : '0%'}
          </p>
        </div>
        <div className="card-editorial p-5">
          <p className="text-xs text-ink-secondary">Kontribusi Lini</p>
          <p className="mt-2 text-xs text-ink-primary">
            Lini Segar: <strong>{formatRupiah(freshRevenue)}</strong>
          </p>
          <p className="mt-1 text-xs text-ink-primary">
            Lini Abadi: <strong>{formatRupiah(preservedRevenue)}</strong>
          </p>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          title="Belum ada data transaksi pada periode ini"
          description="Laporan akan otomatis terisi setelah terdapat pesanan yang tercatat di database."
        />
      ) : (
        <div className="card-editorial overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">No. Order</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-primary">
                      {o.order_number}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDateTime(o.created_at)}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3">{o.payment_status}</td>
                    <td className="px-4 py-3">{o.status}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatRupiah(o.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
