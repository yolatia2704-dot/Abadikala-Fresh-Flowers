import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Gift,
  MapPin,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useBusinessSettings, usePageTitle, useShippingMethods } from '@/hooks/useStoreQueries';
import { isSupabaseConfigured } from '@/lib/supabase';
import { checkoutSchema, type CheckoutFormValues } from '@/schemas/forms';
import { createOrder, submitPaymentProof } from '@/services/api';
import type { Order } from '@/types/database';
import { formatRupiah } from '@/utils/format';

const STEPS = [
  { id: 1, title: 'Pelanggan', icon: User },
  { id: 2, title: 'Pengiriman', icon: MapPin },
  { id: 3, title: 'Detail Hadiah', icon: Gift },
  { id: 4, title: 'Pembayaran', icon: CreditCard },
  { id: 5, title: 'Konfirmasi', icon: CheckCircle2 },
];

export function CheckoutPage() {
  usePageTitle('Checkout');
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { data: settings } = useBusinessSettings();
  const { data: shippingMethods } = useShippingMethods(false);
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Payment proof submission state (step 5)
  const [senderName, setSenderName] = useState('');
  const [senderRef, setSenderRef] = useState('');
  const [proofFileUrl, setProofFileUrl] = useState<string | null>(null);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);

  const activeMethods = shippingMethods || [];
  const defaultFulfillment =
    activeMethods.length > 0 ? activeMethods[0].method_type : 'pending_confirmation';

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: user?.full_name || '',
      customer_whatsapp: user?.whatsapp_number || '',
      customer_email: user?.email || '',
      customer_address: '',
      fulfillment_type: defaultFulfillment,
      shipping_method_id: activeMethods[0]?.id || null,
      delivery_address: '',
      location_notes: '',
      requested_delivery_date: '',
      requested_delivery_time: '',
      recipient_name: '',
      recipient_phone: '',
      greeting_card_type: 'Kartu Ucapan Tulisan Tangan',
      greeting_card_message: '',
      special_notes: '',
      custom_instructions: '',
      payment_method_code: 'manual_transfer',
      coupon_code: '',
    },
  });

  const selectedShippingId = watch('shipping_method_id');
  const fulfillmentType = watch('fulfillment_type');
  const selectedMethod = activeMethods.find((m) => m.id === selectedShippingId);

  useEffect(() => {
    if (!selectedShippingId && activeMethods.length > 0) {
      setValue('shipping_method_id', activeMethods[0].id);
      setValue('fulfillment_type', activeMethods[0].method_type);
    }
  }, [activeMethods, selectedShippingId, setValue]);

  const shippingFee = selectedMethod?.base_fee ?? 0;
  const grandTotal = subtotal + shippingFee;

  if (items.length === 0 && !createdOrder) {
    return (
      <div className="container-editorial py-16">
        <EmptyState
          title="Keranjang belanja kosong"
          description="Tambahkan produk ke keranjang terlebih dahulu sebelum melanjutkan ke proses checkout."
          action={
            <Link to="/shop" className="btn-primary">
              Kembali ke Katalog
            </Link>
          }
        />
      </div>
    );
  }

  const goNext = async () => {
    if (step === 1) {
      const ok = await trigger([
        'customer_name',
        'customer_whatsapp',
        'customer_email',
        'customer_address',
      ]);
      if (!ok) return;
    }
    if (step === 2) {
      const ok = await trigger(['fulfillment_type', 'requested_delivery_date']);
      if (!ok) return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const onSubmitOrder = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    try {
      const paymentLabel =
        values.payment_method_code === 'manual_transfer'
          ? 'Transfer Manual (Verifikasi Admin)'
          : 'Konfirmasi Pembayaran dengan Admin';

      const order = await createOrder({
        user_id: user?.id || null,
        customer_name: values.customer_name,
        customer_whatsapp: values.customer_whatsapp,
        customer_email: values.customer_email,
        customer_address: values.customer_address,
        fulfillment_type: values.fulfillment_type,
        shipping_method_id: values.shipping_method_id || null,
        delivery_address: values.delivery_address || values.customer_address,
        location_notes: values.location_notes,
        requested_delivery_date: values.requested_delivery_date,
        requested_delivery_time: values.requested_delivery_time,
        recipient_name: values.recipient_name || values.customer_name,
        recipient_phone: values.recipient_phone || values.customer_whatsapp,
        greeting_card_type: values.greeting_card_type,
        greeting_card_message: values.greeting_card_message,
        special_notes: values.special_notes,
        custom_instructions: values.custom_instructions,
        payment_method_code: values.payment_method_code,
        payment_method_label: paymentLabel,
        coupon_code: values.coupon_code,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          customization_notes: i.customization_notes,
        })),
      });

      setCreatedOrder(order);
      setSenderName(values.customer_name);
      clearCart();
      setStep(5);
      showToast(`Pesanan ${order.order_number} berhasil dibuat.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat pesanan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProofFileUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder || !senderName.trim()) {
      showToast('Nama pengirim wajib diisi.', 'error');
      return;
    }
    setSubmittingProof(true);
    try {
      await submitPaymentProof(createdOrder.order_number, senderName, senderRef, proofFileUrl);
      setProofSubmitted(true);
      showToast('Bukti pembayaran dikirim. Menunggu verifikasi admin.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim bukti.', 'error');
    } finally {
      setSubmittingProof(false);
    }
  };

  const bankAccounts = settings?.payment_config?.bank_accounts || [];

  return (
    <div className="py-10 lg:py-14">
      <div className="container-editorial">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
          Pemesanan Online
        </p>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-primary">Checkout</h1>

        {/* Step Indicator */}
        <ol className="mt-6 grid grid-cols-5 gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const completed = step > s.id;
            return (
              <li
                key={s.id}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium ${
                  active
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : completed
                      ? 'border-brand-sage/40 bg-brand-sage-soft text-brand-sage'
                      : 'border-line-subtle bg-surface-card text-ink-muted'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{s.title}</span>
              </li>
            );
          })}
        </ol>

        {step < 5 ? (
          <form
            onSubmit={handleSubmit(onSubmitOrder)}
            className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12"
          >
            <div className="card-editorial p-6 sm:p-8 lg:col-span-8">
              {/* STEP 1: CUSTOMER INFO */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                    1. Informasi Pelanggan
                  </h2>
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
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.customer_whatsapp.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                      Email *
                    </label>
                    <input type="email" {...register('customer_email')} className="input-field" />
                    {errors.customer_email && (
                      <p className="mt-1 text-xs text-rose-600">{errors.customer_email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                      Alamat Lengkap Pemesan *
                    </label>
                    <textarea rows={3} {...register('customer_address')} className="input-field" />
                    {errors.customer_address && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.customer_address.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: DELIVERY / PICKUP */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                    2. Pengiriman & Jadwal
                  </h2>

                  {activeMethods.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                      <p className="font-semibold">
                        Opsi pengiriman & ongkos kirim belum dikonfigurasi final oleh admin.
                      </p>
                      <p className="mt-1">
                        Anda tetap dapat menyelesaikan pemesanan. Tim Abadikala akan mengonfirmasi
                        opsi pengiriman/pickup serta ongkos kirim yang sesuai untuk alamat Anda.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {activeMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                            selectedShippingId === method.id
                              ? 'border-brand-primary bg-brand-blush/30'
                              : 'border-line-subtle hover:border-brand-primary/40'
                          }`}
                        >
                          <input
                            type="radio"
                            value={method.id}
                            checked={selectedShippingId === method.id}
                            onChange={() => {
                              setValue('shipping_method_id', method.id);
                              setValue('fulfillment_type', method.method_type);
                            }}
                            className="mt-1 accent-brand-primary"
                          />
                          <div>
                            <p className="text-sm font-semibold text-ink-primary">{method.name}</p>
                            <p className="mt-0.5 text-xs text-ink-secondary">
                              {method.service_area || 'Lhokseumawe'} •{' '}
                              {method.base_fee !== null
                                ? formatRupiah(method.base_fee)
                                : 'Konfirmasi admin'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {fulfillmentType !== 'pickup' && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                          Alamat Pengiriman (kosongkan jika sama dengan alamat pemesan)
                        </label>
                        <textarea
                          rows={2}
                          {...register('delivery_address')}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                          Catatan Lokasi / Patokan
                        </label>
                        <input
                          {...register('location_notes')}
                          placeholder="Contoh: Dekat gerbang kampus / rumah pagar putih"
                          className="input-field"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                        Tanggal Pengiriman / Pengambilan *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...register('requested_delivery_date')}
                        className="input-field"
                      />
                      {errors.requested_delivery_date && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.requested_delivery_date.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                        Preferensi Waktu (Opsional)
                      </label>
                      <input
                        {...register('requested_delivery_time')}
                        placeholder="Contoh: Pagi (09.00–12.00) / Sore"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: GIFT DETAILS */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                    3. Detail Hadiah & Kartu Ucapan
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                        Nama Penerima
                      </label>
                      <input
                        {...register('recipient_name')}
                        placeholder="Kosongkan jika untuk diri sendiri"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                        Nomor Telepon Penerima
                      </label>
                      <input {...register('recipient_phone')} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                      Pilihan Kartu Ucapan
                    </label>
                    <select {...register('greeting_card_type')} className="input-field">
                      <option value="Kartu Ucapan Tulisan Tangan">
                        Kartu Ucapan Tulisan Tangan (Personal)
                      </option>
                      <option value="Kartu Ucapan Cetak Standar">Kartu Ucapan Cetak Standar</option>
                      <option value="Tanpa Kartu Ucapan">Tanpa Kartu Ucapan</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                      Pesan pada Kartu Ucapan
                    </label>
                    <textarea
                      rows={3}
                      {...register('greeting_card_message')}
                      placeholder="Tulis pesan hangat Anda di sini..."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                      Instruksi Custom / Catatan Khusus
                    </label>
                    <textarea
                      rows={2}
                      {...register('custom_instructions')}
                      placeholder="Permintaan warna pita, nama/gelar untuk shadow-box, dll."
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: PAYMENT */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                    4. Metode Pembayaran
                  </h2>

                  <div className="rounded-2xl border border-line-subtle bg-surface-muted/60 p-4 text-xs leading-relaxed text-ink-secondary">
                    <p className="flex items-center gap-1.5 font-semibold text-ink-primary">
                      <ShieldCheck className="h-4 w-4 text-brand-sage" />
                      Verifikasi Pembayaran Manual oleh Admin
                    </p>
                    <p className="mt-1">
                      Payment gateway otomatis belum diaktifkan. Status pembayaran Anda akan tetap{' '}
                      <strong>Menunggu Pembayaran / Verifikasi</strong> hingga dikonfirmasi secara
                      resmi oleh admin Abadikala.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-primary bg-brand-blush/25 p-4">
                    <input
                      type="radio"
                      value="manual_transfer"
                      {...register('payment_method_code')}
                      defaultChecked
                      className="mt-1 accent-brand-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-primary">
                        Transfer Bank Manual (Konfirmasi Admin)
                      </p>
                      <p className="mt-1 text-xs text-ink-secondary">
                        {settings?.payment_config?.payment_instructions}
                      </p>
                      {bankAccounts.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {bankAccounts.map((acc, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-line-subtle bg-surface-card p-3 text-xs"
                            >
                              <p className="font-semibold text-ink-primary">{acc.bank_name}</p>
                              <p className="font-mono text-sm text-brand-primary">
                                {acc.account_number}
                              </p>
                              <p className="text-ink-secondary">a.n. {acc.account_holder}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs italic text-amber-800">
                          Nomor rekening belum dikonfigurasi admin — detail transfer akan
                          diinformasikan setelah pesanan tercatat.
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between border-t border-line-subtle pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="btn-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Sebelumnya
                  </button>
                ) : (
                  <Link to="/cart" className="btn-ghost">
                    Kembali ke Keranjang
                  </Link>
                )}

                {step < 4 ? (
                  <button type="button" onClick={goNext} className="btn-primary">
                    Lanjutkan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="btn-primary px-8">
                    {submitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang'}
                  </button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <aside className="lg:col-span-4">
              <div className="card-editorial sticky top-28 p-6">
                <h3 className="font-serif text-2xl font-semibold text-ink-primary">
                  Ringkasan Pesanan
                </h3>
                <ul className="mt-4 divide-y divide-line-subtle text-sm">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-primary">
                          {item.product.name} × {item.quantity}
                        </p>
                        {item.variant_name && (
                          <p className="text-xs text-ink-secondary">{item.variant_name}</p>
                        )}
                      </div>
                      <span className="shrink-0 font-medium text-ink-primary">
                        {formatRupiah(item.unit_price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2 border-t border-line-subtle pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-secondary">Pengiriman</span>
                    <span>
                      {selectedMethod
                        ? formatRupiah(shippingFee)
                        : 'Menunggu konfirmasi'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-line-subtle pt-3 text-base font-bold">
                    <span>Total Akhir</span>
                    <span className="text-brand-primary">{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        ) : (
          /* STEP 5: CONFIRMATION */
          createdOrder && (
            <div className="mx-auto mt-8 max-w-3xl space-y-6">
              {!isSupabaseConfigured && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    <strong>Catatan Mode Pratinjau Lokal:</strong> Pesanan ini tercatat di penyimpanan
                    browser lokal Anda untuk pengujian antarmuka, belum tersimpan di server database
                    produksi Supabase.
                  </p>
                </div>
              )}

              <div className="card-editorial p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-sage-soft text-brand-sage">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mt-4 font-serif text-4xl font-semibold text-ink-primary">
                  Pesanan Anda Tercatat
                </h2>
                <p className="mt-2 text-sm text-ink-secondary">
                  Simpan nomor pesanan Anda untuk melacak status pengerjaan dan pengiriman.
                </p>
                <div className="mt-5 inline-flex flex-col items-center rounded-2xl border border-line-subtle bg-surface-muted px-8 py-4">
                  <span className="text-xs uppercase tracking-widest text-ink-secondary">
                    Nomor Pesanan
                  </span>
                  <span className="mt-1 font-mono text-2xl font-bold text-brand-primary">
                    {createdOrder.order_number}
                  </span>
                  <span className="mt-2 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-900">
                    Status: {proofSubmitted ? 'Menunggu Verifikasi Admin' : 'Menunggu Pembayaran'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 border-t border-line-subtle pt-6 text-left text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-ink-secondary">Pemesan</p>
                    <p className="font-medium">{createdOrder.customer_name}</p>
                    <p className="text-xs text-ink-secondary">{createdOrder.customer_whatsapp}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-ink-secondary">Total Pembayaran</p>
                    <p className="text-xl font-bold text-brand-primary">
                      {formatRupiah(createdOrder.total_amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Payment Proof Upload (Never auto-confirms) */}
              {!proofSubmitted ? (
                <form onSubmit={handleSubmitProof} className="card-editorial p-6 sm:p-8">
                  <h3 className="font-serif text-2xl font-semibold text-ink-primary">
                    Kirim Konfirmasi Pembayaran Manual
                  </h3>
                  <p className="mt-1 text-xs text-ink-secondary">
                    Setelah melakukan transfer, unggah bukti pembayaran di sini. Admin Abadikala
                    akan memverifikasi pembayaran Anda secara manual.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                        Nama Pemilik Rekening Pengirim *
                      </label>
                      <input
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        required
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                        Nomor Referensi / Catatan Transfer
                      </label>
                      <input
                        value={senderRef}
                        onChange={(e) => setSenderRef(e.target.value)}
                        placeholder="Opsional"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                      Unggah Bukti Transfer (JPG/PNG, maks. 5 MB)
                    </label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line-subtle bg-surface-base p-5 text-xs text-ink-secondary hover:border-brand-primary">
                      <Upload className="h-4 w-4 text-brand-primary" />
                      <span>{proofFileUrl ? 'Bukti siap dikirim (klik untuk ganti)' : 'Pilih file bukti transfer'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="submit" disabled={submittingProof} className="btn-primary">
                      {submittingProof ? 'Mengirim...' : 'Kirim Bukti untuk Diverifikasi'}
                    </button>
                    <Link to="/lacak-pesanan" className="btn-secondary">
                      Lacak Pesanan
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="card-editorial p-6 text-center">
                  <p className="text-sm font-medium text-brand-sage">
                    Bukti pembayaran Anda telah diterima dan sedang menunggu verifikasi admin.
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Link to="/lacak-pesanan" className="btn-primary">
                      Lacak Status Pesanan
                    </Link>
                    <Link to="/shop" className="btn-secondary">
                      Kembali Berbelanja
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
