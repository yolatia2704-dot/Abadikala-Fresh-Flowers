import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { EmptyState, StatusBadge } from '@/components/common/EmptyState';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@/constants/abadikala';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import {
  deleteUserAddress,
  fetchCustomerOrders,
  fetchUserAddresses,
  saveUserAddress,
} from '@/services/api';
import { formatDateTime, formatRupiah } from '@/utils/format';

type TabKey = 'orders' | 'profile' | 'addresses';

export function CustomerAccountPage() {
  usePageTitle('Akun Saya');
  const { user, signOut, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabKey>('orders');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp_number || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: 'Rumah',
    recipient_name: user?.full_name || '',
    phone: user?.whatsapp_number || '',
    street_address: '',
    district: '',
    city: 'Lhokseumawe',
    province: 'Aceh',
    postal_code: '',
    notes: '',
    is_default: true,
  });

  const { data: orders } = useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: () => fetchCustomerOrders(user!.id),
    enabled: Boolean(user?.id),
  });

  const { data: addresses } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: () => fetchUserAddresses(user!.id),
    enabled: Boolean(user?.id),
  });

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ full_name: fullName, whatsapp_number: whatsapp });
      showToast('Profil berhasil diperbarui.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui profil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.street_address.trim()) return;
    try {
      await saveUserAddress(user.id, {
        ...addrForm,
        district: addrForm.district || null,
        postal_code: addrForm.postal_code || null,
        notes: addrForm.notes || null,
      });
      await qc.invalidateQueries({ queryKey: ['user-addresses', user.id] });
      setShowAddAddress(false);
      setAddrForm({ ...addrForm, street_address: '', notes: '' });
      showToast('Alamat tersimpan.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan alamat.', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await deleteUserAddress(id);
    await qc.invalidateQueries({ queryKey: ['user-addresses', user.id] });
    showToast('Alamat dihapus.', 'info');
  };

  const handleLogout = async () => {
    await signOut();
    showToast('Anda telah keluar dari akun.', 'info');
    navigate('/');
  };

  return (
    <div className="py-10 lg:py-14">
      <div className="container-editorial">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-subtle pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
              Akun Pelanggan
            </p>
            <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-primary">
              Halo, {user.full_name || user.email}
            </h1>
            <p className="mt-1 text-xs text-ink-secondary">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/wishlist" className="btn-secondary py-2 text-xs">
              <Heart className="h-3.5 w-3.5" />
              Wishlist
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost border border-line-subtle text-xs text-rose-700 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar Nav */}
          <aside className="lg:col-span-3">
            <nav className="card-editorial flex flex-row gap-1 p-2 lg:flex-col">
              <button
                type="button"
                onClick={() => setTab('orders')}
                className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-medium ${
                  tab === 'orders'
                    ? 'bg-brand-blush text-brand-primary'
                    : 'text-ink-secondary hover:bg-surface-muted'
                }`}
              >
                <Package className="h-4 w-4" />
                Riwayat Pesanan
              </button>
              <button
                type="button"
                onClick={() => setTab('profile')}
                className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-medium ${
                  tab === 'profile'
                    ? 'bg-brand-blush text-brand-primary'
                    : 'text-ink-secondary hover:bg-surface-muted'
                }`}
              >
                <User className="h-4 w-4" />
                Profil Saya
              </button>
              <button
                type="button"
                onClick={() => setTab('addresses')}
                className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-medium ${
                  tab === 'addresses'
                    ? 'bg-brand-blush text-brand-primary'
                    : 'text-ink-secondary hover:bg-surface-muted'
                }`}
              >
                <MapPin className="h-4 w-4" />
                Alamat Tersimpan
              </button>
            </nav>
          </aside>

          {/* Main Tab Content */}
          <div className="lg:col-span-9">
            {tab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                  Riwayat Pesanan
                </h2>
                {!orders || orders.length === 0 ? (
                  <EmptyState
                    icon={<Package className="h-6 w-6" />}
                    title="Belum ada pesanan"
                    description="Pesanan yang Anda buat saat masuk ke akun ini akan tercatat di sini."
                    action={
                      <Link to="/shop" className="btn-primary">
                        Belanja Sekarang
                      </Link>
                    }
                  />
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="card-editorial p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-subtle pb-4">
                        <div>
                          <p className="font-mono text-lg font-bold text-brand-primary">
                            {order.order_number}
                          </p>
                          <p className="text-xs text-ink-secondary">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge
                            label={ORDER_STATUS_META[order.status].label}
                            className={ORDER_STATUS_META[order.status].colorClass}
                          />
                          <StatusBadge
                            label={PAYMENT_STATUS_META[order.payment_status].label}
                            className={PAYMENT_STATUS_META[order.payment_status].colorClass}
                          />
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between">
                            <span>
                              {item.product_name_snapshot} × {item.quantity}
                            </span>
                            <span className="font-medium">{formatRupiah(item.line_total)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between border-t border-line-subtle pt-3 text-sm">
                        <span className="font-medium text-ink-secondary">Total</span>
                        <span className="text-lg font-bold text-brand-primary">
                          {formatRupiah(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="card-editorial max-w-xl space-y-4 p-6">
                <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                  Pengaturan Profil
                </h2>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-secondary">
                    Email
                  </label>
                  <input value={user.email} disabled className="input-field bg-surface-muted/60" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-secondary">
                    Nama Lengkap
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-secondary">
                    Nomor WhatsApp
                  </label>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            )}

            {tab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                    Alamat Tersimpan
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress((v) => !v)}
                    className="btn-primary py-2 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Alamat
                  </button>
                </div>

                {showAddAddress && (
                  <form onSubmit={handleSaveAddress} className="card-editorial space-y-3 p-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        required
                        placeholder="Label (Rumah/Kantor)"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                        className="input-field"
                      />
                      <input
                        required
                        placeholder="Nama Penerima"
                        value={addrForm.recipient_name}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, recipient_name: e.target.value })
                        }
                        className="input-field"
                      />
                      <input
                        required
                        placeholder="Nomor HP/WA"
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <textarea
                      required
                      rows={2}
                      placeholder="Alamat lengkap jalan, nomor rumah, desa/kelurahan"
                      value={addrForm.street_address}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, street_address: e.target.value })
                      }
                      className="input-field"
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        placeholder="Kecamatan"
                        value={addrForm.district}
                        onChange={(e) => setAddrForm({ ...addrForm, district: e.target.value })}
                        className="input-field"
                      />
                      <input
                        required
                        placeholder="Kota/Kabupaten"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        className="input-field"
                      />
                      <input
                        required
                        placeholder="Provinsi"
                        value={addrForm.province}
                        onChange={(e) => setAddrForm({ ...addrForm, province: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary py-2 text-xs">
                        Simpan Alamat
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="btn-secondary py-2 text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}

                {!addresses || addresses.length === 0 ? (
                  <EmptyState
                    icon={<MapPin className="h-6 w-6" />}
                    title="Belum ada alamat tersimpan"
                    description="Simpan alamat pengiriman favorit Anda agar proses checkout lebih cepat."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="card-editorial p-5 text-sm">
                        <div className="flex items-start justify-between">
                          <span className="rounded-full bg-brand-blush px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
                            {addr.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-ink-muted hover:text-rose-600"
                            aria-label="Hapus alamat"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-2 font-semibold">{addr.recipient_name}</p>
                        <p className="text-xs text-ink-secondary">{addr.phone}</p>
                        <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
                          {addr.street_address}, {addr.district ? `${addr.district}, ` : ''}
                          {addr.city}, {addr.province}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
