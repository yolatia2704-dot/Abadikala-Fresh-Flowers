import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  useBusinessSettings,
  usePageTitle,
  useShippingMethods,
} from '@/hooks/useStoreQueries';
import { saveBusinessSettings, saveShippingMethod } from '@/services/api';
import type { BusinessSettings, ShippingMethod } from '@/types/database';

export function AdminSettingsPage() {
  usePageTitle('Pengaturan Bisnis & Konten Legal — Admin');
  const { user, isManager } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();

  const { data: initialSettings } = useBusinessSettings();
  const { data: initialShipping = [] } = useShippingMethods(true);

  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) setSettings(structuredClone(initialSettings));
  }, [initialSettings]);

  useEffect(() => {
    setMethods(structuredClone(initialShipping));
  }, [initialShipping]);

  if (!settings) return null;

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const actor = { email: user.email, role: user.role };
      const normalized: BusinessSettings = {
        ...settings,
        contact_info: {
          ...settings.contact_info,
          is_configured: Boolean(
            settings.contact_info.whatsapp ||
              settings.contact_info.email ||
              settings.contact_info.operational_hours
          ),
        },
        social_links: {
          ...settings.social_links,
          is_configured: Boolean(
            settings.social_links.instagram ||
              settings.social_links.tiktok ||
              settings.social_links.facebook
          ),
        },
        delivery_policy: {
          ...settings.delivery_policy,
          is_configured: Boolean(
            settings.delivery_policy.service_areas || settings.delivery_policy.preorder_lead_time
          ),
        },
        payment_config: {
          ...settings.payment_config,
          is_configured: settings.payment_config.bank_accounts.length > 0,
        },
      };
      await saveBusinessSettings(normalized, actor);
      for (const m of methods) {
        await saveShippingMethod(m, actor);
      }
      await qc.invalidateQueries({ queryKey: ['business-settings'] });
      await qc.invalidateQueries({ queryKey: ['shipping-methods'] });
      showToast('Seluruh pengaturan bisnis, pengiriman, FAQ, dan konten legal berhasil disimpan.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink-primary">
            Pengaturan Bisnis & Konten Legal
          </h1>
          <p className="mt-1 text-ink-secondary">
            Kelola identitas studio, kontak, media sosial, ongkos kirim, rekening pembayaran,
            kebijakan pre-order, naskah legal resmi, dan FAQ secara real-time.
          </p>
        </div>
        {isManager && (
          <button type="submit" disabled={saving} className="btn-primary py-2.5 text-xs">
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
          </button>
        )}
      </div>

      {/* Brand Identity & Logo */}
      <section className="card-editorial space-y-4 p-6">
        <h2 className="font-serif text-2xl font-semibold text-ink-primary">Identitas & Logo</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Nama Bisnis</label>
            <input
              value={settings.brand_identity.business_name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  brand_identity: { ...settings.brand_identity, business_name: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Tagline</label>
            <input
              value={settings.brand_identity.tagline}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  brand_identity: { ...settings.brand_identity, tagline: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block font-semibold text-ink-secondary">
              URL Logo Kustom (kosongkan untuk memakai logo resmi vektor "Jam Pasir Bunga")
            </label>
            <input
              value={settings.brand_identity.logo_url}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  brand_identity: { ...settings.brand_identity, logo_url: e.target.value },
                })
              }
              placeholder="/images/logo-abadikala-full.svg"
              className="input-field text-xs"
            />
          </div>
        </div>
      </section>

      {/* Contact, Operational Hours & Social Links */}
      <section className="card-editorial space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            Kontak, Alamat, Jam Operasional & Media Sosial
          </h2>
          <span className="rounded-full bg-brand-sage-soft px-2.5 py-0.5 text-[10px] font-semibold text-brand-sage">
            Aktif di Storefront
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Nomor WhatsApp</label>
            <input
              value={settings.contact_info.whatsapp}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact_info: { ...settings.contact_info, whatsapp: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Email Resmi</label>
            <input
              value={settings.contact_info.email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact_info: { ...settings.contact_info, email: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Jam Operasional</label>
            <input
              value={settings.contact_info.operational_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact_info: { ...settings.contact_info, operational_hours: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Alamat Lengkap</label>
            <input
              value={settings.contact_info.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  contact_info: { ...settings.contact_info, address: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-line-subtle pt-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">URL Instagram</label>
            <input
              value={settings.social_links.instagram}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, instagram: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">URL TikTok</label>
            <input
              value={settings.social_links.tiktok}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, tiktok: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">URL Facebook</label>
            <input
              value={settings.social_links.facebook}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, facebook: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
        </div>
      </section>

      {/* Shipping & Pre-order Operations */}
      <section className="card-editorial space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            Pengiriman, Ongkir & Ketentuan Pre-Order
          </h2>
          <button
            type="button"
            onClick={() =>
              setMethods((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  code: `shipping_${Date.now()}`,
                  name: 'Metode Pengiriman Baru',
                  method_type: 'delivery',
                  description: '',
                  service_area: 'Lhokseumawe',
                  base_fee: 15000,
                  estimated_duration: '1–2 jam',
                  is_configured: true,
                  is_active: true,
                  sort_order: prev.length + 1,
                },
              ])
            }
            className="btn-secondary py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Metode
          </button>
        </div>

        <div className="space-y-3">
          {methods.map((m, idx) => (
            <div
              key={m.id}
              className="grid grid-cols-1 gap-3 rounded-2xl border border-line-subtle bg-surface-base p-4 sm:grid-cols-12"
            >
              <div className="sm:col-span-3">
                <label className="mb-1 block font-semibold text-ink-secondary">Nama Metode</label>
                <input
                  value={m.name}
                  onChange={(e) => {
                    const next = [...methods];
                    next[idx] = { ...m, name: e.target.value };
                    setMethods(next);
                  }}
                  className="input-field text-xs"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="mb-1 block font-semibold text-ink-secondary">Wilayah Layanan</label>
                <input
                  value={m.service_area || ''}
                  onChange={(e) => {
                    const next = [...methods];
                    next[idx] = { ...m, service_area: e.target.value };
                    setMethods(next);
                  }}
                  className="input-field text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-ink-secondary">Tarif (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={m.base_fee ?? ''}
                  onChange={(e) => {
                    const next = [...methods];
                    next[idx] = {
                      ...m,
                      base_fee: e.target.value === '' ? null : Number(e.target.value),
                    };
                    setMethods(next);
                  }}
                  className="input-field text-xs"
                />
              </div>
              <div className="flex flex-col justify-center gap-1.5 sm:col-span-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={m.is_configured}
                    onChange={(e) => {
                      const next = [...methods];
                      next[idx] = { ...m, is_configured: e.target.checked };
                      setMethods(next);
                    }}
                  />
                  Terkonfigurasi
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={m.is_active}
                    onChange={(e) => {
                      const next = [...methods];
                      next[idx] = { ...m, is_active: e.target.checked };
                      setMethods(next);
                    }}
                  />
                  Aktif di Checkout
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-line-subtle pt-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">
              Ketentuan Minimal Waktu Pre-Order
            </label>
            <textarea
              rows={2}
              value={settings.delivery_policy.preorder_lead_time}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  delivery_policy: {
                    ...settings.delivery_policy,
                    preorder_lead_time: e.target.value,
                  },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">
              Estimasi Lama Pengerjaan
            </label>
            <textarea
              rows={2}
              value={settings.delivery_policy.processing_time}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  delivery_policy: {
                    ...settings.delivery_policy,
                    processing_time: e.target.value,
                  },
                })
              }
              className="input-field text-xs"
            />
          </div>
        </div>
      </section>

      {/* Manual Payment Bank Accounts */}
      <section className="card-editorial space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            Rekening Pembayaran Transfer Bank
          </h2>
          <button
            type="button"
            onClick={() =>
              setSettings({
                ...settings,
                payment_config: {
                  ...settings.payment_config,
                  bank_accounts: [
                    ...settings.payment_config.bank_accounts,
                    { bank_name: '', account_number: '', account_holder: '' },
                  ],
                },
              })
            }
            className="btn-secondary py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Rekening
          </button>
        </div>

        {settings.payment_config.bank_accounts.map((acc, idx) => (
          <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-10">
            <input
              placeholder="Nama Bank (BSI / BCA)"
              value={acc.bank_name}
              onChange={(e) => {
                const next = [...settings.payment_config.bank_accounts];
                next[idx] = { ...acc, bank_name: e.target.value };
                setSettings({
                  ...settings,
                  payment_config: { ...settings.payment_config, bank_accounts: next },
                });
              }}
              className="input-field text-xs sm:col-span-3"
            />
            <input
              placeholder="Nomor Rekening"
              value={acc.account_number}
              onChange={(e) => {
                const next = [...settings.payment_config.bank_accounts];
                next[idx] = { ...acc, account_number: e.target.value };
                setSettings({
                  ...settings,
                  payment_config: { ...settings.payment_config, bank_accounts: next },
                });
              }}
              className="input-field font-mono text-xs sm:col-span-3"
            />
            <input
              placeholder="Atas Nama"
              value={acc.account_holder}
              onChange={(e) => {
                const next = [...settings.payment_config.bank_accounts];
                next[idx] = { ...acc, account_holder: e.target.value };
                setSettings({
                  ...settings,
                  payment_config: { ...settings.payment_config, bank_accounts: next },
                });
              }}
              className="input-field text-xs sm:col-span-3"
            />
            <button
              type="button"
              onClick={() => {
                const next = settings.payment_config.bank_accounts.filter((_, i) => i !== idx);
                setSettings({
                  ...settings,
                  payment_config: { ...settings.payment_config, bank_accounts: next },
                });
              }}
              className="justify-self-end rounded-lg p-2 text-rose-600 hover:bg-rose-50 sm:col-span-1"
              aria-label="Hapus rekening"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div>
          <label className="mb-1 block font-semibold text-ink-secondary">
            Instruksi Pembayaran & Konfirmasi
          </label>
          <textarea
            rows={2}
            value={settings.payment_config.payment_instructions}
            onChange={(e) =>
              setSettings({
                ...settings,
                payment_config: {
                  ...settings.payment_config,
                  payment_instructions: e.target.value,
                },
              })
            }
            className="input-field text-xs"
          />
        </div>
      </section>

      {/* Personalized Services Toggle */}
      <section className="card-editorial space-y-3 p-6">
        <h2 className="font-serif text-2xl font-semibold text-ink-primary">
          Aktivasi Layanan Personal Homepage
        </h2>
        <div className="flex flex-wrap gap-6">
          {(
            [
              ['handwritten_card', 'Kartu Ucapan Tulisan Tangan'],
              ['custom_bouquet', 'Custom Bouquet'],
              ['color_request', 'Request Warna Bunga'],
              ['bouquet_preservation', 'Pengawetan Buket'],
              ['gift_arrangement', 'Gift Arrangement'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.personalized_services[key]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    personalized_services: {
                      ...settings.personalized_services,
                      [key]: e.target.checked,
                    },
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {/* Konten Legal Resmi (Editable CMS) */}
      <section className="card-editorial space-y-4 p-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-ink-primary">
            Konten Kebijakan & Legal Resmi
          </h2>
          <p className="text-ink-secondary">
            Teks di bawah ini tampil langsung pada halaman /privacy-policy, /terms,
            /shipping-policy, dan /cancellation-policy.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Kebijakan Privasi</label>
            <textarea
              rows={6}
              value={settings.legal_drafts.privacy_policy}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  legal_drafts: { ...settings.legal_drafts, privacy_policy: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">Syarat & Ketentuan</label>
            <textarea
              rows={6}
              value={settings.legal_drafts.terms_conditions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  legal_drafts: { ...settings.legal_drafts, terms_conditions: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">
              Kebijakan Pengiriman
            </label>
            <textarea
              rows={6}
              value={settings.legal_drafts.shipping_policy}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  legal_drafts: { ...settings.legal_drafts, shipping_policy: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-ink-secondary">
              Kebijakan Pembatalan & Refund
            </label>
            <textarea
              rows={6}
              value={settings.legal_drafts.cancellation_policy}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  legal_drafts: { ...settings.legal_drafts, cancellation_policy: e.target.value },
                })
              }
              className="input-field text-xs"
            />
          </div>
        </div>
      </section>

      {/* FAQ CMS Editor */}
      <section className="card-editorial space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink-primary">
              Manajemen FAQ (/faq)
            </h2>
            <p className="text-ink-secondary">
              Tambah, ubah, atau hapus pertanyaan yang tampil di halaman FAQ publik.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSettings({
                ...settings,
                faqs: [
                  ...settings.faqs,
                  {
                    id: `faq-${Date.now()}`,
                    category: 'Umum',
                    question: 'Pertanyaan baru...',
                    answer: 'Jawaban...',
                    is_active: true,
                  },
                ],
              })
            }
            className="btn-secondary py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah FAQ
          </button>
        </div>

        <div className="space-y-3">
          {settings.faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className="space-y-2 rounded-2xl border border-line-subtle bg-surface-base p-4"
            >
              <div className="flex items-center gap-3">
                <input
                  value={faq.category}
                  onChange={(e) => {
                    const next = [...settings.faqs];
                    next[idx] = { ...faq, category: e.target.value };
                    setSettings({ ...settings, faqs: next });
                  }}
                  placeholder="Kategori"
                  className="input-field w-40 text-xs"
                />
                <input
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...settings.faqs];
                    next[idx] = { ...faq, question: e.target.value };
                    setSettings({ ...settings, faqs: next });
                  }}
                  placeholder="Pertanyaan"
                  className="input-field flex-1 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      faqs: settings.faqs.filter((f) => f.id !== faq.id),
                    })
                  }
                  className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                  aria-label="Hapus FAQ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => {
                  const next = [...settings.faqs];
                  next[idx] = { ...faq, answer: e.target.value };
                  setSettings({ ...settings, faqs: next });
                }}
                placeholder="Jawaban lengkap"
                className="input-field text-xs"
              />
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
