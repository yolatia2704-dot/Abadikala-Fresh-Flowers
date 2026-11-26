# Abadikala Fresh Flowers — E-Commerce Web Application

> *"Segar Hari Ini, Abadi Selamanya"*  
> Platform e-commerce modern untuk florist **Abadikala Fresh Flowers** (Lhokseumawe, Aceh, Indonesia) yang menghadirkan **Lini Segar**, **Lini Abadi**, pemesanan **Custom Bouquet**, pelacakan pesanan, akun pelanggan, serta **Dashboard Admin** lengkap dengan keamanan Row Level Security (RLS).

---

## Fitur Utama

### Storefront & Pelanggan
- **Homepage Editorial**: Announcement bar (CMS), Hero, Filosofi *Satu bunga, dua bentuk keindahan*, Koleksi Lini Segar & Lini Abadi, Produk Unggulan, Shop by Occasion, Cerita Brand *Dari Segar Menjadi Abadi*, Layanan Personal (toggle via Admin), Testimoni Nyata (tanpa testimoni palsu), Galeri Visual Studio, Newsletter, dan Footer dinamis.
- **Katalog & Detail Produk**: Pencarian, filter lini, kategori, acara, rentang harga, sorting, pagination, galeri foto, varian, detail bahan, dimensi, instruksi perawatan, catatan personalisasi, dan JSON-LD SEO.
- **Keranjang & Wishlist**: Slide-over cart drawer + halaman keranjang penuh, validasi stok, persistensi lokal, wishlist.
- **Checkout 5 Tahap**: Informasi pelanggan, pengiriman/pickup (menghormati metode yang dikonfigurasi admin), detail hadiah & kartu ucapan, pembayaran manual terkonfigurasi, dan konfirmasi + unggah bukti transfer (tidak pernah auto-paid tanpa verifikasi admin).
- **Custom Order**: Formulir permintaan buket custom / pengawetan buket lengkap dengan upload referensi gambar (validasi tipe & ukuran ≤ 5 MB).
- **Pelacakan Pesanan & Akun Pelanggan**: Lacak pesanan dengan nomor order + email/WhatsApp, registrasi/login/lupa password, profil, alamat tersimpan, dan riwayat pesanan.

### Dashboard Admin (`/admin`)
- **Role-Based Access Control (RBAC)**: `super_admin`, `admin`, dan `staff`.
- **Overview**: KPI aktual dari database, grafik penjualan per lini (Recharts), produk terlaris, pesanan terbaru, dan peringatan stok rendah.
- **CRUD Produk & HPP Internal**: Kelola harga jual, harga diskon, **HPP internal (terisolasi dari customer)**, estimasi margin, gambar, kategori, status aktif/arsip.
- **CRUD Kategori**: Kelola kategori Lini Segar & Lini Abadi beserta urutan.
- **Manajemen Pesanan**: Verifikasi pembayaran manual, pembaruan 10 status pesanan, nomor resi, pengurangan stok idempoten (anti pengurangan ganda), catatan internal, dan **Cetak Invoice**.
- **Manajemen Stok**: Pisahkan stok produk jadi & stok bahan baku florist, batas minimum, penyesuaian stok, dan riwayat pergerakan stok.
- **Manajemen Custom Order**: Tinjau permintaan & gambar referensi, kirim penawaran harga, dan konversi ke pesanan resmi setelah disetujui pelanggan.
- **Pelanggan, Pesan Masuk & Audit Log**: Direktori pelanggan, kotak masuk kontak, dan catatan audit tindakan admin.
- **CMS Website & Pengaturan Bisnis**: Kelola konten homepage, galeri, testimoni terverifikasi, logo, kontak, metode pengiriman, rekening pembayaran manual, layanan personal, dan draft kebijakan legal.
- **Laporan Penjualan & Laba**: Filter harian/mingguan/bulanan/tahunan/tanggal, perhitungan pendapatan, HPP internal, estimasi laba kotor, dan **Export CSV**.

---

## Struktur Folder

