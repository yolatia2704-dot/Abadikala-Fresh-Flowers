import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Sparkles, Upload, X } from 'lucide-react';
import { CUSTOM_ORDER_OCCASIONS } from '@/constants/abadikala';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usePageTitle } from '@/hooks/useStoreQueries';
import { customOrderSchema, type CustomOrderFormValues } from '@/schemas/forms';
import { createCustomOrder } from '@/services/api';
import type { CustomOrder } from '@/types/database';

const PRODUCT_TYPES = [
  'Custom Buket Bunga Segar',
  'Flower Bar Personal',
  'Custom Buket Bunga Kering',
  'Custom Bingkai Pressed Flower',
  'Custom Shadow-Box Nama & Gelar',
  'Jasa Pengawetan Buket',
  'Rangkaian Dekorasi / Gift Arrangement',
];

export function CustomOrderPage() {
  usePageTitle('Custom Bouquet & Request');
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [attachments, setAttachments] = useState<
    { file_url: string; file_name: string; mime_type: string; file_size_bytes: number }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<CustomOrder | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomOrderFormValues>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      customer_name: user?.full_name || '',
      customer_whatsapp: user?.whatsapp_number || '',
      customer_email: user?.email || '',
      product_type: searchParams.get('produk') || PRODUCT_TYPES[0],
      occasion: 'Wisuda',
      needed_date: '',
      budget_min: '',
      budget_max: '',
      dominant_colors: '',
      preferred_flowers: '',
      size_preference: 'Sedang (Medium)',
      greeting_card_message: '',
      additional_notes: '',
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Format gambar harus JPG, PNG, atau WebP.', 'error');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File ${file.name} melebihi batas 5 MB.`, 'error');
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev.slice(0, 3),
          {
            file_url: String(reader.result),
            file_name: file.name,
            mime_type: file.type,
            file_size_bytes: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: CustomOrderFormValues) => {
    setSubmitting(true);
    try {
      const created = await createCustomOrder({
        user_id: user?.id || null,
        customer_name: values.customer_name,
        customer_whatsapp: values.customer_whatsapp,
        customer_email: values.customer_email || undefined,
        product_type: values.product_type,
        occasion: values.occasion,
        needed_date: values.needed_date,
        budget_min: values.budget_min === '' || values.budget_min === undefined ? null : Number(values.budget_min),
        budget_max: values.budget_max === '' || values.budget_max === undefined ? null : Number(values.budget_max),
        dominant_colors: values.dominant_colors,
        preferred_flowers: values.preferred_flowers,
        size_preference: values.size_preference,
        greeting_card_message: values.greeting_card_message,
        additional_notes: values.additional_notes,
        attachments,
      });
      setSubmittedRequest(created);
      showToast(`Permintaan custom ${created.request_number} berhasil dikirim!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim permintaan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <div className="container-editorial py-16">
        <div className="card-editorial mx-auto max-w-2xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-sage-soft text-brand-sage">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-ink-primary">
            Permintaan Custom Order Diterima
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Tim florist Abadikala akan meninjau referensi desain Anda dan mengirimkan penawaran
            harga khusus. Pesanan tidak akan ditagih sebelum Anda menyetujui penawaran harga.
          </p>
          <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-line-subtle bg-surface-muted px-8 py-4">
            <span className="text-xs uppercase tracking-widest text-ink-secondary">
              Nomor Request
            </span>
            <span className="mt-1 font-mono text-2xl font-bold text-brand-primary">
              {submittedRequest.request_number}
            </span>
            <span className="mt-2 rounded-full bg-brand-blush px-3 py-0.5 text-xs font-medium text-brand-primary">
              Status: Baru (Menunggu Tinjauan)
            </span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/shop" className="btn-primary">
              Jelajahi Katalog
            </Link>
            <button
              type="button"
              onClick={() => setSubmittedRequest(null)}
              className="btn-secondary"
            >
              Buat Request Lainnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-14">
      <div className="container-editorial">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blush px-3.5 py-1 text-xs font-medium text-brand-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Layanan Personal Abadikala
            </span>
            <h1 className="mt-3 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
              Custom Bouquet & Request Khusus
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary sm:text-base">
              Ceritakan momen spesial, nuansa warna, bunga favorit, dan kisaran anggaran Anda. Tim
              kami akan memberikan penawaran harga khusus sebelum pengerjaan dimulai.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card-editorial mt-8 space-y-5 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Nama Lengkap *
                </label>
                <input {...register('customer_name')} className="input-field" />
                {errors.customer_name && (
                  <p className="mt-1 text-xs text-rose-600">{errors.customer_name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Nomor WhatsApp *
                </label>
                <input
                  {...register('customer_whatsapp')}
                  placeholder="08xxxxxxxxxx"
                  className="input-field"
                />
                {errors.customer_whatsapp && (
                  <p className="mt-1 text-xs text-rose-600">{errors.customer_whatsapp.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Email (Opsional)
                </label>
                <input type="email" {...register('customer_email')} className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Tanggal Kebutuhan *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('needed_date')}
                  className="input-field"
                />
                {errors.needed_date && (
                  <p className="mt-1 text-xs text-rose-600">{errors.needed_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Jenis Produk *
                </label>
                <select {...register('product_type')} className="input-field">
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Jenis Acara *
                </label>
                <select {...register('occasion')} className="input-field">
                  {CUSTOM_ORDER_OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Kisaran Budget Min (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  placeholder="Contoh: 100000"
                  {...register('budget_min')}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Kisaran Budget Maks (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  placeholder="Contoh: 250000"
                  {...register('budget_max')}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Ukuran *
                </label>
                <select {...register('size_preference')} className="input-field">
                  <option value="Kecil (Petite)">Kecil (Petite)</option>
                  <option value="Sedang (Medium)">Sedang (Medium)</option>
                  <option value="Besar (Large)">Besar (Large)</option>
                  <option value="Menyesuaikan Frame/Ruang">Menyesuaikan Frame / Ruang</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Warna Dominan yang Diinginkan *
                </label>
                <input
                  {...register('dominant_colors')}
                  placeholder="Contoh: Blush pink, cream, sentuhan burgundy"
                  className="input-field"
                />
                {errors.dominant_colors && (
                  <p className="mt-1 text-xs text-rose-600">{errors.dominant_colors.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Jenis Bunga yang Diinginkan (Opsional)
                </label>
                <input
                  {...register('preferred_flowers')}
                  placeholder="Contoh: Mawar, baby breath, eucalyptus"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Pesan Kartu Ucapan (Opsional)
              </label>
              <textarea
                rows={2}
                {...register('greeting_card_message')}
                placeholder="Tulis pesan untuk kartu ucapan..."
                className="input-field"
              />
            </div>

            {/* Image Reference Upload */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Upload Gambar Referensi Desain (Opsional, maks. 4 gambar, masing-masing ≤ 5 MB)
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line-subtle bg-surface-base p-6 text-center transition-colors hover:border-brand-primary">
                <Upload className="h-5 w-5 text-brand-primary" />
                <span className="mt-2 text-xs font-medium text-ink-primary">
                  Klik untuk unggah foto inspirasi (JPG, PNG, WebP)
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 w-20 overflow-hidden rounded-xl border border-line-subtle"
                    >
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute right-1 top-1 rounded-full bg-ink-primary/80 p-0.5 text-white"
                        aria-label="Hapus gambar referensi"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                Catatan Tambahan
              </label>
              <textarea
                rows={3}
                {...register('additional_notes')}
                placeholder="Tuliskan detail tambahan seperti lokasi acara, request khusus, dll."
                className="input-field"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? 'Mengirim Permintaan...' : 'Kirim Permintaan Custom Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
