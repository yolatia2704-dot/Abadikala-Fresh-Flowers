import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Compass,
  Flower2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { JamPasirBungaMark } from '@/components/common/BrandLogo';
import { useToast } from '@/contexts/ToastContext';
import { useBusinessSettings, usePageTitle } from '@/hooks/useStoreQueries';
import { contactSchema, type ContactFormValues } from '@/schemas/forms';
import { submitContactMessage } from '@/services/api';
import { buildWhatsAppUrl } from '@/utils/format';

export function AboutPage() {
  usePageTitle(
    'Tentang Kami',
    'Kisah Abadikala Fresh Flowers di Lhokseumawe, Aceh — filosofi Segar Hari Ini, Abadi Selamanya dan logo Jam Pasir Bunga.'
  );
  return (
    <div className="py-12 lg:py-16">
      <div className="container-editorial max-w-5xl space-y-12">
        {/* Editorial Intro */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
              Tentang Abadikala • Lhokseumawe, Aceh
            </p>
            <h1 className="mt-2 font-serif text-5xl font-semibold leading-tight text-ink-primary">
              Menyampaikan Rasa, Mengabadikan Waktu.
            </h1>
            <p className="mt-4 font-serif text-2xl italic text-brand-primary">
              "Segar Hari Ini, Abadi Selamanya"
            </p>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-secondary sm:text-base">
              <p>
                Nama <strong>Abadikala</strong> lahir dari perpaduan kata <em>"abadi"</em> dan{' '}
                <em>"kala"</em> (waktu)—sebuah filosofi tentang waktu yang diabadikan. Berawal dari
                kerinduan akan hadirnya toko bunga segar yang rapi, hangat, dan ramah di kantong di
                Kota Lhokseumawe, Abadikala hadir sebagai florist modern dengan kualitas premium
                yang tetap terjangkau bagi semua kalangan.
              </p>
              <p>
                Kami percaya bahwa bunga bukan sekadar hadiah sesaat yang layu lalu terlupakan.
                Melalui konsep <strong>Satu Bunga, Dua Bentuk Keindahan</strong>—yakni{' '}
                <strong>Lini Segar</strong> dan <strong>Lini Abadi</strong>—kami menghadirkan
                kesegaran bunga pilihan hari ini sekaligus karya bunga awetan dan jasa pengawetan
                buket agar kenangan berharga Anda terus hidup bertahun-tahun.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                Jelajahi Koleksi
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/custom-order" className="btn-secondary">
                Pesan Custom Bouquet
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-[2rem] border border-line-subtle bg-surface-card p-2.5 shadow-soft">
              <img
                src="/images/hero-abadikala.jpg"
                alt="Studio Abadikala Fresh Flowers Lhokseumawe"
                className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Brand Journey & Positioning */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card-editorial p-6">
            <span className="inline-block rounded-full bg-brand-blush px-3 py-1 text-[11px] font-semibold text-brand-primary">
              Perjalanan Kami
            </span>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink-primary">
              Premium namun Terjangkau
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              Dari pembatas buku bunga pres Rp25.000, buket kecil Rp75.000, hingga buket besar gaya
              Korea dan pengawetan buket—pelajar, mahasiswa, pasangan, maupun pelanggan bisnis dapat
              merayakan setiap momen dengan indah.
            </p>
          </div>
          <div className="card-editorial p-6">
            <span className="inline-block rounded-full bg-brand-sage-soft px-3 py-1 text-[11px] font-semibold text-brand-sage">
              Keberlanjutan
            </span>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink-primary">
              Dari Segar Menjadi Abadi
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              Bunga segar yang tersisa maupun buket dari hari spesial pelanggan diolah menjadi
              pressed flower, shadow-box nama & gelar, plakat akrilik, hingga aksesori resin—indah
              tanpa menyisakan limbah sia-sia.
            </p>
          </div>
          <div className="card-editorial p-6">
            <span className="inline-block rounded-full bg-brand-blush px-3 py-1 text-[11px] font-semibold text-brand-primary">
              Sentuhan Personal
            </span>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink-primary">
              Dirangkai Saat Dipesan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              Setiap buket dilengkapi kartu ucapan tulisan tangan dan dirangkai saat dipesan agar
              selalu segar, atau pilih sendiri tangkai favorit Anda di Flower Bar—
              <em>"Pilih bungamu, kami rangkai ceritamu"</em>.
            </p>
          </div>
        </div>

        {/* Filosofi Logo Jam Pasir Bunga */}
        <section className="card-editorial overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="flex flex-col items-center justify-center bg-brand-forest p-10 text-center text-[#F6F1E7] lg:col-span-4">
              <JamPasirBungaMark dark className="h-28 w-24" />
              <p className="mt-4 font-sans text-lg font-medium tracking-[0.3em] text-[#F6F1E7]">
                ABADIKALA
              </p>
              <p className="mt-2 text-xs italic text-[#D9A9A3]">
                "Abadikala menghadirkan keindahan yang bisa dinikmati hari ini dan dikenang
                selamanya."
              </p>
            </div>
            <div className="p-8 lg:col-span-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
                Filosofi Logo
              </p>
              <h2 className="mt-1 font-serif text-4xl font-semibold text-ink-primary">
                Jam Pasir Bunga
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
                Logo Abadikala merepresentasikan keindahan yang abadi dalam setiap momen melalui
                simbol jam pasir yang dibentuk dari dua bunga tulip yang saling berhadapan.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line-subtle bg-surface-base p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#D9A9A3]" />
                    <p className="text-xs font-semibold text-ink-primary">
                      Tulip Atas • Muted Blush (#D9A9A3)
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                    Melambangkan kelembutan, cinta, dan kehangatan dalam setiap momen.
                  </p>
                </div>
                <div className="rounded-2xl border border-line-subtle bg-surface-base p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#1F3D2F]" />
                    <p className="text-xs font-semibold text-ink-primary">
                      Tulip Bawah • Forest Green (#1F3D2F)
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                    Melambangkan keteguhan, kesegaran, dan kehidupan yang berkelanjutan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Keunggulan Lini Segar & Lini Abadi */}
        <section className="card-editorial p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
            Keunggulan Kami
          </p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-ink-primary sm:text-4xl">
            Apa yang Membuat Abadikala Berbeda
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-muted/60 p-5 text-sm">
              <p className="font-semibold text-brand-primary">Lini Segar — Nikmati Hari Ini</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                Buket kecil plastik bening, buket besar gaya Korea, bunga meja langganan mingguan
                untuk kafe & kantor, serta Flower Bar (Mawar, Krisan, Aster, Gerbera, Baby Breath).
              </p>
            </div>
            <div className="rounded-2xl bg-surface-muted/60 p-5 text-sm">
              <p className="font-semibold text-brand-primary">Lini Abadi — Simpan Selamanya</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                Buket bunga kering, bingkai pressed flower, plakat akrilik, shadow-box nama & gelar,
                mawar kubah kaca, suvenir resin, serta jasa pengawetan buket pelanggan.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-muted/60 p-5 text-sm">
              <p className="font-semibold text-brand-primary">Bisa Diabadikan Setelah Acara</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                Buket wisuda, lamaran, atau pernikahan Anda tidak perlu berakhir layu—tim studio
                kami akan mengawetkannya menjadi bingkai seni penuh kenangan.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-muted/60 p-5 text-sm">
              <p className="font-semibold text-brand-primary">Pengiriman Lhokseumawe & Luar Kota</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                Kurir khusus studio untuk menjaga kesegaran di seluruh Kota Lhokseumawe serta kotak
                kraft aman untuk pengiriman produk Lini Abadi ke seluruh Indonesia.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ContactPage() {
  usePageTitle(
    'Kontak Kami',
    'Hubungi studio Abadikala Fresh Flowers di Banda Sakti, Lhokseumawe, Aceh. Buka setiap hari 08.00–21.00 WIB.'
  );
  const { data: settings } = useBusinessSettings();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactFormValues) => {
    setSending(true);
    try {
      await submitContactMessage(values);
      reset();
      showToast('Pesan Anda berhasil dikirim! Tim Abadikala akan segera membalas.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengirim pesan.', 'error');
    } finally {
      setSending(false);
    }
  };

  const contact = settings?.contact_info;
  const whatsappDisplay = contact?.whatsapp || '+62 822-7410-8820';
  const emailDisplay = contact?.email || 'halo@abadikalaflowers.id';
  const addressDisplay =
    contact?.address ||
    'Jl. Merdeka Barat No. 48, Simpang Empat, Kec. Banda Sakti, Kota Lhokseumawe, Aceh 24351';
  const hoursDisplay = contact?.operational_hours || 'Senin–Minggu, 08.00–21.00 WIB';
  const waLink = buildWhatsAppUrl(
    whatsappDisplay,
    'Halo Abadikala Fresh Flowers, saya ingin bertanya tentang rangkaian bunga.'
  );

  return (
    <div className="py-12 lg:py-16">
      <div className="container-editorial max-w-6xl space-y-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
            Hubungi Studio Kami
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
            Kontak Abadikala
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary sm:text-base">
            Konsultasikan kebutuhan buket segar, custom bouquet, langganan bunga meja, atau jasa
            pengawetan buket bersama tim florist kami di Lhokseumawe.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Studio Contact Info */}
          <div className="space-y-5 lg:col-span-5">
            <div className="card-editorial space-y-5 p-6 text-sm">
              <h2 className="font-serif text-2xl font-semibold text-ink-primary">
                Informasi Studio
              </h2>
              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blush text-brand-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-ink-primary">Alamat Studio</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                    {addressDisplay}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-sage-soft text-brand-sage">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-ink-primary">Jam Operasional</p>
                  <p className="mt-0.5 text-xs text-ink-secondary">{hoursDisplay}</p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Order same-day buket segar dilayani hingga pukul 14.00 WIB.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-sage-soft text-brand-sage">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-ink-primary">WhatsApp Resmi</p>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
                    >
                      {whatsappDisplay}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-xs text-ink-secondary">{whatsappDisplay}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blush text-brand-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-ink-primary">Email</p>
                  <a
                    href={`mailto:${emailDisplay}`}
                    className="mt-0.5 block text-xs font-medium text-brand-primary hover:underline"
                  >
                    {emailDisplay}
                  </a>
                </div>
              </div>

              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full py-3 text-xs"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat Langsung via WhatsApp
                </a>
              )}
            </div>

            <div className="card-editorial p-5 text-xs">
              <p className="flex items-center gap-2 font-semibold text-ink-primary">
                <Compass className="h-4 w-4 text-brand-primary" />
                Petunjuk Lokasi Studio
              </p>
              <p className="mt-2 leading-relaxed text-ink-secondary">
                Berlokasi strategis ±5 menit dari <strong>Masjid Agung Islamic Center Lhokseumawe</strong>{' '}
                di kawasan Simpang Empat, Banda Sakti. Mudah dijangkau untuk pengambilan langsung
                (Pick-up Gratis) maupun kunjungan Flower Bar.
              </p>
            </div>
          </div>

          {/* Contact Form (saves to contact_messages) */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="card-editorial flex flex-col justify-between space-y-5 p-6 sm:p-8 lg:col-span-7"
          >
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-ink-primary">
                  Kirim Pesan ke Studio
                </h2>
                <p className="mt-1 text-xs text-ink-secondary">
                  Pesan Anda langsung tercatat di sistem admin Abadikala dan akan segera kami
                  tanggapi pada jam operasional.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                    Nama Lengkap *
                  </label>
                  <input
                    {...register('name')}
                    placeholder="Nama Anda"
                    className="input-field"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="nama@email.com"
                    className="input-field"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <input
                    {...register('whatsapp')}
                    placeholder="08xxxxxxxxxx"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                    Subjek Pesan *
                  </label>
                  <input
                    {...register('subject')}
                    placeholder="Contoh: Tanya Custom Buket Wisuda"
                    className="input-field"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-xs text-rose-600">{errors.subject.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">
                  Pesan Anda *
                </label>
                <textarea
                  rows={5}
                  {...register('message')}
                  placeholder="Tuliskan pertanyaan, detail acara, atau kebutuhan rangkaian bunga Anda..."
                  className="input-field"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>
                )}
              </div>
            </div>

            <button type="submit" disabled={sending} className="btn-primary w-full py-3.5 sm:w-auto">
              <Send className="h-4 w-4" />
              {sending ? 'Mengirim Pesan...' : 'Kirim Pesan Sekarang'}
            </button>
          </form>
        </div>

        {/* Embedded Location Map */}
        <section className="card-editorial overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle px-6 py-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-ink-primary">
                Peta Lokasi Studio — Banda Sakti, Lhokseumawe
              </h2>
              <p className="text-xs text-ink-secondary">{addressDisplay}</p>
            </div>
            <a
              href="https://maps.google.com/?q=Banda+Sakti,+Lhokseumawe,+Aceh"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary py-2 text-xs"
            >
              Buka di Google Maps
            </a>
          </div>
          <iframe
            title="Peta Lokasi Abadikala Fresh Flowers Lhokseumawe"
            src="https://maps.google.com/maps?q=Banda+Sakti,+Lhokseumawe,+Aceh&t=&z=14&ie=UTF8&iwloc=&output=embed"
            className="h-80 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </div>
    </div>
  );
}