```text
├── docs/
│   └── DISCOVERY_AND_ARCHITECTURE.md   # Dokumentasi discovery, design system & keterbatasan referensi
├── public/
│   ├── images/                         # Aset fotografi editorial flora Abadikala
│   ├── robots.txt
│   └── sitemap.xml
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # 30 tabel relasional PostgreSQL (UUID, NUMERIC)
│   │   ├── 002_rls_and_security.sql    # RLS 30 tabel, view products_public (tanpa HPP), Storage policies
│   │   └── 003_functions_and_rpcs.sql  # Trigger profile, RPC checkout, tracking, update order & laporan
│   └── seed.sql                        # 12 produk awal proposal + kategori + konfigurasi awal
└── src/
    ├── components/                     # UI, Layout, Header, Footer, ProductCard, CartDrawer
    ├── constants/                      # Status meta & seed pratinjau lokal
    ├── contexts/                       # AuthContext, CartContext, WishlistContext, ToastContext
    ├── hooks/                          # TanStack Query hooks & SEO helper
    ├── lib/                            # Inisialisasi klien Supabase
    ├── pages/
    │   ├── public/                     # Homepage, Shop, PDP, Cart, Wishlist, Checkout, Custom Order, Tracking, Info
    │   ├── auth/                       # Login, Register, Forgot Password, Admin Login
    │   ├── customer/                   # Dashboard Akun Pelanggan
    │   └── admin/                      # 10 modul lengkap Dashboard Admin
    ├── routes/                         # CustomerGuard & AdminGuard
    ├── schemas/                        # Validasi Zod
    ├── services/                       # API terpadu (Supabase produksi & pratinjau lokal terpisah)
    ├── styles/                         # tokens.css (design tokens terpusat) & index.css
    ├── types/                          # Tipe TypeScript ketat (PublicProduct vs AdminProduct)
    └── utils/                          # Formatter IDR, tanggal, slugify, export CSV
```

---

## Instalasi & Menjalankan Secara Lokal

```bash
# 1. Instal dependensi
npm install

# 2. Salin template environment variables
cp .env.example .env

# 3. Jalankan server pengembangan
npm run dev

# 4. Build produksi & cek TypeScript
npm run build
```

> **Mode Pratinjau Lokal vs Produksi:**  
> Jika `.env` belum diisi kredensial Supabase, aplikasi berjalan dalam **Mode Pratinjau Lokal** secara transparan (ditandai banner di bagian atas). Data disimpan sementara di `localStorage` browser untuk pengujian alur tanpa berpura-pura tersimpan di server produksi. Setelah `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` diisi, seluruh aplikasi otomatis terhubung ke Supabase produksi.

---

## Konfigurasi Supabase Produksi

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/dashboard).
2. Buka **SQL Editor** dan jalankan file berikut secara berurutan:
   1. `supabase/migrations/001_initial_schema.sql`
   2. `supabase/migrations/002_rls_and_security.sql`
   3. `supabase/migrations/003_functions_and_rpcs.sql`
   4. `supabase/seed.sql`
3. Daftarkan akun pemilik/admin melalui halaman `/register`, lalu promosikan peran menjadi `super_admin` di SQL Editor:
   ```sql
   UPDATE public.user_roles
   SET role = 'super_admin'
   WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'email-pemilik@domain.com');
   ```
4. Salin **Project URL** dan **anon public key** (JANGAN gunakan `service_role` key di frontend!) ke file `.env`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## Panduan Deployment Vercel

1. Push repository ini ke GitHub.
2. Buka [Vercel](https://vercel.com/) → **Add New Project** → impor repository GitHub Anda.
3. Framework preset otomatis terdeteksi sebagai **Vite** (`npm run build`, output `dist`). File `vercel.json` sudah disertakan untuk SPA routing & security headers.
4. Tambahkan Environment Variables di **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL`
5. Klik **Deploy**. Setelah live, lengkapi data operasional bisnis (kontak, ongkos kirim, rekening pembayaran manual, dan kebijakan final) melalui `/admin/pengaturan`.

---

## Checklist Pengujian (QA)

- [x] `npm run typecheck` dan `npm run build` lulus tanpa error TypeScript/Vite.
- [x] Navigasi publik, pencarian, filter lini/kategori/acara/harga, dan sorting berfungsi.
- [x] Tambah ke keranjang, ubah jumlah, hapus item, dan hitung total berjalan akurat.
- [x] Flower Bar menampilkan "Harga Menyesuaikan" dan mengarahkan ke Custom Order tanpa mengarang harga.
- [x] Checkout 5 tahap tervalidasi Zod, membuat nomor pesanan, dan tidak mengubah status pembayaran menjadi lunas secara sepihak.
- [x] Order Tracking memverifikasi nomor pesanan + kontak dan menampilkan timeline status.
- [x] Proteksi route `/admin` menolak akses non-admin dan mengarahkan ke `/admin/login`.
- [x] Isolasi HPP: `PublicProduct` dan view `products_public` tidak memuat `cost_price`.
- [x] CRUD Produk, Kategori, Pesanan, Stok (idempoten), Custom Order, CMS, Pengaturan Bisnis, dan Laporan CSV berfungsi end-to-end.
