# Discovery, Brand Direction & Architecture — Abadikala Fresh Flowers

## 1. Status Pemeriksaan Referensi (Dokumentasi Transparan)

1. **Logo & Brand Sheet Resmi Abadikala (`Jam Pasir Bunga`)**: Telah diperiksa dan diterapkan secara penuh:
   - **Simbol Logo**: *Jam Pasir Bunga* (dua bunga tulip saling berhadapan membentuk jam pasir — Tulip Atas *Muted Blush* `#D9A9A3` & Tulip Bawah *Forest Green* `#1F3D2F` pada latar terang, atau *Warm Ivory* `#F6F1E7` pada latar gelap) dengan wordmark uppercase `ABADIKALA`.
   - **Palet Warna Resmi Logo**: Forest Green `#1F3D2F`, Warm Ivory `#F6F1E7`, Muted Blush `#D9A9A3`.
   - **Nilai Utama Brand**: *Keindahan dalam Setiap Momen*, *Ketahanan Sepanjang Waktu*, *Kehangatan untuk Selamanya*.
   - **Aset Vektor Resmi**: Tersimpan di `public/images/logo-abadikala-full.svg`, `public/images/logo-abadikala-dark.svg`, `public/favicon.svg`, dan komponen `src/components/common/BrandLogo.tsx`.
2. **PDF Proposal Bisnis UMKM Abadikala (23 Halaman — Yulistia Masruri Sitepu, Lhokseumawe)**: Telah diperiksa seluruh 23 halaman termasuk visualisasi produk, konsep *Satu Bunga, Dua Bentuk Produk*, keunggulan kompetitif, daftar 12 produk beserta HPP & harga jual (halaman 11), serta konsep Flower Bar (*"Pilih bungamu, kami rangkai ceritamu"*). Aksen Burgundy Rose `#743844` dan Soft Blush `#F7ECEA` dari PDF dipadukan secara harmonis dengan palet resmi logo di `src/styles/tokens.css`.
3. **Website Referensi (`https://abadikala-web.vercel.app/`)**: Tidak dapat diakses melalui Chrome DevTools MCP pada sesi ini; seluruh arah visual, warna, logo, dan konten mengacu pada Logo Brand Sheet resmi dan PDF 23 halaman di atas.

### Strategi Penyesuaian Fleksibel
- **Palet Warna**: Menggunakan sistem token warna terpusat di `src/styles/tokens.css` dan `tailwind.config.js` dengan arah eksplorasi **Romantic Feminine Floral** (Burgundy, Dusty Rose, Blush Pink, Warm Cream, Sage Green). Apabila warna resmi dari PDF berbeda, seluruh tema aplikasi dapat diperbarui cukup dari satu file token.
- **Logo**: Komponen `BrandLogo` (`src/components/common/BrandLogo.tsx`) dirancang fleksibel agar dapat menampilkan logo SVG/PNG resmi yang diunggah melalui **Admin → Pengaturan Bisnis** atau diletakkan pada `src/assets/`, dengan wordmark editorial serif elegan sebagai fallback default.
- **Konfigurasi Bisnis yang Belum Ditetapkan**: Wilayah pengiriman, ongkos kirim, rekening pembayaran manual, jam operasional, kebijakan pembatalan/refund, nomor WhatsApp resmi, dan akun media sosial tidak dikarang; semuanya tersimpan di tabel `business_settings` & `shipping_methods` dengan status `belum dikonfigurasi` hingga diisi oleh admin.

---

## 2. Design System — Romantic Feminine Floral

| Token | Nilai Eksploratif | Penggunaan |
|---|---|---|
| `--color-brand-primary` | `#6E2C3B` (Deep Burgundy) | CTA utama, aksen brand, active navigation |
| `--color-brand-primary-hover` | `#57212E` | Hover state tombol primer |
| `--color-brand-secondary` | `#C78B95` (Dusty Rose) | Aksen sekunder, badge feminin, divider |
| `--color-brand-blush` | `#F6E6E9` (Blush Pink) | Highlight permukaan lembut, chip kategori |
| `--color-brand-sage` | `#6D826D` (Sage Green) | Aksen natural, badge Lini Segar, status sukses |
| `--color-bg-base` | `#FCF9F6` (Warm Cream) | Latar utama website |
| `--color-bg-surface` | `#FFFFFF` | Kartu produk, panel form, modal |
| `--color-bg-muted` | `#F4ECE6` | Section contrast, skeleton, surface sekunder |
| `--color-text-primary` | `#2B2024` (Warm Espresso Ink) | Teks utama (kontras tinggi > 12:1 pada cream) |
| `--color-text-secondary` | `#66555A` | Deskripsi, metadata, label sekunder |
| `--color-border` | `#E8DDD6` | Border tipis kartu dan input |

**Tipografi**:
- **Display & Headings**: `Cormorant Garamond` (editorial serif, romantis & elegan)
- **Body & UI**: `Plus Jakarta Sans` (modern sans-serif, sangat nyaman dibaca untuk harga, formulir, dan dashboard)

