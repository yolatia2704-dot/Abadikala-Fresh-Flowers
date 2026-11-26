import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Clock, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useBusinessSettings } from '@/hooks/useStoreQueries';
import { buildWhatsAppUrl } from '@/utils/format';

export function Footer() {
  const { data: settings } = useBusinessSettings();

  const identity = settings?.brand_identity;
  const contact = settings?.contact_info;
  const social = settings?.social_links;

  const waUrl = contact?.whatsapp ? buildWhatsAppUrl(contact.whatsapp) : null;

  return (
    <footer className="no-print border-t border-line-subtle bg-brand-forest text-[#F6F1E7]/85">
      <div className="container-editorial py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <BrandLogo dark />
            <p className="mt-4 font-serif text-lg italic text-[#D9A9A3]">
              "{identity?.tagline || 'Segar Hari Ini, Abadi Selamanya'}"
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#F6F1E7]/75">
              Florist modern di Lhokseumawe, Aceh yang menghadirkan rangkaian bunga segar (Lini
              Segar) dan produk bunga awetan (Lini Abadi) berkualitas premium dengan harga
              terjangkau.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#F6F1E7]/25 px-3.5 py-1 text-xs transition-colors hover:border-[#D9A9A3] hover:text-[#D9A9A3]"
                >
                  Instagram
                </a>
              )}
              {social?.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#F6F1E7]/25 px-3.5 py-1 text-xs transition-colors hover:border-[#D9A9A3] hover:text-[#D9A9A3]"
                >
                  TikTok
                </a>
              )}
              {social?.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#F6F1E7]/25 px-3.5 py-1 text-xs transition-colors hover:border-[#D9A9A3] hover:text-[#D9A9A3]"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#F6F1E7]">Jelajahi</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F6F1E7]/75">
              <li><Link to="/shop" className="hover:text-[#D9A9A3]">Semua Produk</Link></li>
              <li><Link to="/koleksi/fresh" className="hover:text-[#D9A9A3]">Lini Segar</Link></li>
              <li><Link to="/koleksi/preserved" className="hover:text-[#D9A9A3]">Lini Abadi</Link></li>
              <li><Link to="/custom-order" className="hover:text-[#D9A9A3]">Custom Bouquet</Link></li>
              <li><Link to="/lacak-pesanan" className="hover:text-[#D9A9A3]">Lacak Pesanan</Link></li>
              <li><Link to="/about" className="hover:text-[#D9A9A3]">Tentang Abadikala</Link></li>
              <li><Link to="/contact" className="hover:text-[#D9A9A3]">Kontak Kami</Link></li>
            </ul>
          </div>

          {/* Panduan & Kebijakan */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#F6F1E7]">Informasi & Kebijakan</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F6F1E7]/75">
              <li><Link to="/panduan-pemesanan" className="hover:text-[#D9A9A3]">Panduan Pemesanan</Link></li>
              <li><Link to="/care-guide" className="hover:text-[#D9A9A3]">Panduan Perawatan Bunga</Link></li>
              <li><Link to="/faq" className="hover:text-[#D9A9A3]">FAQ</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-[#D9A9A3]">Kebijakan Pengiriman</Link></li>
              <li><Link to="/cancellation-policy" className="hover:text-[#D9A9A3]">Kebijakan Pembatalan</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-[#D9A9A3]">Kebijakan Privasi</Link></li>
              <li><Link to="/terms" className="hover:text-[#D9A9A3]">Syarat & Ketentuan</Link></li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#F6F1E7]">Studio & Kontak</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#F6F1E7]/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D9A9A3]" />
                <span>
                  {contact?.address ||
                    'Jl. Merdeka Barat No. 48, Simpang Empat, Banda Sakti, Lhokseumawe, Aceh'}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#D9A9A3]" />
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noreferrer" className="hover:text-[#D9A9A3]">
                    {contact?.whatsapp}
                  </a>
                ) : (
                  <span>{contact?.whatsapp || '+62 822-7410-8820'}</span>
                )}
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#D9A9A3]" />
                <a
                  href={`mailto:${contact?.email || 'halo@abadikalaflowers.id'}`}
                  className="hover:text-[#D9A9A3]"
                >
                  {contact?.email || 'halo@abadikalaflowers.id'}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#D9A9A3]" />
                <span>{contact?.operational_hours || 'Senin–Minggu, 08.00–21.00 WIB'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#F6F1E7]/15 pt-8 text-xs text-[#F6F1E7]/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {identity?.business_name || 'Abadikala Fresh Flowers'}.
            Lhokseumawe, Aceh, Indonesia.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-[#F6F1E7]/70 transition-colors hover:text-[#D9A9A3]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Portal Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
