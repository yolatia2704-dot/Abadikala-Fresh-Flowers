import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Sliders } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { addRawMaterialInventory, adjustInventory, fetchInventory } from '@/services/api';
import type { InventoryMovementType, InventoryRecord } from '@/types/database';
import { formatDateTime } from '@/utils/format';

export function AdminInventoryPage() {
  usePageTitle('Manajemen Stok — Admin');
  const { user } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ['admin-inventory'], queryFn: fetchInventory });
  const items = data?.items || [];
  const movements = data?.movements || [];

  const [tab, setTab] = useState<'product' | 'material'>('product');
  const [selected, setSelected] = useState<InventoryRecord | null>(null);
  const [delta, setDelta] = useState('0');
  const [moveType, setMoveType] = useState<InventoryMovementType>('restock');
  const [threshold, setThreshold] = useState('5');
  const [notes, setNotes] = useState('');

  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('tangkai');
  const [newMatQty, setNewMatQty] = useState('20');
  const [newMatMin, setNewMatMin] = useState('5');

  const visibleItems = items.filter((i) => i.item_type === tab);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !user) return;
    const rawDelta = Number(delta);
    const signedDelta =
      moveType === 'spoilage' || moveType === 'order_deduction'
        ? -Math.abs(rawDelta)
        : rawDelta;
    try {
      await adjustInventory(
        selected.id,
        signedDelta,
        moveType,
        notes || 'Penyesuaian stok oleh admin',
        Number(threshold),
        { email: user.email, role: user.role }
      );
      await qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      await qc.invalidateQueries({ queryKey: ['public-products'] });
      setSelected(null);
      setDelta('0');
      setNotes('');
      showToast('Stok berhasil diperbarui dan dicatat dalam riwayat.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memperbarui stok.', 'error');
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMatName.trim()) return;
    await addRawMaterialInventory(
      newMatName,
      newMatUnit,
      Number(newMatQty),
      Number(newMatMin),
      { email: user.email, role: user.role }
    );
    await qc.invalidateQueries({ queryKey: ['admin-inventory'] });
    setNewMatName('');
    showToast('Bahan baku baru ditambahkan ke inventaris.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-ink-primary">
          Manajemen Stok Produk & Bahan Baku
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Pisahkan stok produk jadi dan bahan baku florist (bunga segar, kertas wrapping, bingkai,
          resin). Setiap perubahan tercatat pada riwayat pergerakan stok.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('product')}
          className={tab === 'product' ? 'btn-primary py-2 text-xs' : 'btn-secondary py-2 text-xs'}
        >
          Stok Produk Jadi
        </button>
        <button
          type="button"
          onClick={() => setTab('material')}
          className={tab === 'material' ? 'btn-primary py-2 text-xs' : 'btn-secondary py-2 text-xs'}
        >
          Stok Bahan Baku Florist
        </button>
      </div>

      {tab === 'material' && (
        <form
          onSubmit={handleAddMaterial}
          className="card-editorial grid grid-cols-1 gap-3 p-4 text-xs sm:grid-cols-12"
        >
          <input
            required
            placeholder="Nama bahan baku (mis: Mawar Merah, Kertas Korea, Bingkai 20x25)"
            value={newMatName}
            onChange={(e) => setNewMatName(e.target.value)}
            className="input-field text-xs sm:col-span-5"
          />
          <input
            required
            placeholder="Satuan (tangkai/lembar/pcs)"
            value={newMatUnit}
            onChange={(e) => setNewMatUnit(e.target.value)}
            className="input-field text-xs sm:col-span-2"
          />
          <input
            type="number"
            min={0}
            placeholder="Qty Awal"
            value={newMatQty}
            onChange={(e) => setNewMatQty(e.target.value)}
            className="input-field text-xs sm:col-span-2"
          />
          <input
            type="number"
            min={0}
            placeholder="Stok Min"
            value={newMatMin}
            onChange={(e) => setNewMatMin(e.target.value)}
            className="input-field text-xs sm:col-span-1"
          />
          <button type="submit" className="btn-primary py-2 text-xs sm:col-span-2">
            <Plus className="h-3.5 w-3.5" /> Tambah
          </button>
        </form>
      )}

      {/* Inventory Table */}
      <div className="card-editorial overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line-subtle bg-surface-muted/60 text-ink-secondary">
              <tr>
                <th className="px-4 py-3">Nama Item</th>
                <th className="px-4 py-3">Status Konfigurasi</th>
                <th className="px-4 py-3">Stok Aktual</th>
                <th className="px-4 py-3">Batas Minimum</th>
                <th className="px-4 py-3">Diperbarui</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-ink-muted">
                    Belum ada data stok pada kategori ini.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => {
                  const isLow =
                    item.is_stock_configured && item.stock_quantity <= item.low_stock_threshold;
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-ink-primary">
                        {item.product_name || item.material_name}
                      </td>
                      <td className="px-4 py-3">
                        {item.is_stock_configured ? (
                          isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-900">
                              <AlertTriangle className="h-3 w-3" /> Stok Rendah
                            </span>
                          ) : (
                            <span className="rounded-full bg-brand-sage-soft px-2.5 py-0.5 font-medium text-brand-sage">
                              Terkonfigurasi
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-ink-secondary">
                            Belum dikonfigurasi (Made-to-order)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {item.stock_quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        {item.low_stock_threshold} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(item.updated_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(item);
                            setThreshold(String(item.low_stock_threshold));
                            setDelta('10');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-line-subtle px-2.5 py-1.5 font-medium text-brand-primary hover:bg-brand-blush/50"
                        >
                          <Sliders className="h-3.5 w-3.5" /> Sesuaikan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Form Panel */}
      {selected && (
        <form onSubmit={handleAdjust} className="card-editorial space-y-4 p-6 text-xs">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            Sesuaikan Stok: {selected.product_name || selected.material_name}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block font-semibold text-ink-secondary">Jenis Pergerakan</label>
              <select
                value={moveType}
                onChange={(e) => setMoveType(e.target.value as InventoryMovementType)}
                className="input-field text-xs"
              >
                <option value="restock">Restock (+)</option>
                <option value="adjustment">Penyesuaian (+/-)</option>
                <option value="spoilage">Bunga Layu / Rusak (-)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink-secondary">
                Jumlah Perubahan
              </label>
              <input
                type="number"
                required
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink-secondary">
                Batas Stok Minimum
              </label>
              <input
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-ink-secondary">Catatan</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alasan penyesuaian"
                className="input-field text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary py-2 text-xs">
              Simpan Perubahan Stok
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="btn-secondary py-2 text-xs"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Stock Movement Ledger */}
      <div className="card-editorial p-6">
        <h2 className="font-serif text-2xl font-semibold text-ink-primary">
          Riwayat Perubahan Stok
        </h2>
        {movements.length === 0 ? (
          <p className="mt-3 text-xs text-ink-secondary">Belum ada catatan pergerakan stok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line-subtle text-ink-secondary">
                <tr>
                  <th className="py-2 pr-3">Waktu</th>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Jenis</th>
                  <th className="py-2 pr-3">Perubahan</th>
                  <th className="py-2 pr-3">Sebelum → Sesudah</th>
                  <th className="py-2">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {movements.slice(0, 20).map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 pr-3 text-ink-muted">{formatDateTime(m.created_at)}</td>
                    <td className="py-2.5 pr-3 font-medium">{m.item_label || m.inventory_id}</td>
                    <td className="py-2.5 pr-3">{m.movement_type}</td>
                    <td
                      className={`py-2.5 pr-3 font-bold ${
                        m.quantity_change >= 0 ? 'text-brand-sage' : 'text-rose-600'
                      }`}
                    >
                      {m.quantity_change >= 0 ? `+${m.quantity_change}` : m.quantity_change}
                    </td>
                    <td className="py-2.5 pr-3">
                      {m.quantity_before} → {m.quantity_after}
                    </td>
                    <td className="py-2.5 text-ink-secondary">{m.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