---

## 3. Sitemap & Route Architecture

### Public Storefront (`PublicLayout`)
- `/` — Homepage editorial (Announcement Bar, Hero, Brand Intro, Featured Collections, Best Seller, Shop by Occasion, Brand Story, Personalized Service, Testimonials real-only, Social Gallery CMS, Newsletter, Footer)
- `/shop` — Katalog produk penuh (search, filter lini, kategori, rentang harga, sorting, pagination)
- `/koleksi/:line` — Halaman khusus `lini-segar` & `lini-abadi`
- `/produk/:slug` — Product Detail Page (galeri, varian, bahan, dimensi, estimasi pengerjaan, perawatan, custom notes, produk terkait)
- `/custom-order` — Formulir permintaan custom bouquet & pengawetan + upload gambar referensi
- `/cart` — Keranjang belanja
- `/wishlist` — Daftar keinginan
- `/checkout` — Checkout 5 tahap (Pelanggan, Pengiriman/Pickup, Detail Hadiah, Pembayaran, Konfirmasi)
- `/lacak-pesanan` — Pelacakan pesanan dengan nomor pesanan + verifikasi kontak
- `/tentang-kami` — Filosofi & cerita Abadikala
- `/kontak` — Halaman kontak & form pesan pelanggan
- `/faq` — Pertanyaan umum (dikelola admin)
- `/panduan-perawatan` — Panduan perawatan bunga segar & awetan
- `/panduan-pemesanan` — Alur pemesanan
- `/kebijakan-privasi`, `/syarat-ketentuan`, `/kebijakan-pengiriman`, `/kebijakan-pembatalan` — Halaman legal (draft yang dapat diedit admin)
- `*` — Halaman 404 Not Found

### Auth & Customer Account
- `/login`, `/register`, `/lupa-password`
- `/akun` — Dashboard akun pelanggan (Profil, Alamat Tersimpan, Riwayat & Detail Pesanan, Wishlist, Pengaturan)

### Admin Dashboard (`AdminLayout` — Role Protected: `super_admin`, `admin`, `staff`)
- `/admin/login` — Login khusus admin
- `/admin` — Overview KPI aktual, grafik penjualan, penjualan per lini, stok rendah, custom order baru
- `/admin/produk` — CRUD produk lengkap (harga jual, HPP internal, varian, galeri, stok, arsip)
- `/admin/kategori` — CRUD kategori produk
- `/admin/pesanan` — Manajemen pesanan, verifikasi pembayaran, timeline status, resi, cetak invoice
- `/admin/stok` — Manajemen stok produk jadi & bahan baku, penyesuaian & riwayat pergerakan stok
- `/admin/custom-order` — Tinjau custom request, lihat referensi gambar, beri penawaran harga, konversi ke pesanan
- `/admin/pelanggan` — Daftar pelanggan, kontak, riwayat transaksi & total belanja
- `/admin/konten` — CMS Homepage (Announcement, Hero, Brand Story, Banner, Galeri, Testimoni, FAQ, Kebijakan)
- `/admin/pengaturan` — Pengaturan bisnis (Identitas, Logo, Kontak, Pengiriman, Pembayaran Manual, Layanan)
- `/admin/laporan` — Laporan penjualan harian/mingguan/bulanan/tahunan, per lini, estimasi laba HPP internal, export CSV

---

## 4. Arsitektur Data & Keamanan

### Pemisahan Mode Produksi (Supabase) vs Mode Pratinjau Lokal
- `src/lib/supabase.ts` mendeteksi keberadaan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- **Mode Produksi (Supabase Terhubung)**: Semua operasi menggunakan Supabase PostgreSQL, Supabase Auth, Supabase Storage, dan PostgreSQL RPC dengan Row Level Security (RLS).
- **Mode Pratinjau Lokal (Supabase Belum Terkonfigurasi)**: Aplikasi menampilkan banner status secara transparan dan menggunakan local browser repository (`localStorage`) hanya untuk demonstrasi antarmuka & alur kerja. Tidak ada angka penjualan palsu, testimoni palsu, atau klaim transaksi tersimpan di server.

### Isolasi HPP (Harga Pokok Penjualan)
1. Pada PostgreSQL/Supabase, tabel `products` memiliki RLS `SELECT` khusus role admin (`super_admin`, `admin`, `staff`), sedangkan customer & pengunjung publik hanya membaca view `public.products_public` yang **tidak menyertakan kolom `cost_price`**.
2. Pada `order_items`, kolom `unit_cost_snapshot` dicabut hak baca (`REVOKE SELECT`) dari `anon` dan `authenticated`, dan hanya dibaca melalui fungsi laporan `SECURITY DEFINER` yang memverifikasi role admin.
3. Di lapisan TypeScript, tipe `PublicProduct` dipisahkan secara ketat dari `AdminProduct` sehingga HPP tidak pernah dikirim ke UI customer.