export function FaqPage() {
  usePageTitle('FAQ — Pertanyaan Umum');
  const { data: settings } = useBusinessSettings();
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const faqs = (settings?.faqs || []).filter((f) => f.is_active);

  return (
    <div className="py-12 lg:py-16">
      <div className="container-editorial max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
            Pusat Bantuan
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="mt-3 text-sm text-ink-secondary">
            Temukan jawaban seputar produk Lini Segar, Lini Abadi, pengiriman Lhokseumawe,
            pembayaran, hingga jasa pengawetan buket.
          </p>
        </div>

        <div className="mt-9 space-y-3">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="card-editorial overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-secondary">
                      {faq.category}
                    </span>
                    <p className="mt-0.5 font-serif text-xl font-semibold text-ink-primary">
                      {faq.question}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-line-subtle px-6 py-4 text-sm leading-relaxed text-ink-secondary">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="card-editorial mt-10 flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-serif text-2xl font-semibold text-ink-primary">
              Masih memiliki pertanyaan lain?
            </p>
            <p className="mt-1 text-xs text-ink-secondary">
              Tim studio Abadikala siap membantu Anda setiap hari pukul 08.00–21.00 WIB.
            </p>
          </div>
          <Link to="/contact" className="btn-primary shrink-0">
            Hubungi Kami
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CareGuidePage() {
  usePageTitle('Panduan Perawatan Bunga');
  return (
    <div className="py-12 lg:py-16">
      <div className="container-editorial max-w-4xl space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
            Tips Florist Abadikala
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
            Panduan Perawatan Bunga
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Langkah praktis agar kesegaran rangkaian Lini Segar bertahan lebih lama dan keindahan
            karya Lini Abadi tetap terjaga bertahun-tahun.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="card-editorial p-7">
            <span className="rounded-full bg-brand-sage-soft px-3 py-1 text-xs font-semibold text-brand-sage">
              Lini Segar
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-ink-primary">
              Merawat Bunga Segar
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-secondary">
              <li>
                <strong>1. Potong Batang Miring:</strong> Potong ujung tangkai ±1–2 cm secara miring
                dengan gunting tajam sebelum dimasukkan ke vas agar penyerapan air maksimal.
              </li>
              <li>
                <strong>2. Ganti Air Rutin:</strong> Gunakan air bersih bersuhu ruang dan ganti
                setiap 1–2 hari sekali. Bersihkan dedaunan yang terendam air agar tidak cepat keruh.
              </li>
              <li>
                <strong>3. Pilih Lokasi Sejuk:</strong> Simpan jauh dari sinar matahari langsung,
                hembusan AC langsung, dan buah-buahan matang (gas etilen mempercepat kelayuan).
              </li>
              <li>
                <strong>4. Ingin Diabadikan?</strong> Jika buket berasal dari momen spesial,
                antarkan ke studio kami dalam 1–2 hari setelah acara untuk layanan{' '}
                <Link
                  to="/produk/jasa-pengawetan-buket"
                  className="font-semibold text-brand-primary hover:underline"
                >
                  Jasa Pengawetan Buket
                </Link>
                .
              </li>
            </ul>
          </div>

          <div className="card-editorial p-7">
            <span className="rounded-full bg-brand-blush px-3 py-1 text-xs font-semibold text-brand-primary">
              Lini Abadi
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-ink-primary">
              Merawat Bunga Awetan & Pressed Flower
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-secondary">
              <li>
                <strong>1. Hindari Air & Kelembapan:</strong> Jangan menyiram atau memercikkan air
                pada bunga kering maupun mawar preserved. Simpan di ruangan kering.
              </li>
              <li>
                <strong>2. Lindungi dari Matahari Langsung:</strong> Pajang bingkai pressed flower,
                shadow-box, dan kubah kaca di area teduh agar pigmen alami kelopak tidak cepat pudar.
              </li>
              <li>
                <strong>3. Bersihkan dengan Lembut:</strong> Lap debu pada kaca, akrilik, atau
                kubah menggunakan kain mikrofiber kering yang halus.
              </li>
              <li>
                <strong>4. Jangan Menekan Kelopak:</strong> Hindari menyentuh kelopak mawar
                preserved secara langsung agar bentuk indahnya tetap utuh bertahun-tahun.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderGuidePage() {
  usePageTitle('Panduan Pemesanan');
  const steps = [
    {
      num: '01',
      title: 'Pilih Produk atau Custom Order',
      desc: 'Jelajahi koleksi Lini Segar & Lini Abadi, atau ajukan Custom Bouquet sesuai warna, jenis bunga, dan budget Anda.',
    },
    {
      num: '02',
      title: 'Isi Detail Hadiah & Kartu Ucapan',
      desc: 'Tambahkan ke keranjang, pilih metode pengiriman (Kurir Toko Rp15.000, Pick-up Gratis, atau Ekspedisi Lini Abadi), lalu tulis pesan kartu ucapan tulisan tangan.',
    },
    {
      num: '03',
      title: 'Transfer BSI / BCA & Konfirmasi',
      desc: 'Selesaikan transfer ke rekening resmi Abadikala dan unggah bukti pembayaran. Tim admin kami memverifikasi dalam 1×30 menit pada jam operasional.',
    },
    {
      num: '04',
      title: 'Dirangkai Segar & Dilacak Real-Time',
      desc: 'Florist kami merangkai pesanan Anda dengan penuh ketelitian. Pantau setiap progres melalui halaman Lacak Pesanan.',
    },
  ];

  return (
    <div className="py-12 lg:py-16">
      <div className="container-editorial max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-secondary">
            Cara Berbelanja
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
            Panduan Pemesanan
          </h1>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {steps.map((s) => (
            <div key={s.num} className="card-editorial p-6">
              <span className="font-serif text-4xl font-bold text-brand-secondary">{s.num}</span>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-primary">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/shop" className="btn-primary">
            Mulai Belanja Sekarang
          </Link>
          <Link to="/lacak-pesanan" className="btn-secondary">
            Lacak Pesanan
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LegalPolicyPage({
  type,
}: {
  type: 'privacy' | 'terms' | 'shipping' | 'cancellation';
}) {
  const { data: settings } = useBusinessSettings();

  const meta = {
    privacy: {
      title: 'Kebijakan Privasi',
      subtitle: 'Komitmen perlindungan data pribadi pelanggan Abadikala Fresh Flowers.',
      text: settings?.legal_drafts?.privacy_policy,
    },
    terms: {
      title: 'Syarat dan Ketentuan',
      subtitle: 'Ketentuan layanan pemesanan bunga segar, bunga awetan, dan custom order.',
      text: settings?.legal_drafts?.terms_conditions,
    },
    shipping: {
      title: 'Kebijakan Pengiriman',
      subtitle: 'Informasi tarif, jangkauan Kurir Toko Lhokseumawe, Pick-up Studio, dan Ekspedisi.',
      text: settings?.legal_drafts?.shipping_policy,
    },
    cancellation: {
      title: 'Kebijakan Pembatalan & Pengembalian',
      subtitle: 'Ketentuan pembatalan, penjadwalan ulang, dan garansi kualitas rangkaian.',
      text: settings?.legal_drafts?.cancellation_policy,
    },
  }[type];

  usePageTitle(meta.title);

  const policyLinks = [
    { to: '/privacy-policy', label: 'Kebijakan Privasi', key: 'privacy' },
    { to: '/terms', label: 'Syarat & Ketentuan', key: 'terms' },
    { to: '/shipping-policy', label: 'Kebijakan Pengiriman', key: 'shipping' },
    { to: '/cancellation-policy', label: 'Pembatalan & Refund', key: 'cancellation' },
  ] as const;

  return (
    <div className="py-12 lg:py-16">
      <div className="container-editorial max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 text-xs text-brand-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold uppercase tracking-[0.2em]">Kebijakan Resmi Abadikala</span>
        </div>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink-primary sm:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-2 text-sm text-ink-secondary">{meta.subtitle}</p>

        {/* Quick Policy Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {policyLinks.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                item.key === type
                  ? 'bg-brand-forest text-[#F6F1E7]'
                  : 'border border-line-subtle bg-surface-card text-ink-secondary hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <article className="card-editorial mt-6 whitespace-pre-line p-7 text-sm leading-relaxed text-ink-primary sm:p-9">
          {meta.text}
        </article>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line-subtle bg-surface-muted/60 px-6 py-4 text-xs text-ink-secondary">
          <span>Butuh klarifikasi terkait kebijakan layanan kami?</span>
          <Link to="/contact" className="font-semibold text-brand-primary hover:underline">
            Hubungi Tim Abadikala →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  usePageTitle('Halaman Tidak Ditemukan (404)');
  return (
    <div className="container-editorial py-20 lg:py-28">
      <div className="card-editorial mx-auto max-w-2xl overflow-hidden text-center">
        <div className="bg-brand-forest px-8 py-10 text-[#F6F1E7]">
          <div className="mx-auto flex justify-center">
            <JamPasirBungaMark dark className="h-20 w-16" />
          </div>
          <p className="mt-4 font-serif text-7xl font-semibold tracking-wider text-[#D9A9A3]">
            404
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.26em] text-[#F6F1E7]/75">
            Halaman Tidak Ditemukan
          </p>
        </div>
        <div className="p-8 sm:p-10">
          <h1 className="font-serif text-3xl font-semibold text-ink-primary sm:text-4xl">
            Tangkai yang Anda Cari Tidak Ada di Sini
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
            Maaf, halaman yang Anda tuju mungkin telah dipindahkan atau alamat tautannya kurang
            tepat. Mari kembali menemukan rangkaian bunga terbaik untuk momen berharga Anda.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="btn-primary">
              <Flower2 className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
            <Link to="/shop" className="btn-secondary">
              Lihat Katalog Produk
            </Link>
            <Link to="/custom-order" className="btn-ghost">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              Custom Bouquet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
