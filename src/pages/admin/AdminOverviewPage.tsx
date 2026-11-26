import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState, StatusBadge } from '@/components/common/EmptyState';
import { ORDER_STATUS_META } from '@/constants/abadikala';
import { usePageTitle } from '@/hooks/useStoreQueries';
import {
  fetchAdminCustomOrders,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchInventory,
} from '@/services/api';
import { formatDateTime, formatRupiah } from '@/utils/format';

export function AdminOverviewPage() {
  usePageTitle('Dashboard Overview — Admin');

  const { data: orders = [] } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchAdminOrders });
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAdminProducts,
  });
  const { data: customOrders = [] } = useQuery({
    queryKey: ['admin-custom-orders'],
    queryFn: fetchAdminCustomOrders,
  });
  const { data: invData } = useQuery({ queryKey: ['admin-inventory'], queryFn: fetchInventory });

  const confirmedOrders = orders.filter(
    (o) => o.payment_status === 'confirmed' && o.status !== 'cancelled'
  );
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const newOrdersCount = orders.filter(
    (o) => o.status === 'awaiting_payment' || o.status === 'awaiting_verification'
  ).length;
  const inProcessCount = orders.filter((o) =>
    ['payment_confirmed', 'order_accepted', 'processing', 'arranging', 'ready_for_delivery', 'out_for_delivery'].includes(
      o.status
    )
  ).length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const activeProductsCount = products.filter((p) => p.is_active && !p.is_archived).length;
  const lowStockItems = (invData?.items || []).filter(
    (i) => i.is_stock_configured && i.stock_quantity <= i.low_stock_threshold
  );
  const newCustomCount = customOrders.filter((c) => c.status === 'new').length;

  // Sales by line from actual confirmed orders
  let freshRevenue = 0;
  let preservedRevenue = 0;
  const productCounts = new Map<string, { name: string; qty: number; revenue: number }>();

  for (const order of confirmedOrders) {
    for (const item of order.items) {
      if (item.product_line_snapshot === 'fresh') freshRevenue += item.line_total;
      else preservedRevenue += item.line_total;
      const key = item.product_name_snapshot;
      const cur = productCounts.get(key) || { name: key, qty: 0, revenue: 0 };
      cur.qty += item.quantity;
      cur.revenue += item.line_total;
      productCounts.set(key, cur);
    }
  }

  const lineChartData = [
    { name: 'Lini Segar', pendapatan: freshRevenue },
    { name: 'Lini Abadi', pendapatan: preservedRevenue },
  ];

  const topProducts = Array.from(productCounts.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const kpis = [
    {
      label: 'Total Pendapatan Terkonfirmasi',
      value: formatRupiah(totalRevenue),
      icon: DollarSign,
      accent: 'bg-brand-blush text-brand-primary',
    },
    {
      label: 'Total Pesanan',
      value: String(orders.length),
      sub: `${newOrdersCount} baru • ${inProcessCount} diproses • ${completedCount} selesai`,
      icon: ShoppingBag,
      accent: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Produk Aktif',
      value: String(activeProductsCount),
      sub: `${lowStockItems.length} item stok rendah`,
      icon: Package,
      accent: 'bg-brand-sage-soft text-brand-sage',
    },
    {
      label: 'Custom Order Baru',
      value: String(newCustomCount),
      sub: `${customOrders.length} total permintaan`,
      icon: Sparkles,
      accent: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink-primary">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Ringkasan operasional aktual dari database Abadikala Fresh Flowers.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/produk" className="btn-secondary py-2 text-xs">
            Kelola Produk
          </Link>
          <Link to="/admin/pesanan" className="btn-primary py-2 text-xs">
            Kelola Pesanan
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card-editorial p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-ink-secondary">{kpi.label}</p>
                <span className={`rounded-xl p-2 ${kpi.accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-ink-primary">{kpi.value}</p>
              {kpi.sub && <p className="mt-1 text-xs text-ink-muted">{kpi.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="card-editorial p-6 lg:col-span-7">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            Penjualan Berdasarkan Lini Produk
          </h2>
          <p className="text-xs text-ink-secondary">
            Dihitung hanya dari transaksi dengan pembayaran terkonfirmasi.
          </p>
          <div className="mt-6 h-64">
            {confirmedOrders.length === 0 ? (
              <EmptyState
                title="Belum ada transaksi terkonfirmasi"
                description="Grafik penjualan akan muncul otomatis setelah pesanan pertama dikonfirmasi pembayarannya."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DDD6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(val: number) => formatRupiah(val)} />
                  <Bar dataKey="pendapatan" fill="#6E2C3B" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card-editorial p-6 lg:col-span-5">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">Produk Terlaris</h2>
          <p className="text-xs text-ink-secondary">Berdasarkan jumlah unit terjual aktual.</p>
          <div className="mt-5">
            {topProducts.length === 0 ? (
              <p className="rounded-xl bg-surface-muted/60 p-6 text-center text-xs text-ink-secondary">
                Belum ada data penjualan aktual.
              </p>
            ) : (
              <ul className="divide-y divide-line-subtle text-sm">
                {topProducts.map((p) => (
                  <li key={p.name} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-ink-primary">{p.name}</p>
                      <p className="text-xs text-ink-secondary">{p.qty} unit terjual</p>
                    </div>
                    <span className="font-semibold text-brand-primary">
                      {formatRupiah(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="card-editorial p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-ink-primary">Pesanan Terbaru</h2>
            <Link to="/admin/pesanan" className="text-xs font-semibold text-brand-primary hover:underline">
              Lihat Semua →
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted/60 p-6 text-center text-xs text-ink-secondary">
              Belum ada pesanan masuk. Pesanan dari halaman checkout akan tampil di sini secara
              langsung.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line-subtle text-ink-secondary">
                  <tr>
                    <th className="py-2.5 pr-3">No. Order</th>
                    <th className="py-2.5 pr-3">Pelanggan</th>
                    <th className="py-2.5 pr-3">Total</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 pr-3 font-mono font-semibold text-brand-primary">
                        {o.order_number}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-ink-primary">{o.customer_name}</p>
                        <p className="text-[11px] text-ink-muted">{formatDateTime(o.created_at)}</p>
                      </td>
                      <td className="py-3 pr-3 font-semibold">{formatRupiah(o.total_amount)}</td>
                      <td className="py-3">
                        <StatusBadge
                          label={ORDER_STATUS_META[o.status].label}
                          className={ORDER_STATUS_META[o.status].colorClass}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card-editorial p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-ink-primary">Peringatan Stok</h2>
            <Link to="/admin/stok" className="text-xs font-semibold text-brand-primary hover:underline">
              Kelola Stok →
            </Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-sage-soft/70 p-4 text-xs text-brand-sage">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>
                Tidak ada item terkonfigurasi di bawah batas stok minimum. (Item yang masih
                made-to-order dapat dikonfigurasi pada menu Manajemen Stok.)
              </span>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {lowStockItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span className="font-medium text-amber-950">
                      {item.product_name || item.material_name}
                    </span>
                  </div>
                  <span className="font-bold text-amber-900">
                    Sisa {item.stock_quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 border-t border-line-subtle pt-4">
            <div className="flex items-center gap-2 text-xs text-ink-secondary">
              <Clock className="h-4 w-4 text-brand-primary" />
              <span>
                Permintaan Custom Order menunggu tinjauan: <strong>{newCustomCount}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
