import type {
  AdminProduct,
  BusinessSettings,
  Category,
  CustomOrderStatus,
  GalleryItem,
  HomepageSection,
  OrderStatus,
  PaymentStatus,
  ShippingMethod,
  Testimonial,
} from '@/types/database';

export const OCCASIONS = [
  'Wisuda',
  'Sidang',
  'Ulang tahun',
  'Hari Ibu',
  'Anniversary',
  'Lamaran',
  'Pernikahan',
  'Hadiah personal',
] as const;

export const CUSTOM_ORDER_OCCASIONS = [
  'Sidang',
  'Wisuda',
  'Ulang tahun',
  'Hari Ibu',
  'Anniversary',
  'Lamaran',
  'Pernikahan',
  'Dekorasi',
  'Hadiah personal',
  'Lainnya',
] as const;

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; colorClass: string; stepIndex: number }
> = {
  awaiting_payment: {
    label: 'Menunggu Pembayaran',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    stepIndex: 0,
  },
  awaiting_verification: {
    label: 'Menunggu Verifikasi',
    colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
    stepIndex: 1,
  },
  payment_confirmed: {
    label: 'Pembayaran Terkonfirmasi',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    stepIndex: 2,
  },
  order_accepted: {
    label: 'Pesanan Diterima',
    colorClass: 'bg-sky-50 text-sky-800 border-sky-200',
    stepIndex: 3,
  },
  processing: {
    label: 'Sedang Diproses',
    colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    stepIndex: 4,
  },
  arranging: {
    label: 'Sedang Dirangkai',
    colorClass: 'bg-brand-blush text-brand-primary border-brand-secondary/40',
    stepIndex: 5,
  },
  ready_for_delivery: {
    label: 'Siap Dikirim',
    colorClass: 'bg-teal-50 text-teal-800 border-teal-200',
    stepIndex: 6,
  },
  out_for_delivery: {
    label: 'Dalam Pengiriman',
    colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
    stepIndex: 7,
  },
  completed: {
    label: 'Selesai',
    colorClass: 'bg-brand-sage-soft text-brand-sage border-brand-sage/30',
    stepIndex: 8,
  },
  cancelled: {
    label: 'Dibatalkan',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
    stepIndex: -1,
  },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; colorClass: string }> = {
  pending: { label: 'Belum Dibayar', colorClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  awaiting_verification: {
    label: 'Menunggu Verifikasi Admin',
    colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  confirmed: {
    label: 'Terkonfirmasi',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  rejected: { label: 'Ditolak', colorClass: 'bg-rose-50 text-rose-800 border-rose-200' },
  refunded: { label: 'Dikembalikan', colorClass: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CUSTOM_ORDER_STATUS_META: Record<
  CustomOrderStatus,
  { label: string; colorClass: string }
> = {
  new: { label: 'Baru', colorClass: 'bg-brand-blush text-brand-primary border-brand-secondary/40' },
  under_review: {
    label: 'Sedang Ditinjau',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  awaiting_quote: {
    label: 'Menunggu Konfirmasi Harga',
    colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  awaiting_customer_approval: {
    label: 'Menunggu Persetujuan Pelanggan',
    colorClass: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  approved: { label: 'Disetujui', colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  in_progress: {
    label: 'Sedang Dikerjakan',
    colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  completed: {
    label: 'Selesai',
    colorClass: 'bg-brand-sage-soft text-brand-sage border-brand-sage/30',
  },
  rejected_or_cancelled: {
    label: 'Ditolak / Dibatalkan',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
};

export const SEED_CATEGORIES: Category[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Buket Segar',
    slug: 'buket-segar',
    product_line: 'fresh',
    description: 'Rangkaian buket bunga segar untuk merayakan momen spesial hari ini.',
    image_url: '/images/product-buket-korea.jpg',
    sort_order: 1,
    is_active: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Bunga Meja & Langganan',
    slug: 'bunga-meja-langganan',
    product_line: 'fresh',
    description: 'Rangkaian bunga segar rutin mingguan untuk memperindah kafe, kantor, dan rumah.',
    image_url: '/images/product-bunga-meja.jpg',
    sort_order: 2,
    is_active: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Flower Bar',
    slug: 'flower-bar',
    product_line: 'fresh',
    description: 'Pilih tangkai bunga favorit Anda secara personal dan kami rangkai langsung.',
    image_url: '/images/product-flower-bar.jpg',
    sort_order: 3,
    is_active: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Bunga Kering & Kubah Kaca',
    slug: 'bunga-kering-kubah-kaca',
    product_line: 'preserved',
    description: 'Keindahan bunga kering dan mawar abadi yang tahan lama sebagai kenangan.',
    image_url: '/images/product-mawar-kubah.jpg',
    sort_order: 4,
    is_active: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'Bingkai, Plakat & Shadow-Box',
    slug: 'bingkai-plakat-shadow-box',
    product_line: 'preserved',
    description: 'Karya pressed flower dan shadow-box personal untuk menyimpan cerita.',
    image_url: '/images/product-pressed-frame.jpg',
    sort_order: 5,
    is_active: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    name: 'Kerajinan Resin & Suvenir',
    slug: 'kerajinan-resin-suvenir',
    product_line: 'preserved',
    description: 'Aksesori personal dengan bunga asli yang diawetkan dalam resin bening.',
    image_url: '/images/product-resin-craft.jpg',
    sort_order: 6,
    is_active: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    name: 'Jasa Pengawetan Buket',
    slug: 'jasa-pengawetan-buket',
    product_line: 'preserved',
    description: 'Layanan mengubah buket momen berharga Anda menjadi karya awetan bernilai.',
    image_url: '/images/product-jasa-pengawetan.jpg',
    sort_order: 7,
    is_active: true,
  },
];

export const SEED_PRODUCTS: AdminProduct[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    category_id: '11111111-1111-4111-8111-111111111101',
    category_name: 'Buket Segar',
    category_slug: 'buket-segar',
    name: 'Buket Kecil Plastik Bening',
    slug: 'buket-kecil-plastik-bening',
    sku: 'ABK-FR-001',
    product_line: 'fresh',
    short_description:
      'Buket mungil manis dalam balutan plastik bening bersih, ideal untuk kado sidang, wisuda, dan hadiah harian.',
    description:
      'Dirangkai dengan bunga segar pilihan hari ini dalam balutan plastik bening modern dan pita satin lembut, lengkap dengan kartu ucapan tulisan tangan. Cocok untuk hadiah manis spontan, sidang skripsi, wisuda, maupun ungkapan perhatian sehari-hari.',
    materials:
      'Bunga segar pilihan musiman (mawar/gerbera/aster), baby breath, wrapping plastik bening premium, pita satin.',
    dimensions: 'Tinggi ± 28–32 cm, lebar ± 18–22 cm',
    care_instructions:
      'Simpan di tempat sejuk, hindari sinar matahari langsung, dan lembapkan kapas tangkai atau pindahkan ke vas berisi air bersih.',
    processing_estimate: '1–2 jam (same-day tersedia sebelum pukul 14.00 WIB)',
    selling_price: 75000,
    compare_at_price: null,
    price_unit: 'buket',
    cost_price: 35000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Tulis nuansa warna pilihan atau pesan singkat kartu ucapan',
    occasions: ['Wisuda', 'Sidang', 'Ulang tahun', 'Hadiah personal'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Buket Kecil Plastik Bening | Abadikala Fresh Flowers',
    seo_description: 'Buket kecil bunga segar dengan tampilan bersih dan elegan mulai Rp75.000 di Lhokseumawe.',
    images: [
      {
        id: 'img-1',
        product_id: '22222222-2222-4222-8222-222222222201',
        image_url: '/images/product-buket-kecil.jpg',
        alt_text: 'Buket Kecil Plastik Bening Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [
      {
        id: 'var-1a',
        product_id: '22222222-2222-4222-8222-222222222201',
        name: 'Nuansa Blush & Cream',
        sku: 'ABK-FR-001-BL',
        price_delta: 0,
        is_active: true,
        sort_order: 1,
      },
      {
        id: 'var-1b',
        product_id: '22222222-2222-4222-8222-222222222201',
        name: 'Nuansa Burgundy & Putih',
        sku: 'ABK-FR-001-BG',
        price_delta: 0,
        is_active: true,
        sort_order: 2,
      },
    ],
    stock_quantity: 18,
    is_stock_configured: true,
    average_rating: 4.9,
    review_count: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    category_id: '11111111-1111-4111-8111-111111111101',
    category_name: 'Buket Segar',
    category_slug: 'buket-segar',
    name: 'Buket Besar Gaya Korea',
    slug: 'buket-besar-gaya-korea',
    sku: 'ABK-FR-002',
    product_line: 'fresh',
    short_description:
      'Rangkaian buket melimpah dengan teknik wrapping berlapis ala florist Korea yang romantis dan lembut.',
    description:
      'Menghadirkan komposisi bunga segar berukuran besar dengan palet warna hangat dan lapisan kertas wrapping Korea yang airy serta elegan, lengkap dengan pita satin dan kartu ucapan tulisan tangan. Pilihan istimewa untuk wisuda, lamaran, dan anniversary.',
    materials:
      'Bunga segar utama (mawar/krisan/musiman), dedaunan eucalyptus, kertas wrapping Korea berlapis, pita satin.',
    dimensions: 'Tinggi ± 48–55 cm, lebar ± 35–42 cm',
    care_instructions:
      'Letakkan di ruang sejuk ber-AC, jauhkan dari panas berlebih, dan lepaskan wrapping jika ingin dipindahkan ke vas berair bersih.',
    processing_estimate: '2–3 jam (disarankan pre-order H-1 untuk pilihan warna khusus)',
    selling_price: 200000,
    compare_at_price: 225000,
    price_unit: 'buket',
    cost_price: 100000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Sebutkan tema warna dominan dan ucapan kartu tulisan tangan',
    occasions: ['Wisuda', 'Anniversary', 'Ulang tahun', 'Lamaran', 'Hari Ibu'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Buket Besar Gaya Korea | Abadikala Fresh Flowers',
    seo_description: 'Buket bunga segar ukuran besar dengan gaya wrapping Korea yang romantis di Lhokseumawe.',
    images: [
      {
        id: 'img-2',
        product_id: '22222222-2222-4222-8222-222222222202',
        image_url: '/images/product-buket-korea.jpg',
        alt_text: 'Buket Besar Gaya Korea Abadikala',
        is_primary: true,
        sort_order: 1,
      },
      {
        id: 'img-2b',
        product_id: '22222222-2222-4222-8222-222222222202',
        image_url: '/images/lini-segar.jpg',
        alt_text: 'Detail Wrapping Buket Gaya Korea',
        is_primary: false,
        sort_order: 2,
      },
    ],
    variants: [
      {
        id: 'var-2a',
        product_id: '22222222-2222-4222-8222-222222222202',
        name: 'Soft Dusty Rose & Ivory',
        sku: 'ABK-FR-002-DR',
        price_delta: 0,
        is_active: true,
        sort_order: 1,
      },
      {
        id: 'var-2b',
        product_id: '22222222-2222-4222-8222-222222222202',
        name: 'Romantic Burgundy',
        sku: 'ABK-FR-002-BG',
        price_delta: 0,
        is_active: true,
        sort_order: 2,
      },
    ],
    stock_quantity: 12,
    is_stock_configured: true,
    average_rating: 5.0,
    review_count: 1,
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    category_id: '11111111-1111-4111-8111-111111111102',
    category_name: 'Bunga Meja & Langganan',
    category_slug: 'bunga-meja-langganan',
    name: 'Bunga Meja Langganan',
    slug: 'bunga-meja-langganan',
    sku: 'ABK-FR-003',
    product_line: 'fresh',
    short_description:
      'Rangkaian bunga segar untuk kafe, kantor, dan rumah yang diganti setiap minggu secara berkala.',
    description:
      'Hadirkan kesegaran alami setiap minggu tanpa repot. Paket langganan bulanan ini dirancang untuk meja kafe, resepsionis kantor, maupun ruang tamu dengan pergantian bunga segar musiman setiap minggu (4× pengiriman per bulan di area Lhokseumawe).',
    materials: 'Kurasi bunga segar musiman berganti setiap minggu, dedaunan eucalyptus alami.',
    dimensions: 'Diameter rangkaian standar ± 20–28 cm',
    care_instructions:
      'Ganti air vas setiap 2 hari sekali dan potong ujung batang ±1 cm secara miring agar kesegaran bertahan optimal hingga pergantian minggu berikutnya.',
    processing_estimate: 'Pengantaran rutin setiap minggu sesuai jadwal yang disepakati',
    selling_price: 350000,
    compare_at_price: null,
    price_unit: 'bulan',
    cost_price: 180000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Tuliskan preferensi suasana warna ruangan dan hari pengantaran',
    occasions: ['Hadiah personal', 'Hari Ibu'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    allow_backorder: true,
    seo_title: 'Bunga Meja Langganan Bulanan | Abadikala Fresh Flowers',
    seo_description: 'Paket langganan bunga meja segar per bulan mulai Rp350.000/bulan untuk kafe & kantor di Lhokseumawe.',
    images: [
      {
        id: 'img-3',
        product_id: '22222222-2222-4222-8222-222222222203',
        image_url: '/images/product-bunga-meja.jpg',
        alt_text: 'Bunga Meja Langganan Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 10,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    category_id: '11111111-1111-4111-8111-111111111103',
    category_name: 'Flower Bar',
    category_slug: 'flower-bar',
    name: 'Flower Bar',
    slug: 'flower-bar',
    sku: 'ABK-FR-004',
    product_line: 'fresh',
    short_description:
      'Pilih bungamu, kami rangkai ceritamu — pilih sendiri tangkai bunga segar favorit untuk dirangkai langsung.',
    description:
      'Layanan Flower Bar Abadikala memungkinkan Anda memilih sendiri tangkai bunga segar (Mawar, Krisan, Aster, Gerbera, Baby Breath), warna wrapping, dan pita sesuai selera serta anggaran. Harga menyesuaikan jumlah dan jenis tangkai yang dipilih.',
    materials: 'Pilihan tangkai segar: Mawar, Krisan, Aster, Gerbera, Baby Breath, kertas pembungkus & pita.',
    dimensions: 'Fleksibel sesuai pilihan tangkai',
    care_instructions: 'Ikuti panduan perawatan bunga segar sesuai jenis tangkai yang dipilih.',
    processing_estimate: 'Dirangkai langsung di studio atau melalui konsultasi Custom Order',
    selling_price: null,
    compare_at_price: null,
    price_unit: 'rangkaian',
    cost_price: null,
    is_price_on_request: true,
    is_customizable: true,
    customization_prompt: 'Ajukan pilihan bunga & budget melalui halaman Custom Order',
    occasions: ['Hadiah personal', 'Ulang tahun', 'Anniversary', 'Wisuda'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    allow_backorder: true,
    seo_title: 'Flower Bar Personal | Abadikala Fresh Flowers',
    seo_description: 'Pilih bunga favorit Anda sendiri dan rangkai langsung di Flower Bar Abadikala Lhokseumawe.',
    images: [
      {
        id: 'img-4',
        product_id: '22222222-2222-4222-8222-222222222204',
        image_url: '/images/product-flower-bar.jpg',
        alt_text: 'Flower Bar Abadikala Fresh Flowers',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 20,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-04T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    category_id: '11111111-1111-4111-8111-111111111104',
    category_name: 'Bunga Kering & Kubah Kaca',
    category_slug: 'bunga-kering-kubah-kaca',
    name: 'Buket Bunga Kering',
    slug: 'buket-bunga-kering',
    sku: 'ABK-PR-001',
    product_line: 'preserved',
    short_description:
      'Buket bunga kering artistik dalam balutan kraft-linen yang tidak layu dan tahan berbulan-bulan.',
    description:
      'Terbuat dari bunga kering dan preserved pilihan dengan perpaduan warna hangat. Cocok bagi Anda yang menginginkan hadiah estetis yang dapat disimpan bertahun-tahun sebagai kenangan dan aman dikirim ke luar kota.',
    materials: 'Bunga kering pilihan, preserved hydrangea/baby breath, kertas wrapping kraft/linen, pita kain.',
    dimensions: 'Tinggi ± 35–42 cm, lebar ± 22–28 cm',
    care_instructions:
      'Simpan di ruangan kering, hindari area lembap dan sinar matahari langsung agar warna tetap awet.',
    processing_estimate: '1–2 hari kerja (ready stock warna pilihan di studio)',
    selling_price: 120000,
    compare_at_price: null,
    price_unit: 'buket',
    cost_price: 40000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Pilih nuansa warna (cream, dusty rose, burgundy, natural)',
    occasions: ['Wisuda', 'Sidang', 'Ulang tahun', 'Anniversary', 'Hadiah personal'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Buket Bunga Kering | Abadikala Fresh Flowers',
    seo_description: 'Buket bunga kering estetik dan tahan lama mulai Rp120.000.',
    images: [
      {
        id: 'img-5',
        product_id: '22222222-2222-4222-8222-222222222205',
        image_url: '/images/product-buket-kering.jpg',
        alt_text: 'Buket Bunga Kering Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 14,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222206',
    category_id: '11111111-1111-4111-8111-111111111105',
    category_name: 'Bingkai, Plakat & Shadow-Box',
    category_slug: 'bingkai-plakat-shadow-box',
    name: 'Bingkai Pressed Flower',
    slug: 'bingkai-pressed-flower',
    sku: 'ABK-PR-002',
    product_line: 'preserved',
    short_description:
      'Karya seni kelopak bunga pres asli dalam bingkai kaca minimalis, dapat ditambah nama dan tanggal.',
    description:
      'Setiap kelopak bunga dipres dengan cermat dan disusun secara artistik dalam bingkai kaca elegan. Sangat cocok sebagai dekorasi estetik maupun hadiah kelulusan, anniversary, dan pernikahan penuh makna.',
    materials: 'Bunga asli yang telah dipres, bingkai kayu minimalis dengan kaca pelindung, kartu ucapan personal.',
    dimensions: 'Standar bingkai ± 15×20 cm atau 20×25 cm',
    care_instructions:
      'Bersihkan kaca dengan kain mikrofiber kering. Hindari paparan matahari langsung terus-menerus.',
    processing_estimate: '2–3 hari kerja (pre-order personalisasi nama & tanggal)',
    selling_price: 175000,
    compare_at_price: null,
    price_unit: 'bingkai',
    cost_price: 60000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Tuliskan nama/tanggal/kutipan singkat jika ingin ditambahkan',
    occasions: ['Anniversary', 'Pernikahan', 'Wisuda', 'Hari Ibu', 'Hadiah personal'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Bingkai Pressed Flower | Abadikala Fresh Flowers',
    seo_description: 'Bingkai pressed flower estetik dari bunga asli mulai Rp175.000.',
    images: [
      {
        id: 'img-6',
        product_id: '22222222-2222-4222-8222-222222222206',
        image_url: '/images/product-pressed-frame.jpg',
        alt_text: 'Bingkai Pressed Flower Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 9,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-06T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222207',
    category_id: '11111111-1111-4111-8111-111111111105',
    category_name: 'Bingkai, Plakat & Shadow-Box',
    category_slug: 'bingkai-plakat-shadow-box',
    name: 'Plakat Akrilik Bunga Pres',
    slug: 'plakat-akrilik-bunga-pres',
    sku: 'ABK-PR-003',
    product_line: 'preserved',
    short_description:
      'Plakat akrilik bening berhias bunga pres asli dengan alas kayu hangat untuk hadiah wisuda atau apresiasi.',
    description:
      'Menampilkan bunga asli yang dipres rapi pada lembar akrilik bening berkualitas, dilengkapi dudukan kayu minimalis. Modern, personal, dan tahan lama.',
    materials: 'Akrilik bening premium, bunga pres asli, dudukan kayu natural.',
    dimensions: 'Standar ± 15×20 cm dengan stand kayu',
    care_instructions: 'Lap permukaan akrilik menggunakan kain lembut agar tidak tergores.',
    processing_estimate: '2–4 hari kerja (termasuk konfirmasi teks personalisasi)',
    selling_price: 150000,
    compare_at_price: null,
    price_unit: 'plakat',
    cost_price: 50000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Cantumkan nama, ucapan, dan tanggal yang ingin ditampilkan',
    occasions: ['Wisuda', 'Sidang', 'Ulang tahun', 'Anniversary'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: false,
    is_new_arrival: true,
    allow_backorder: true,
    seo_title: 'Plakat Akrilik Bunga Pres | Abadikala Fresh Flowers',
    seo_description: 'Plakat akrilik bunga pres personal dengan stand kayu mulai Rp150.000.',
    images: [
      {
        id: 'img-7',
        product_id: '22222222-2222-4222-8222-222222222207',
        image_url: '/images/product-plakat-akrilik.jpg',
        alt_text: 'Plakat Akrilik Bunga Pres Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 11,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-07T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222208',
    category_id: '11111111-1111-4111-8111-111111111105',
    category_name: 'Bingkai, Plakat & Shadow-Box',
    category_slug: 'bingkai-plakat-shadow-box',
    name: 'Shadow-Box Nama dan Gelar',
    slug: 'shadow-box-nama-dan-gelar',
    sku: 'ABK-PR-004',
    product_line: 'preserved',
    short_description:
      'Bingkai 3D berdimensi dalam dengan mawar kering, nama, dan gelar—personal untuk wisudawan.',
    description:
      'Dirancang khusus untuk merayakan kelulusan, sidang, maupun momen pernikahan. Kedalaman bingkai shadow-box menjaga dimensi bunga kering tetap utuh dan berkelas.',
    materials: 'Bingkai kayu shadow-box 3D dengan kaca, mawar kering & filler pilihan, tipografi nama & gelar.',
    dimensions: 'Standar ± 20×25 cm dengan kedalaman 4–5 cm',
    care_instructions: 'Pajang di ruangan kering dan hindari kelembapan tinggi.',
    processing_estimate: '3–5 hari kerja (pre-order H-3 untuk cetak tipografi nama & gelar)',
    selling_price: 275000,
    compare_at_price: null,
    price_unit: 'frame',
    cost_price: 115000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Tulis nama lengkap beserta gelar serta tanggal momen',
    occasions: ['Wisuda', 'Sidang', 'Pernikahan'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Shadow-Box Nama dan Gelar | Abadikala Fresh Flowers',
    seo_description: 'Bingkai shadow-box bunga awetan personal dengan nama dan gelar mulai Rp275.000.',
    images: [
      {
        id: 'img-8',
        product_id: '22222222-2222-4222-8222-222222222208',
        image_url: '/images/product-shadow-box.jpg',
        alt_text: 'Shadow-Box Nama dan Gelar Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 8,
    is_stock_configured: true,
    average_rating: 5.0,
    review_count: 1,
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222209',
    category_id: '11111111-1111-4111-8111-111111111104',
    category_name: 'Bunga Kering & Kubah Kaca',
    category_slug: 'bunga-kering-kubah-kaca',
    name: 'Mawar Kubah Kaca',
    slug: 'mawar-kubah-kaca',
    sku: 'ABK-PR-005',
    product_line: 'preserved',
    short_description:
      'Setangkai mawar awetan penuh keanggunan di dalam kubah kaca bening beralas kayu hangat.',
    description:
      'Terinspirasi dari simbol kasih sayang yang tak lekang oleh waktu. Mawar preserved dilindungi kubah kaca jernih sehingga tampil romantis sebagai hadiah premium untuk anniversary, lamaran, atau ulang tahun.',
    materials: 'Mawar preserved pilihan, kubah kaca bening, alas kayu natural, filler dried moss.',
    dimensions: 'Tinggi kubah ± 18–22 cm, diameter alas ± 11–13 cm',
    care_instructions:
      'Jangan membuka kubah kaca terlalu sering dan hindari menyentuh kelopak mawar secara langsung.',
    processing_estimate: '1–2 hari kerja (tersedia pengiriman luar kota dengan packing aman)',
    selling_price: 250000,
    compare_at_price: 275000,
    price_unit: 'set',
    cost_price: 110000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Pilih warna mawar jika tersedia dan tulis pesan kartu ucapan',
    occasions: ['Anniversary', 'Lamaran', 'Ulang tahun', 'Pernikahan', 'Hari Ibu'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Mawar Kubah Kaca Preserved | Abadikala Fresh Flowers',
    seo_description: 'Mawar abadi di dalam kubah kaca romantis mulai Rp250.000.',
    images: [
      {
        id: 'img-9',
        product_id: '22222222-2222-4222-8222-222222222209',
        image_url: '/images/product-mawar-kubah.jpg',
        alt_text: 'Mawar Kubah Kaca Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 7,
    is_stock_configured: true,
    average_rating: 5.0,
    review_count: 1,
    created_at: '2026-01-09T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222210',
    category_id: '11111111-1111-4111-8111-111111111106',
    category_name: 'Kerajinan Resin & Suvenir',
    category_slug: 'kerajinan-resin-suvenir',
    name: 'Gantungan Kunci Resin',
    slug: 'gantungan-kunci-resin',
    sku: 'ABK-PR-006',
    product_line: 'preserved',
    short_description:
      'Gantungan kunci resin bening buatan tangan berisi kelopak bunga asli—suvenir mungil yang terjangkau.',
    description:
      'Hadiah mungil yang personal dan terjangkau untuk sahabat, pelajar, mahasiswa, maupun suvenir acara. Setiap kepingan unik karena menggunakan kelopak bunga asli yang diawetkan dalam resin jernih.',
    materials: 'Resin bening berkualitas, kelopak bunga asli terawetkan, ring gantungan logam.',
    dimensions: 'Diameter/panjang ± 4–5 cm',
    care_instructions: 'Hindari goresan benda tajam dan paparan panas ekstrem.',
    processing_estimate: '1–3 hari kerja (ready stock pilihan bunga harian)',
    selling_price: 35000,
    compare_at_price: null,
    price_unit: 'pcs',
    cost_price: 13000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Tulis pilihan inisial huruf atau nuansa warna kelopak (opsional)',
    occasions: ['Hadiah personal', 'Ulang tahun', 'Wisuda', 'Sidang'],
    is_active: true,
    is_archived: false,
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: true,
    allow_backorder: true,
    seo_title: 'Gantungan Kunci Resin Bunga Asli | Abadikala Fresh Flowers',
    seo_description: 'Gantungan kunci resin handmade berisi bunga asli mulai Rp35.000.',
    images: [
      {
        id: 'img-10',
        product_id: '22222222-2222-4222-8222-222222222210',
        image_url: '/images/product-resin-craft.jpg',
        alt_text: 'Gantungan Kunci Resin Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 25,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222211',
    category_id: '11111111-1111-4111-8111-111111111106',
    category_name: 'Kerajinan Resin & Suvenir',
    category_slug: 'kerajinan-resin-suvenir',
    name: 'Pembatas Buku Bunga Pres',
    slug: 'pembatas-buku-bunga-pres',
    sku: 'ABK-PR-007',
    product_line: 'preserved',
    short_description:
      'Pembatas buku transparan dengan susunan bunga pres lembut dan rumbai tassel untuk menemani bacaan.',
    description:
      'Menyimpan ketenangan kelopak bunga asli di sela buku kesayangan Anda. Sangat terjangkau, manis, dan ideal untuk hadiah kecil, pelajar, mahasiswa, maupun pelengkap kado kotak kraft.',
    materials: 'Resin tipis/laminasi bening, bunga pres asli, rumbai tassel lembut.',
    dimensions: 'Ukuran ± 14×4 cm',
    care_instructions: 'Simpan rata di dalam buku dan hindari lipatan.',
    processing_estimate: '1–2 hari kerja',
    selling_price: 25000,
    compare_at_price: null,
    price_unit: 'pcs',
    cost_price: 8000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Pilih nuansa warna bunga (lembut/pastel/natural)',
    occasions: ['Hadiah personal', 'Wisuda', 'Sidang', 'Ulang tahun'],
    is_active: true,
    is_archived: false,
    is_featured: false,
    is_best_seller: false,
    is_new_arrival: true,
    allow_backorder: true,
    seo_title: 'Pembatas Buku Bunga Pres | Abadikala Fresh Flowers',
    seo_description: 'Pembatas buku bunga pres asli yang manis dan terjangkau mulai Rp25.000.',
    images: [
      {
        id: 'img-11',
        product_id: '22222222-2222-4222-8222-222222222211',
        image_url: '/images/product-resin-craft.jpg',
        alt_text: 'Pembatas Buku Bunga Pres Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 30,
    is_stock_configured: true,
    average_rating: null,
    review_count: 0,
    created_at: '2026-01-11T00:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222212',
    category_id: '11111111-1111-4111-8111-111111111107',
    category_name: 'Jasa Pengawetan Buket',
    category_slug: 'jasa-pengawetan-buket',
    name: 'Jasa Pengawetan Buket',
    slug: 'jasa-pengawetan-buket',
    sku: 'ABK-PR-008',
    product_line: 'preserved',
    short_description:
      'Abadikan buket lamaran, pernikahan, atau wisuda Anda menjadi bingkai kenangan yang bertahan bertahun-tahun.',
    description:
      'Jangan biarkan buket dari momen terpenting dalam hidup Anda layu begitu saja. Tim Abadikala akan mengeringkan, mempres, dan menata ulang bunga asli dari buket Anda ke dalam bingkai atau shadow-box kenangan yang abadi.',
    materials: 'Bunga asli dari buket pelanggan, media preservasi & bingkai sesuai pilihan paket.',
    dimensions: 'Menyesuaikan ukuran bingkai & kondisi buket pelanggan',
    care_instructions:
      'Serahkan buket ke studio kami secepat mungkin setelah acara (idealnya 1–2 hari) agar warna dan bentuk kelopak tetap optimal.',
    processing_estimate: '14–21 hari kerja (proses pengeringan alami & penyusunan detail)',
    selling_price: 350000,
    compare_at_price: null,
    price_unit: 'layanan',
    cost_price: 130000,
    is_price_on_request: false,
    is_customizable: true,
    customization_prompt: 'Jelaskan jenis acara, tanggal acara, dan bentuk akhir yang diinginkan',
    occasions: ['Pernikahan', 'Lamaran', 'Wisuda', 'Anniversary'],
    is_active: true,
    is_archived: false,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    allow_backorder: true,
    seo_title: 'Jasa Pengawetan Buket Pernikahan & Wisuda | Abadikala Fresh Flowers',
    seo_description: 'Layanan pengawetan buket bunga segar menjadi karya seni awetan mulai Rp350.000 di Lhokseumawe.',
    images: [
      {
        id: 'img-12',
        product_id: '22222222-2222-4222-8222-222222222212',
        image_url: '/images/product-jasa-pengawetan.jpg',
        alt_text: 'Jasa Pengawetan Buket Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 6,
    is_stock_configured: true,
    average_rating: 5.0,
    review_count: 1,
    created_at: '2026-01-12T00:00:00Z',
  },
];

export const SEED_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    section_key: 'announcement_bar',
    title: 'Abadikala Fresh Flowers',
    subtitle: null,
    content: {
      text: 'Segar Hari Ini, Abadi Selamanya • Pengiriman Area Lhokseumawe Rp15.000 & Gratis Pick-up di Studio Banda Sakti',
    },
    is_active: true,
    sort_order: 1,
  },
  {
    section_key: 'hero',
    title: 'Setiap Bunga Punya Cerita.',
    subtitle:
      'Rayakan momen berharga dengan rangkaian bunga segar dan kenangan indah yang dapat diabadikan bersama Abadikala di Lhokseumawe, Aceh.',
    content: {
      primary_cta_label: 'Belanja Sekarang',
      primary_cta_url: '/shop',
      secondary_cta_label: 'Jelajahi Koleksi',
      secondary_cta_url: '/koleksi/fresh',
      image_url: '/images/hero-abadikala.jpg',
    },
    is_active: true,
    sort_order: 2,
  },
  {
    section_key: 'brand_intro',
    title: 'Satu bunga, dua bentuk keindahan.',
    subtitle:
      'Makna Abadikala berasal dari "abadi" dan "kala"—waktu yang diabadikan. Kami percaya bunga bukan sekadar hadiah sesaat, tetapi cara lembut untuk menyampaikan perasaan dan menyimpan kenangan.',
    content: {
      fresh_title: 'Lini Segar',
      fresh_desc:
        'Rangkaian bunga segar pilihan untuk dinikmati hari ini—tampil romantis dan elegan dengan harga yang tetap ramah di kantong.',
      preserved_title: 'Lini Abadi',
      preserved_desc:
        'Bunga kering, bingkai pressed flower, mawar kubah kaca, hingga jasa pengawetan buket agar momen terindah Anda terus tersimpan.',
    },
    is_active: true,
    sort_order: 3,
  },
  {
    section_key: 'brand_story',
    title: 'Dari Segar Menjadi Abadi.',
    subtitle: 'Setiap tangkai bunga memiliki cerita yang terlalu berharga untuk berakhir layu begitu saja.',
    content: {
      paragraphs: [
        'Di Abadikala, bunga segar yang tidak terjual maupun buket penuh kenangan milik pelanggan dapat diolah dengan telaten menjadi karya seni bunga awetan yang bernilai.',
        'Mulai dari pressed flower dalam bingkai kaca, shadow-box wisuda, hingga aksesori resin—kami membantu Anda menjaga keindahan momen berharga tetap hidup sepanjang waktu.',
      ],
      image_url: '/images/product-jasa-pengawetan.jpg',
    },
    is_active: true,
    sort_order: 4,
  },
  {
    section_key: 'newsletter',
    title: 'Kabar Hangat dari Studio Abadikala',
    subtitle: 'Daftarkan email Anda untuk informasi koleksi musiman, promo wisuda, dan tips merawat bunga.',
    content: { enabled: true },
    is_active: true,
    sort_order: 5,
  },
];

export const SEED_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Rangkaian Editorial Abadikala',
    caption: 'Komposisi mawar blush, ranunculus burgundy, dan sage eucalyptus.',
    image_url: '/images/hero-abadikala.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Segar',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'gal-2',
    title: 'Buket Besar Gaya Korea',
    caption: 'Balutan kertas lembut berlapis dengan sentuhan feminin modern untuk wisuda & lamaran.',
    image_url: '/images/product-buket-korea.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Segar',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'gal-3',
    title: 'Bingkai Pressed Flower',
    caption: 'Kelopak bunga asli yang dipres rapi dalam bingkai kayu & kaca minimalis.',
    image_url: '/images/product-pressed-frame.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Abadi',
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'gal-4',
    title: 'Mawar Kubah Kaca',
    caption: 'Keindahan mawar awetan dalam kubah kaca sebagai simbol kenangan abadi.',
    image_url: '/images/product-mawar-kubah.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Abadi',
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'gal-5',
    title: 'Shadow-Box Wisuda Personal',
    caption: 'Mawar kering berdimensi 3D lengkap dengan nama dan gelar kelulusan.',
    image_url: '/images/product-shadow-box.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Abadi',
    is_active: true,
    sort_order: 5,
  },
  {
    id: 'gal-6',
    title: 'Flower Bar Studio Banda Sakti',
    caption: 'Pilih bungamu sendiri—mawar, krisan, aster, gerbera, dan baby breath segar.',
    image_url: '/images/product-flower-bar.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Segar',
    is_active: true,
    sort_order: 6,
  },
  {
    id: 'gal-7',
    title: 'Suvenir Resin & Pembatas Buku',
    caption: 'Kelopak bunga asli terawetkan dalam resin bening, kado manis untuk sahabat.',
    image_url: '/images/product-resin-craft.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Lini Abadi',
    is_active: true,
    sort_order: 7,
  },
  {
    id: 'gal-8',
    title: 'Meja Kerja Pengawetan Buket',
    caption: 'Proses teliti mengubah buket hari spesial menjadi bingkai kenangan.',
    image_url: '/images/product-jasa-pengawetan.jpg',
    external_link: 'https://instagram.com/abadikalaflowers',
    category_tag: 'Jasa Pengawetan',
    is_active: true,
    sort_order: 8,
  },
];

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: 'testi-1',
    customer_name: 'Cut Nadira Salsabila',
    occasion: 'Wisuda Universitas Malikussaleh',
    rating: 5,
    quote:
      'Pesan Buket Besar Gaya Korea untuk wisuda adik saya. Bunganya segar banget, wrapping-nya rapi dan elegan seperti florist di kota besar, padahal harganya sangat bersahabat. Kartu ucapan tulisan tangannya juga manis sekali!',
    is_published: true,
    created_at: '2026-09-14T08:00:00Z',
  },
  {
    id: 'testi-2',
    customer_name: 'Teuku Farhan Pratama',
    occasion: 'Anniversary di Lhokseumawe',
    rating: 5,
    quote:
      'Mawar Kubah Kaca dari Abadikala jadi hadiah paling berkesan untuk istri saya. Packing aman, pengantaran kurir studio tepat waktu ke rumah di Muara Dua, dan tampilannya benar-benar premium.',
    is_published: true,
    created_at: '2026-10-03T11:30:00Z',
  },
  {
    id: 'testi-3',
    customer_name: 'Raudhatul Jannah',
    occasion: 'Jasa Pengawetan Buket Pernikahan',
    rating: 5,
    quote:
      'Senang sekali buket akad nikah saya tidak berakhir layu. Tim Abadikala mengolahnya menjadi bingkai shadow-box yang indah dan sekarang jadi pajangan favorit di ruang tamu kami.',
    is_published: true,
    created_at: '2026-10-21T15:15:00Z',
  },
  {
    id: 'testi-4',
    customer_name: 'Dinda Khairunnisa',
    occasion: 'Sidang Skripsi & Kado Sahabat',
    rating: 5,
    quote:
      'Buket Kecil Plastik Bening Rp75.000 sudah terlihat sangat manis dan estetik untuk kado sidang teman kampus. Suka banget karena di Lhokseumawe akhirnya ada toko bunga segar yang rapi dan mudah dipesan online.',
    is_published: true,
    created_at: '2026-11-05T09:45:00Z',
  },
];

export const SEED_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship-1',
    code: 'local_delivery',
    name: 'Kurir Toko Area Lhokseumawe',
    method_type: 'delivery',
    description:
      'Pengantaran langsung oleh kurir khusus Abadikala menjaga rangkaian bunga segar tetap utuh dan sejuk sampai tujuan.',
    service_area: 'Kota Lhokseumawe (Banda Sakti, Muara Dua, Muara Satu, Blang Mangat)',
    base_fee: 15000,
    estimated_duration: '1–2 jam setelah selesai dirangkai',
    is_configured: true,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'ship-2',
    code: 'store_pickup',
    name: 'Ambil di Studio (Pick-up)',
    method_type: 'pickup',
    description:
      'Ambil langsung pesanan Anda di studio Abadikala Banda Sakti tanpa biaya ongkir sesuai jadwal yang disepakati.',
    service_area: 'Jl. Merdeka Barat No. 48, Simpang Empat, Banda Sakti, Lhokseumawe',
    base_fee: 0,
    estimated_duration: 'Setiap hari, 08.00–21.00 WIB',
    is_configured: true,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'ship-3',
    code: 'outer_city_preserved',
    name: 'Ekspedisi Luar Kota (Khusus Lini Abadi)',
    method_type: 'delivery',
    description:
      'Pengiriman paket aman menggunakan kotak kraft & bubble wrap khusus untuk produk bunga awetan ke seluruh Aceh dan luar kota.',
    service_area: 'Seluruh Aceh & Nasional (Khusus Lini Abadi)',
    base_fee: 25000,
    estimated_duration: '2–4 hari kerja',
    is_configured: true,
    is_active: true,
    sort_order: 3,
  },
];

export const SEED_BUSINESS_SETTINGS: BusinessSettings = {
  brand_identity: {
    business_name: 'Abadikala Fresh Flowers',
    short_name: 'Abadikala',
    tagline: 'Segar Hari Ini, Abadi Selamanya',
    city: 'Lhokseumawe, Aceh, Indonesia',
    logo_url: '',
  },
  contact_info: {
    is_configured: true,
    address: 'Jl. Merdeka Barat No. 48, Simpang Empat, Kec. Banda Sakti, Kota Lhokseumawe, Aceh 24351',
    whatsapp: '+62 822-7410-8820',
    email: 'halo@abadikalaflowers.id',
    operational_hours: 'Senin–Minggu, 08.00–21.00 WIB',
  },
  social_links: {
    is_configured: true,
    instagram: 'https://instagram.com/abadikalaflowers',
    tiktok: 'https://tiktok.com/@abadikalaflowers',
    facebook: 'https://facebook.com/abadikalaflowers',
  },
  delivery_policy: {
    is_configured: true,
    service_areas:
      'Pengantaran langsung area Kota Lhokseumawe (Banda Sakti, Muara Dua, Muara Satu, Blang Mangat) serta pengiriman ekspedisi seluruh Indonesia khusus produk Lini Abadi.',
    courier_info: 'Kurir Toko Khusus Abadikala (Rp15.000) & Pick-up di Studio (Rp0)',
    min_order_amount: 25000,
    preorder_lead_time:
      'Minimal H-1 untuk buket segar custom & H-3 untuk bingkai pressed flower/shadow-box personal. Same-day tersedia untuk buket segar sebelum pukul 14.00 WIB.',
    processing_time:
      'Buket segar 1–3 jam • Produk Lini Abadi 2–5 hari kerja • Jasa Pengawetan Buket 14–21 hari kerja',
    pickup_available: true,
  },
  payment_config: {
    is_configured: true,
    manual_transfer_enabled: true,
    payment_gateway_enabled: false,
    bank_accounts: [
      {
        bank_name: 'Bank Syariah Indonesia (BSI)',
        account_number: '7189 4025 18',
        account_holder: 'Abadikala Fresh Flowers (Yulistia Masruri Sitepu)',
      },
      {
        bank_name: 'Bank Central Asia (BCA)',
        account_number: '8240 5192 73',
        account_holder: 'Abadikala Fresh Flowers (Yulistia Masruri Sitepu)',
      },
    ],
    payment_instructions:
      'Lakukan transfer sesuai nominal total pesanan ke rekening resmi BSI atau BCA di atas, lalu unggah bukti transfer melalui halaman konfirmasi pesanan. Tim admin Abadikala memverifikasi pembayaran maksimal 1×30 menit selama jam operasional (08.00–21.00 WIB).',
  },
  personalized_services: {
    handwritten_card: true,
    custom_bouquet: true,
    color_request: true,
    bouquet_preservation: true,
    gift_arrangement: true,
  },
  legal_drafts: {
    is_final: true,
    privacy_policy: `Abadikala Fresh Flowers menghormati privasi setiap pelanggan dan berkomitmen melindungi seluruh data pribadi yang Anda percayakan kepada kami saat berbelanja secara online maupun di studio.

1. Data yang Kami Kumpulkan
Kami hanya mengumpulkan data yang diperlukan untuk memproses dan mengantarkan pesanan Anda, meliputi: nama pemesan, alamat email, nomor WhatsApp, alamat pengiriman, nama dan nomor telepon penerima hadiah, pesan pada kartu ucapan, serta foto referensi pada layanan Custom Order.

2. Penggunaan Informasi
Data Anda digunakan semata-mata untuk:
• Memproses, merangkai, dan mengantarkan pesanan bunga tepat waktu.
• Mengonfirmasi verifikasi pembayaran manual dan mengirimkan pembaruan status pesanan.
• Menuliskan kartu ucapan personal sesuai permintaan Anda.
• Memberikan layanan konsultasi terkait Custom Bouquet atau Jasa Pengawetan Buket.

3. Perlindungan & Kerahasiaan Data
Abadikala tidak pernah menjual, menyewakan, atau membagikan informasi pribadi pelanggan maupun isi kartu ucapan kepada pihak ketiga di luar kebutuhan operasional pengiriman. Seluruh data akun tersimpan dengan autentikasi terenkripsi dan kebijakan Row Level Security (RLS).

4. Hak Pelanggan
Anda berhak memperbarui data profil, menghapus alamat tersimpan melalui halaman Akun Saya, atau mengajukan penghapusan data dengan menghubungi halo@abadikalaflowers.id.`,

    terms_conditions: `Selamat datang di Abadikala Fresh Flowers. Dengan melakukan pemesanan melalui website atau studio kami di Lhokseumawe, Anda menyetujui syarat dan ketentuan layanan berikut:

1. Sifat Alami Produk Bunga Segar & Awetan
Bunga adalah produk alami yang setiap tangkainya memiliki karakter warna, ukuran kelopak, dan ketersediaan musiman yang unik. Apabila jenis bunga tertentu sedang kosong karena faktor cuaca atau pasokan, tim florist kami akan menggantinya dengan bunga bernilai dan bernuansa warna setara setelah mengonfirmasi kepada Anda.

2. Pemesanan & Waktu Pre-Order
• Pesanan same-day untuk buket segar dilayani hingga pukul 14.00 WIB sesuai ketersediaan bunga harian.
• Pesanan custom bouquet disarankan minimal H-1, dan produk personalisasi Lini Abadi (Shadow-Box, Plakat Akrilik, Pressed Flower) minimal H-3 sebelum tanggal kebutuhan.
• Untuk Custom Order, harga resmi ditetapkan melalui penawaran admin dan baru diproses setelah disetujui pelanggan.

3. Pembayaran & Verifikasi
Pembayaran dilakukan melalui transfer bank resmi (BSI atau BCA) yang tertera pada halaman checkout. Pesanan mulai dirangkai setelah pembayaran terverifikasi oleh admin Abadikala.

4. Jasa Pengawetan Buket
Pelanggan dianjurkan menyerahkan buket dalam waktu 1–2 hari setelah acara. Perubahan warna alami tertentu selama proses pengeringan merupakan karakter normal bunga asli yang diawetkan.`,

    shipping_policy: `Abadikala Fresh Flowers memastikan setiap rangkaian bunga segar dan karya bunga awetan tiba dalam kondisi terbaik melalui pilihan pengantaran berikut:

1. Kurir Toko Area Lhokseumawe — Rp15.000
• Melayani seluruh wilayah Kota Lhokseumawe (Kec. Banda Sakti, Muara Dua, Muara Satu, dan Blang Mangat).
• Diantar langsung oleh kurir khusus studio agar bunga segar terlindungi dari panas dan guncangan.
• Estimasi pengantaran 1–2 jam setelah rangkaian selesai dibuat.

2. Pick-up di Studio Banda Sakti — Rp0 (Gratis)
• Lokasi: Jl. Merdeka Barat No. 48, Simpang Empat, Kec. Banda Sakti, Kota Lhokseumawe, Aceh.
• Dapat diambil setiap hari Senin–Minggu pukul 08.00–21.00 WIB sesuai jam janjian pesanan.

3. Pengiriman Luar Kota (Khusus Lini Abadi) — Rp25.000
• Produk bunga awetan (buket bunga kering, bingkai pressed flower, plakat akrilik, shadow-box, mawar kubah kaca, dan aksesori resin) dikemas rapi dalam kotak kraft pelindung dan dapat dikirim ke seluruh Aceh maupun luar provinsi.
• Estimasi pengiriman 2–4 hari kerja sesuai jasa ekspedisi.

4. Ketepatan Alamat & Penerima
Pastikan alamat dan nomor telepon penerima aktif pada jadwal pengiriman. Jika penerima tidak berada di lokasi, kurir akan menghubungi pemesan untuk arahan penitipan yang aman.`,

    cancellation_policy: `Kami memahami bahwa rencana terkadang dapat berubah. Berikut ketentuan pembatalan, penjadwalan ulang, dan pengembalian dana di Abadikala Fresh Flowers:

1. Pembatalan Pesanan
• Sebelum pembayaran diverifikasi: pesanan dapat dibatalkan kapan saja tanpa biaya.
• Pesanan Lini Segar yang sudah terbayar: pembatalan dengan pengembalian dana penuh (100%) dapat diajukan maksimal H-1 (24 jam) sebelum jadwal pengiriman atau sebelum proses perangkaian dimulai.
• Pesanan yang sudah mulai dirangkai, sudah dicetak nama/gelarnya (Shadow-Box/Plakat), atau sudah dalam perjalanan pengiriman tidak dapat dibatalkan.

2. Penjadwalan Ulang (Reschedule)
Perubahan tanggal atau jam pengiriman dapat diajukan maksimal 6 jam sebelum jadwal pengiriman semula melalui WhatsApp resmi +62 822-7410-8820.

3. Garansi Kualitas & Penggantian
Apabila rangkaian tiba dalam kondisi rusak berat, kelopak layu parah, atau terdapat kesalahan penulisan nama/gelar dari pihak kami, segera kirimkan foto produk dalam waktu maksimal 3 jam setelah diterima. Kami akan memberikan perbaikan, pengiriman ulang, atau pengembalian dana sesuai kesepakatan secara cepat dan transparan.`,
  },
  faqs: [
    {
      id: 'faq-1',
      category: 'Produk & Lini',
      question: 'Apa perbedaan Lini Segar dan Lini Abadi di Abadikala?',
      answer:
        'Lini Segar menghadirkan rangkaian bunga segar pilihan untuk dinikmati hari ini seperti buket kecil plastik bening, buket besar gaya Korea, bunga meja langganan mingguan, dan Flower Bar. Lini Abadi menghadirkan produk bunga awetan yang bertahan berbulan-bulan hingga bertahun-tahun seperti buket bunga kering, bingkai pressed flower, plakat akrilik, shadow-box nama & gelar, mawar kubah kaca, aksesori resin, serta jasa pengawetan buket.',
      is_active: true,
    },
    {
      id: 'faq-2',
      category: 'Pemesanan & Pre-Order',
      question: 'Apakah bisa pesan mendadak (same-day) di area Lhokseumawe?',
      answer:
        'Bisa! Untuk buket bunga segar, kami melayani pemesanan same-day selama pesanan dan konfirmasi pembayaran diterima sebelum pukul 14.00 WIB (menyesuaikan ketersediaan bunga harian). Untuk custom bouquet dengan permintaan bunga tertentu disarankan pre-order H-1, dan untuk produk personalisasi Lini Abadi (Shadow-Box/Plakat/Pressed Flower) minimal H-3.',
      is_active: true,
    },
    {
      id: 'faq-3',
      category: 'Pengiriman',
      question: 'Berapa ongkos kirim di Lhokseumawe dan apakah bisa kirim ke luar kota?',
      answer:
        'Untuk seluruh area Kota Lhokseumawe (Banda Sakti, Muara Dua, Muara Satu, Blang Mangat), tarif Kurir Toko adalah Rp15.000 flat, atau Anda dapat memilih Ambil di Studio (Pick-up) secara gratis di Jl. Merdeka Barat No. 48, Banda Sakti. Khusus produk Lini Abadi (bunga awetan), kami juga melayani pengiriman ke seluruh Aceh dan luar kota dengan kotak kraft aman.',
      is_active: true,
    },
    {
      id: 'faq-4',
      category: 'Pembayaran',
      question: 'Metode pembayaran apa saja yang tersedia?',
      answer:
        'Saat ini kami menerima pembayaran melalui transfer Bank Syariah Indonesia (BSI) dan Bank Central Asia (BCA). Setelah melakukan checkout, unggah bukti transfer melalui halaman konfirmasi agar tim admin kami dapat memverifikasi pembayaran dalam 1×30 menit pada jam operasional (08.00–21.00 WIB).',
      is_active: true,
    },
    {
      id: 'faq-5',
      category: 'Custom Order & Flower Bar',
      question: 'Bagaimana cara memesan Custom Bouquet atau Flower Bar sesuai budget?',
      answer:
        'Kunjungi halaman Custom Bouquet, pilih jenis produk, acara, tanggal kebutuhan, kisaran anggaran, serta nuansa warna (Anda juga dapat mengunggah foto inspirasi). Tim florist kami akan memberikan penawaran harga khusus sebelum pesanan diproses. Anda juga dapat memilih langsung tangkai Mawar, Krisan, Aster, Gerbera, dan Baby Breath di Flower Bar studio kami.',
      is_active: true,
    },
    {
      id: 'faq-6',
      category: 'Pengawetan Buket',
      question: 'Kapan waktu terbaik menyerahkan buket untuk Jasa Pengawetan Buket?',
      answer:
        'Idealnya buket diserahkan 1–2 hari setelah acara (wisuda, lamaran, atau pernikahan) saat kelopak bunga masih segar agar warna dan bentuk hasil awetannya maksimal. Proses pengeringan dan penyusunan bingkai membutuhkan waktu 14–21 hari kerja.',
      is_active: true,
    },
  ],
};
