-- ==============================================================================
-- Abadikala Fresh Flowers — Initial Seed Data (From Business Proposal)
-- Safe to re-run (uses ON CONFLICT DO NOTHING).
-- Contains ONLY official proposal products & editable business configuration stubs.
-- NO fake orders, NO fake testimonials, NO fake ratings, NO invented policies.
-- ==============================================================================

-- 1. Categories
INSERT INTO public.categories (id, name, slug, product_line, description, image_url, sort_order, is_active) VALUES
  ('11111111-1111-4111-8111-111111111101', 'Buket Segar', 'buket-segar', 'fresh', 'Rangkaian buket bunga segar untuk merayakan momen spesial hari ini.', '/images/product-buket-korea.jpg', 1, TRUE),
  ('11111111-1111-4111-8111-111111111102', 'Bunga Meja & Langganan', 'bunga-meja-langganan', 'fresh', 'Rangkaian bunga segar rutin untuk memperindah ruang kerja dan rumah.', '/images/product-bunga-meja.jpg', 2, TRUE),
  ('11111111-1111-4111-8111-111111111103', 'Flower Bar', 'flower-bar', 'fresh', 'Pilih tangkai bunga favorit Anda secara personal dan kami rangkai langsung.', '/images/product-flower-bar.jpg', 3, TRUE),
  ('11111111-1111-4111-8111-111111111104', 'Bunga Kering & Kubah Kaca', 'bunga-kering-kubah-kaca', 'preserved', 'Keindahan bunga kering dan mawar abadi yang tahan lama sebagai kenangan.', '/images/product-mawar-kubah.jpg', 4, TRUE),
  ('11111111-1111-4111-8111-111111111105', 'Bingkai, Plakat & Shadow-Box', 'bingkai-plakat-shadow-box', 'preserved', 'Karya pressed flower dan shadow-box personal untuk menyimpan cerita.', '/images/product-pressed-frame.jpg', 5, TRUE),
  ('11111111-1111-4111-8111-111111111106', 'Kerajinan Resin & Suvenir', 'kerajinan-resin-suvenir', 'preserved', 'Aksesori personal dengan bunga asli yang diawetkan dalam resin bening.', '/images/product-resin-craft.jpg', 6, TRUE),
  ('11111111-1111-4111-8111-111111111107', 'Jasa Pengawetan Buket', 'jasa-pengawetan-buket', 'preserved', 'Layanan mengubah buket momen berharga Anda menjadi karya awetan bernilai.', '/images/product-jasa-pengawetan.jpg', 7, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. Official 12 Proposal Products (Selling Price + Internal HPP)
INSERT INTO public.products (
  id, category_id, name, slug, sku, product_line,
  short_description, description, materials, dimensions, care_instructions, processing_estimate,
  selling_price, price_unit, cost_price, is_price_on_request, is_customizable, customization_prompt,
  occasions, is_active, is_featured, is_best_seller, is_new_arrival, allow_backorder,
  seo_title, seo_description
) VALUES
  -- LINI SEGAR
  (
    '22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101',
    'Buket Kecil Plastik Bening', 'buket-kecil-plastik-bening', 'ABK-FR-001', 'fresh',
    'Buket mungil manis dalam balutan plastik bening bersih, ramah di kantong namun tetap elegan.',
    'Dirangkai dengan bunga segar pilihan hari ini dalam balutan plastik bening modern dan pita satin lembut. Cocok untuk hadiah manis spontan, sidang, wisuda, maupun ungkapan perhatian sehari-hari.',
    'Bunga segar pilihan musiman, baby breath/filler lembut, wrapping plastik bening premium, pita satin.',
    'Tinggi ± 28–32 cm, lebar ± 18–22 cm',
    'Simpan di tempat sejuk, hindari sinar matahari langsung, dan ganti air atau lembapkan kapas tangkai secara berkala.',
    'Estimasi pengerjaan dikonfirmasi sesuai jadwal operasional admin',
    75000.00, 'buket', 35000.00, FALSE, TRUE, 'Tulis nuansa warna pilihan atau pesan singkat kartu ucapan',
    ARRAY['Wisuda', 'Sidang', 'Ulang tahun', 'Hadiah personal'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Buket Kecil Plastik Bening | Abadikala Fresh Flowers',
    'Buket kecil bunga segar dengan tampilan bersih dan elegan mulai Rp75.000 di Abadikala Fresh Flowers Lhokseumawe.'
  ),
  (
    '22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111101',
    'Buket Besar Gaya Korea', 'buket-besar-gaya-korea', 'ABK-FR-002', 'fresh',
    'Rangkaian buket melimpah dengan teknik wrapping berlapis ala florist Korea yang romantis dan lembut.',
    'Menghadirkan komposisi bunga segar berukuran besar dengan palet warna hangat dan lapisan kertas wrapping Korea yang airy serta elegan. Menjadi pilihan istimewa untuk perayaan besar penuh makna.',
    'Bunga segar utama (mawar/musiman), dedaunan eucalyptus, kertas wrapping Korea berlapis, pita grosgrain/satin.',
    'Tinggi ± 48–55 cm, lebar ± 35–42 cm',
    'Letakkan di ruang sejuk ber-AC, jauhkan dari panas berlebih, dan lepaskan wrapping jika ingin dipindahkan ke vas berair bersih.',
    'Disarankan pemesanan lebih awal sesuai ketersediaan bunga segar',
    200000.00, 'buket', 100000.00, FALSE, TRUE, 'Sebutkan tema warna dominan dan ucapan kartu tulisan tangan',
    ARRAY['Wisuda', 'Anniversary', 'Ulang tahun', 'Lamaran', 'Hari Ibu'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Buket Besar Gaya Korea | Abadikala Fresh Flowers',
    'Buket bunga segar ukuran besar dengan gaya wrapping Korea yang romantis mulai Rp200.000.'
  ),
  (
    '22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111102',
    'Bunga Meja Langganan', 'bunga-meja-langganan', 'ABK-FR-003', 'fresh',
    'Layanan bunga meja segar berkala per bulan untuk memperhangat ruang kerja, kafe, atau rumah Anda.',
    'Hadirkan kesegaran alami setiap minggu tanpa repot. Paket langganan bulanan ini dirancang untuk meja resepsionis, ruang tamu, kantor, maupun ruang pribadi dengan kurasi bunga musiman terbaik.',
    'Kurasi bunga segar musiman berganti secara berkala, dedaunan alami, opsi penyesuaian vas.',
    'Menyesuaikan ukuran meja (standar diameter rangkaian ± 20–28 cm)',
    'Ganti air vas setiap 2 hari sekali dan potong ujung batang ±1 cm secara miring agar kesegaran bertahan lebih lama.',
    'Jadwal pengantaran berkala disepakati bersama admin',
    350000.00, 'bulan', 180000.00, FALSE, TRUE, 'Tuliskan preferensi suasana warna ruangan dan hari pengantaran yang diinginkan',
    ARRAY['Hadiah personal', 'Hari Ibu'], TRUE, TRUE, FALSE, TRUE, TRUE,
    'Bunga Meja Langganan Bulanan | Abadikala Fresh Flowers',
    'Paket langganan bunga meja segar per bulan mulai Rp350.000/bulan dari Abadikala Fresh Flowers.'
  ),
  (
    '22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111103',
    'Flower Bar', 'flower-bar', 'ABK-FR-004', 'fresh',
    'Pengalaman memilih tangkai bunga favorit Anda sendiri untuk dirangkai langsung secara personal.',
    'Layanan Flower Bar Abadikala memungkinkan Anda menentukan sendiri kombinasi bunga, warna, dan gaya wrapping sesuai selera serta anggaran. Harga menyesuaikan jumlah dan jenis tangkai yang dipilih.',
    'Pilihan tangkai bunga segar harian, dedaunan, serta kertas wrapping & pita pilihan.',
    'Fleksibel sesuai pilihan tangkai',
    'Ikuti panduan perawatan bunga segar Abadikala sesuai jenis tangkai yang dipilih.',
    'Dirangkai langsung atau melalui konsultasi custom order',
    NULL, 'rangkaian', NULL, TRUE, TRUE, 'Gunakan halaman Custom Order untuk memilih bunga dan kisaran budget Anda',
    ARRAY['Hadiah personal', 'Ulang tahun', 'Anniversary', 'Wisuda'], TRUE, TRUE, FALSE, TRUE, TRUE,
    'Flower Bar Personal | Abadikala Fresh Flowers',
    'Pilih bunga favorit Anda sendiri dan rangkai langsung bersama layanan Flower Bar Abadikala Fresh Flowers.'
  ),
  -- LINI ABADI
  (
    '22222222-2222-4222-8222-222222222205', '11111111-1111-4111-8111-111111111104',
    'Buket Bunga Kering', 'buket-bunga-kering', 'ABK-PR-001', 'preserved',
    'Buket bunga kering artistik dengan tone lembut yang tidak layu dan mempercantik ruang dalam waktu lama.',
    'Terbuat dari bunga kering dan preserved pilihan dengan perpaduan warna hangat. Cocok bagi Anda yang menginginkan hadiah estetis yang dapat disimpan bertahun-tahun sebagai kenangan.',
    'Bunga kering pilihan, preserved hydrangea/baby breath, kertas wrapping natural/linen, pita kain.',
    'Tinggi ± 35–42 cm, lebar ± 22–28 cm',
    'Simpan di ruangan kering, hindari area lembap dan sinar matahari langsung agar warna tetap awet.',
    'Estimasi pengerjaan dikonfirmasi melalui pengaturan operasional',
    120000.00, 'buket', 40000.00, FALSE, TRUE, 'Pilih nuansa warna (cream, dusty rose, burgundy, natural)',
    ARRAY['Wisuda', 'Sidang', 'Ulang tahun', 'Anniversary', 'Hadiah personal'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Buket Bunga Kering | Abadikala Fresh Flowers',
    'Buket bunga kering estetik dan tahan lama mulai Rp120.000 di Lini Abadi Abadikala Fresh Flowers.'
  ),
  (
    '22222222-2222-4222-8222-222222222206', '11111111-1111-4111-8111-111111111105',
    'Bingkai Pressed Flower', 'bingkai-pressed-flower', 'ABK-PR-002', 'preserved',
    'Karya seni bunga pres asli dalam bingkai kaca minimalis untuk menyimpan keindahan botani selamanya.',
    'Setiap kelopak bunga dipres dengan cermat dan disusun secara artistik dalam bingkai kaca elegan. Sangat cocok sebagai dekorasi estetik maupun hadiah kenang-kenangan penuh makna.',
    'Bunga asli yang telah dipres, bingkai kayu/minimalis dengan kaca pelindung, opsi teks singkat.',
    'Standar ukuran bingkai ± 15×20 cm atau 20×25 cm',
    'Bersihkan kaca dengan kain mikrofiber kering. Hindari paparan matahari langsung terus-menerus.',
    'Memerlukan proses penyusunan detail sesuai antrean pengerjaan',
    175000.00, 'bingkai', 60000.00, FALSE, TRUE, 'Tuliskan nama/tanggal/kutipan singkat jika ingin ditambahkan pada bingkai',
    ARRAY['Anniversary', 'Pernikahan', 'Wisuda', 'Hari Ibu', 'Hadiah personal'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Bingkai Pressed Flower | Abadikala Fresh Flowers',
    'Bingkai pressed flower estetik dari bunga asli mulai Rp175.000 di Abadikala Fresh Flowers.'
  ),
  (
    '22222222-2222-4222-8222-222222222207', '11111111-1111-4111-8111-111111111105',
    'Plakat Akrilik Bunga Pres', 'plakat-akrilik-bunga-pres', 'ABK-PR-003', 'preserved',
    'Plakat akrilik jernih berpadu bunga pres asli dan stand kayu hangat untuk hadiah wisuda atau apresiasi.',
    'Menampilkan bunga asli yang dipres rapi pada lembar akrilik bening berkualitas, dilengkapi dudukan kayu minimalis. Modern, personal, dan tahan lama.',
    'Akrilik bening premium, bunga pres asli, dudukan kayu natural, personalisasi teks.',
    'Standar ± 15×20 cm dengan stand kayu',
    'Lap permukaan akrilik menggunakan kain lembut agar tidak tergores. Jauhkan dari panas tinggi.',
    'Memerlukan konfirmasi teks personalisasi sebelum dicetak/dirangkai',
    150000.00, 'plakat', 50000.00, FALSE, TRUE, 'Cantumkan nama, ucapan, dan tanggal yang ingin ditampilkan pada plakat',
    ARRAY['Wisuda', 'Sidang', 'Ulang tahun', 'Anniversary'], TRUE, TRUE, FALSE, TRUE, TRUE,
    'Plakat Akrilik Bunga Pres | Abadikala Fresh Flowers',
    'Plakat akrilik bunga pres personal dengan stand kayu mulai Rp150.000.'
  ),
  (
    '22222222-2222-4222-8222-222222222208', '11111111-1111-4111-8111-111111111105',
    'Shadow-Box Nama dan Gelar', 'shadow-box-nama-dan-gelar', 'ABK-PR-004', 'preserved',
    'Bingkai 3D berdimensi dalam untuk mengabadikan bunga kering bersama nama, gelar, dan momen pencapaian.',
    'Dirancang khusus untuk merayakan kelulusan, sidang, maupun momen pernikahan. Kedalaman bingkai shadow-box menjaga dimensi bunga tetap utuh dan mewah.',
    'Bingkai kayu shadow-box 3D dengan kaca, bunga kering/preserved pilihan, tipografi nama & gelar.',
    'Standar ± 20×25 cm dengan kedalaman 4–5 cm',
    'Pajang di ruangan kering dan hindari kelembapan tinggi agar tekstur bunga tetap prima.',
    'Memerlukan konfirmasi ejaan nama dan gelar sebelum pengerjaan',
    275000.00, 'frame', 115000.00, FALSE, TRUE, 'Tulis nama lengkap beserta gelar serta tanggal momen yang ingin diabadikan',
    ARRAY['Wisuda', 'Sidang', 'Pernikahan'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Shadow-Box Nama dan Gelar | Abadikala Fresh Flowers',
    'Bingkai shadow-box bunga awetan personal dengan nama dan gelar mulai Rp275.000.'
  ),
  (
    '22222222-2222-4222-8222-222222222209', '11111111-1111-4111-8111-111111111104',
    'Mawar Kubah Kaca', 'mawar-kubah-kaca', 'ABK-PR-005', 'preserved',
    'Setangkai mawar awetan penuh keanggunan di dalam kubah kaca bening beralas kayu hangat.',
    'Terinspirasi dari simbol kasih sayang yang tak lekang oleh waktu. Mawar preserved dilindungi kubah kaca jernih sehingga tampil romantis sebagai hadiah anniversary, lamaran, atau ulang tahun.',
    'Mawar preserved pilihan, kubah kaca borosilikat/bening, alas kayu natural, filler dried moss/baby breath.',
    'Tinggi kubah ± 18–22 cm, diameter alas ± 11–13 cm',
    'Jangan membuka kubah kaca terlalu sering dan hindari menyentuh kelopak mawar secara langsung.',
    'Tersedia sesuai stok kubah kaca & mawar preserved',
    250000.00, 'set', 110000.00, FALSE, TRUE, 'Pilih warna mawar jika tersedia dan tulis pesan kartu ucapan',
    ARRAY['Anniversary', 'Lamaran', 'Ulang tahun', 'Pernikahan', 'Hari Ibu'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Mawar Kubah Kaca Preserved | Abadikala Fresh Flowers',
    'Mawar abadi di dalam kubah kaca romantis mulai Rp250.000 di Abadikala Fresh Flowers.'
  ),
  (
    '22222222-2222-4222-8222-222222222210', '11111111-1111-4111-8111-111111111106',
    'Gantungan Kunci Resin', 'gantungan-kunci-resin', 'ABK-PR-006', 'preserved',
    'Gantungan kunci resin bening buatan tangan berisi kelopak bunga asli yang dapat dibawa ke mana saja.',
    'Hadiah mungil yang personal dan terjangkau untuk sahabat, pelajar, mahasiswa, maupun suvenir acara. Setiap kepingan unik karena menggunakan kelopak bunga asli.',
    'Resin bening berkualitas, kelopak bunga asli terawetkan, aksen gold foil opsional, ring gantungan logam.',
    'Diameter/panjang ± 4–5 cm',
    'Hindari goresan benda tajam dan paparan panas ekstrem agar resin tetap jernih.',
    'Dikerjakan secara handmade sesuai antrean cetak resin',
    35000.00, 'pcs', 13000.00, FALSE, TRUE, 'Tulis pilihan inisial huruf atau nuansa warna kelopak (opsional)',
    ARRAY['Hadiah personal', 'Ulang tahun', 'Wisuda', 'Sidang'], TRUE, FALSE, FALSE, TRUE, TRUE,
    'Gantungan Kunci Resin Bunga Asli | Abadikala Fresh Flowers',
    'Gantungan kunci resin handmade berisi bunga asli mulai Rp35.000.'
  ),
  (
    '22222222-2222-4222-8222-222222222211', '11111111-1111-4111-8111-111111111106',
    'Pembatas Buku Bunga Pres', 'pembatas-buku-bunga-pres', 'ABK-PR-007', 'preserved',
    'Pembatas buku transparan dengan susunan bunga pres lembut untuk menemani setiap halaman bacaan.',
    'Menyimpan ketenangan kelopak bunga asli di sela buku kesayangan Anda. Sangat terjangkau, manis, dan ideal untuk hadiah kecil, pelajar, mahasiswa, maupun pelengkap kado.',
    'Laminasi bening/resin tipis, bunga pres asli, rumbai tassel lembut.',
    'Ukuran ± 14×4 cm',
    'Simpan rata di dalam buku dan hindari lipatan agar bentuk tetap rapi.',
    'Dikerjakan secara handmade dengan detail rapi',
    25000.00, 'pcs', 8000.00, FALSE, TRUE, 'Pilih nuansa warna bunga (lembut/pastel/natural) jika tersedia',
    ARRAY['Hadiah personal', 'Wisuda', 'Sidang', 'Ulang tahun'], TRUE, FALSE, FALSE, TRUE, TRUE,
    'Pembatas Buku Bunga Pres | Abadikala Fresh Flowers',
    'Pembatas buku bunga pres asli yang manis dan terjangkau mulai Rp25.000.'
  ),
  (
    '22222222-2222-4222-8222-222222222212', '11111111-1111-4111-8111-111111111107',
    'Jasa Pengawetan Buket', 'jasa-pengawetan-buket', 'ABK-PR-008', 'preserved',
    'Abadikan buket lamaran, pernikahan, atau wisuda Anda menjadi karya seni bunga awetan yang bermakna.',
    'Jangan biarkan buket dari momen terpenting dalam hidup Anda layu begitu saja. Tim Abadikala akan mengeringkan, mempres, dan menata ulang bunga dari buket Anda ke dalam bingkai atau karya kenangan yang abadi.',
    'Proses pengeringan & preservasi profesional menggunakan bunga asli dari buket pelanggan, media bingkai/display sesuai paket.',
    'Menyesuaikan ukuran bingkai & kondisi buket pelanggan',
    'Kirimkan buket secepat mungkin setelah acara (idealnya 1–2 hari) agar warna dan bentuk kelopak tetap optimal.',
    'Proses pengeringan & penataan membutuhkan waktu beberapa minggu (dikonfirmasi admin)',
    350000.00, 'layanan', 130000.00, FALSE, TRUE, 'Jelaskan jenis acara, tanggal acara, dan bentuk akhir yang diinginkan (bingkai/shadow-box)',
    ARRAY['Pernikahan', 'Lamaran', 'Wisuda', 'Anniversary'], TRUE, TRUE, TRUE, FALSE, TRUE,
    'Jasa Pengawetan Buket Pernikahan & Wisuda | Abadikala Fresh Flowers',
    'Layanan pengawetan buket bunga segar menjadi karya seni awetan mulai Rp350.000 di Abadikala Lhokseumawe.'
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Product Images
INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
  ('22222222-2222-4222-8222-222222222201', '/images/product-buket-kecil.jpg', 'Buket Kecil Plastik Bening Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222202', '/images/product-buket-korea.jpg', 'Buket Besar Gaya Korea Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222203', '/images/product-bunga-meja.jpg', 'Bunga Meja Langganan Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222204', '/images/product-flower-bar.jpg', 'Flower Bar Abadikala Fresh Flowers', TRUE, 1),
  ('22222222-2222-4222-8222-222222222205', '/images/product-buket-kering.jpg', 'Buket Bunga Kering Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222206', '/images/product-pressed-frame.jpg', 'Bingkai Pressed Flower Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222207', '/images/product-plakat-akrilik.jpg', 'Plakat Akrilik Bunga Pres Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222208', '/images/product-shadow-box.jpg', 'Shadow-Box Nama dan Gelar Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222209', '/images/product-mawar-kubah.jpg', 'Mawar Kubah Kaca Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222210', '/images/product-resin-craft.jpg', 'Gantungan Kunci Resin Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222211', '/images/product-resin-craft.jpg', 'Pembatas Buku Bunga Pres Abadikala', TRUE, 1),
  ('22222222-2222-4222-8222-222222222212', '/images/product-jasa-pengawetan.jpg', 'Jasa Pengawetan Buket Abadikala', TRUE, 1)
ON CONFLICT DO NOTHING;

-- 4. Inventory records (marked is_stock_configured = FALSE until admin inputs actual stock)
INSERT INTO public.inventory (item_type, product_id, unit, stock_quantity, low_stock_threshold, is_stock_configured, notes)
SELECT 'product', p.id, COALESCE(p.price_unit, 'pcs'), 0, 5, FALSE, 'Stok aktual belum dikonfigurasi admin (made-to-order aktif).'
FROM public.products p
WHERE NOT EXISTS (SELECT 1 FROM public.inventory i WHERE i.product_id = p.id);

-- 5. Default Shipping Methods (Realistic Lhokseumawe operational setup)
INSERT INTO public.shipping_methods (code, name, method_type, description, service_area, base_fee, estimated_duration, is_configured, is_active, sort_order) VALUES
  ('local_delivery', 'Kurir Toko Area Lhokseumawe', 'delivery', 'Pengantaran langsung oleh kurir khusus Abadikala menjaga rangkaian bunga segar tetap utuh dan sejuk sampai tujuan.', 'Kota Lhokseumawe (Banda Sakti, Muara Dua, Muara Satu, Blang Mangat)', 15000.00, '1–2 jam setelah selesai dirangkai', TRUE, TRUE, 1),
  ('store_pickup', 'Ambil di Studio (Pick-up)', 'pickup', 'Ambil langsung pesanan Anda di studio Abadikala Banda Sakti tanpa biaya ongkir sesuai jadwal.', 'Jl. Merdeka Barat No. 48, Simpang Empat, Banda Sakti, Lhokseumawe', 0.00, 'Setiap hari, 08.00–21.00 WIB', TRUE, TRUE, 2),
  ('outer_city_preserved', 'Ekspedisi Luar Kota (Khusus Lini Abadi)', 'delivery', 'Pengiriman aman kotak kraft khusus produk bunga awetan ke seluruh Aceh dan luar kota.', 'Seluruh Aceh & Nasional (Khusus Lini Abadi)', 25000.00, '2–4 hari kerja', TRUE, TRUE, 3)
ON CONFLICT (code) DO NOTHING;

-- 6. Homepage CMS Sections
INSERT INTO public.homepage_sections (section_key, title, subtitle, content, is_active, sort_order) VALUES
  ('announcement_bar', 'Abadikala Fresh Flowers — Lhokseumawe, Aceh', NULL, '{"text": "Segar Hari Ini, Abadi Selamanya • Pengiriman Area Lhokseumawe Rp15.000 & Gratis Pick-up di Studio Banda Sakti"}'::jsonb, TRUE, 1),
  ('hero', 'Setiap Bunga Punya Cerita.', 'Rayakan momen berharga dengan rangkaian bunga segar dan kenangan indah yang dapat diabadikan bersama Abadikala di Lhokseumawe, Aceh.', '{"primary_cta_label": "Belanja Sekarang", "primary_cta_url": "/shop", "secondary_cta_label": "Jelajahi Koleksi", "secondary_cta_url": "/koleksi/fresh", "image_url": "/images/hero-abadikala.jpg"}'::jsonb, TRUE, 2),
  ('brand_intro', 'Satu bunga, dua bentuk keindahan.', 'Makna Abadikala berasal dari "abadi" dan "kala"—waktu yang diabadikan. Kami percaya bunga bukan sekadar hadiah sesaat, tetapi cara lembut untuk menyampaikan rasa dan menyimpan kenangan.', '{"fresh_title": "Lini Segar", "fresh_desc": "Bunga segar pilihan untuk dinikmati keharumannya hari ini—hadir dengan tampilan elegan dan harga yang tetap bersahabat.", "preserved_title": "Lini Abadi", "preserved_desc": "Bunga awetan, pressed flower, hingga jasa pengawetan buket agar momen terindah Anda dapat terus disimpan."}'::jsonb, TRUE, 3),
  ('brand_story', 'Dari Segar Menjadi Abadi.', 'Setiap tangkai bunga memiliki nilai yang terlalu indah untuk berakhir begitu saja.', '{"paragraphs": ["Di Abadikala, kami merawat siklus keindahan bunga secara penuh makna. Bunga segar yang penuh keharuman hari ini—baik dari kurasi studio kami maupun buket berharga milik pelanggan—dapat diolah melalui proses pengeringan dan preservasi menjadi karya seni awetan.", "Melalui pendekatan ini, Anda tidak hanya menghadirkan kebahagiaan di hari perayaan, tetapi juga menyimpan wujud nyata kenangan tersebut untuk tahun-tahun mendatang."], "image_url": "/images/product-jasa-pengawetan.jpg"}'::jsonb, TRUE, 4),
  ('newsletter', 'Kabar Hangat dari Studio Abadikala', 'Daftarkan email Anda untuk informasi koleksi musiman, promo wisuda, dan tips merawat bunga.', '{"enabled": true}'::jsonb, TRUE, 5)
ON CONFLICT (section_key) DO NOTHING;

-- 7. Curated Initial Gallery
INSERT INTO public.galleries (title, caption, image_url, external_link, category_tag, is_active, sort_order) VALUES
  ('Rangkaian Editorial Abadikala', 'Harmoni mawar blush, ranunculus burgundy, dan eucalyptus segar.', '/images/hero-abadikala.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Segar', TRUE, 1),
  ('Buket Besar Gaya Korea', 'Lapisan kertas lembut dengan komposisi bunga segar melimpah.', '/images/product-buket-korea.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Segar', TRUE, 2),
  ('Bingkai Pressed Flower', 'Kelopak bunga asli yang dipres rapi dalam bingkai kayu & kaca.', '/images/product-pressed-frame.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 3),
  ('Mawar Kubah Kaca', 'Keindahan mawar awetan sebagai simbol kenangan abadi.', '/images/product-mawar-kubah.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 4),
  ('Shadow-Box Wisuda Personal', 'Mawar kering berdimensi 3D lengkap dengan nama dan gelar kelulusan.', '/images/product-shadow-box.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 5),
  ('Flower Bar Studio Banda Sakti', 'Pilih bungamu sendiri—mawar, krisan, aster, gerbera, dan baby breath segar.', '/images/product-flower-bar.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Segar', TRUE, 6),
  ('Suvenir Resin & Pembatas Buku', 'Kelopak bunga asli terawetkan dalam resin bening, kado manis untuk sahabat.', '/images/product-resin-craft.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 7),
  ('Meja Kerja Pengawetan Buket', 'Proses teliti mengubah buket hari spesial menjadi bingkai kenangan.', '/images/product-jasa-pengawetan.jpg', 'https://instagram.com/abadikalaflowers', 'Jasa Pengawetan', TRUE, 8)
ON CONFLICT DO NOTHING;

-- 7b. Seed Realistic Customer Testimonials (Editable via Admin CMS)
INSERT INTO public.testimonials (customer_name, occasion, rating, quote, is_published, sort_order) VALUES
  ('Cut Nadira Salsabila', 'Wisuda Universitas Malikussaleh', 5, 'Pesan Buket Besar Gaya Korea untuk wisuda adik saya. Bunganya segar banget, wrapping-nya rapi dan elegan, padahal harganya sangat bersahabat. Kartu ucapan tulisan tangannya juga manis sekali!', TRUE, 1),
  ('Teuku Farhan Pratama', 'Anniversary di Lhokseumawe', 5, 'Mawar Kubah Kaca dari Abadikala jadi hadiah paling berkesan untuk istri saya. Packing aman, pengantaran kurir studio tepat waktu ke rumah di Muara Dua, dan tampilannya benar-benar premium.', TRUE, 2),
  ('Raudhatul Jannah', 'Jasa Pengawetan Buket Pernikahan', 5, 'Senang sekali buket akad nikah saya tidak berakhir layu. Tim Abadikala mengolahnya menjadi bingkai shadow-box yang indah dan sekarang jadi pajangan favorit di ruang tamu kami.', TRUE, 3),
  ('Dinda Khairunnisa', 'Sidang Skripsi & Kado Sahabat', 5, 'Buket Kecil Plastik Bening Rp75.000 sudah terlihat sangat manis dan estetik untuk kado sidang teman kampus. Suka banget karena di Lhokseumawe akhirnya ada toko bunga segar yang rapi dan mudah dipesan online.', TRUE, 4)
ON CONFLICT DO NOTHING;

-- 8. Business Settings (Complete Realistic Lhokseumawe Florist Setup)
INSERT INTO public.business_settings (setting_key, setting_group, value, is_configured, is_public) VALUES
  ('brand_identity', 'general', '{"business_name": "Abadikala Fresh Flowers", "short_name": "Abadikala", "tagline": "Segar Hari Ini, Abadi Selamanya", "city": "Lhokseumawe, Aceh, Indonesia", "logo_url": ""}'::jsonb, TRUE, TRUE),
  ('contact_info', 'contact', '{"address": "Jl. Merdeka Barat No. 48, Simpang Empat, Kec. Banda Sakti, Kota Lhokseumawe, Aceh 24351", "whatsapp": "+62 822-7410-8820", "email": "halo@abadikalaflowers.id", "operational_hours": "Senin–Minggu, 08.00–21.00 WIB"}'::jsonb, TRUE, TRUE),
  ('social_links', 'social', '{"instagram": "https://instagram.com/abadikalaflowers", "tiktok": "https://tiktok.com/@abadikalaflowers", "facebook": "https://facebook.com/abadikalaflowers"}'::jsonb, TRUE, TRUE),
  ('delivery_policy', 'operations', '{"service_areas": "Kota Lhokseumawe (Banda Sakti, Muara Dua, Muara Satu, Blang Mangat) & ekspedisi seluruh Indonesia khusus Lini Abadi", "courier_info": "Kurir Toko Khusus Abadikala (Rp15.000) & Pick-up di Studio (Rp0)", "min_order_amount": 25000, "preorder_lead_time": "Minimal H-1 buket segar custom & H-3 produk personalisasi Lini Abadi (same-day sebelum pukul 14.00 WIB)", "processing_time": "Buket segar 1–3 jam • Lini Abadi 2–5 hari kerja • Jasa pengawetan 14–21 hari kerja", "pickup_available": true}'::jsonb, TRUE, TRUE),
  ('payment_config', 'payment', '{"manual_transfer_enabled": true, "payment_gateway_enabled": false, "bank_accounts": [{"bank_name": "Bank Syariah Indonesia (BSI)", "account_number": "7189 4025 18", "account_holder": "Abadikala Fresh Flowers (Yulistia Masruri Sitepu)"}, {"bank_name": "Bank Central Asia (BCA)", "account_number": "8240 5192 73", "account_holder": "Abadikala Fresh Flowers (Yulistia Masruri Sitepu)"}], "payment_instructions": "Lakukan transfer sesuai nominal total pesanan ke rekening resmi BSI atau BCA, lalu unggah bukti transfer melalui halaman konfirmasi pesanan. Verifikasi maksimal 1x30 menit pada jam operasional (08.00–21.00 WIB)."}'::jsonb, TRUE, TRUE),
  ('personalized_services', 'services', '{"handwritten_card": true, "custom_bouquet": true, "color_request": true, "bouquet_preservation": true, "gift_arrangement": true}'::jsonb, TRUE, TRUE),
  ('legal_drafts', 'legal', '{"is_final": true, "privacy_policy": "Abadikala Fresh Flowers melindungi seluruh data pribadi pelanggan (nama, email, WhatsApp, alamat pengiriman, serta isi kartu ucapan) dan hanya menggunakannya untuk pemrosesan pesanan serta layanan pelanggan.", "terms_conditions": "Setiap rangkaian bunga dirangkai segar saat dipesan. Ketersediaan jenis bunga musiman dapat menyesuaikan stok harian dengan nuansa warna dan kualitas setara melalui konfirmasi admin.", "shipping_policy": "Pengantaran Kurir Toko area Kota Lhokseumawe Rp15.000, Pick-up di Studio Banda Sakti Rp0, serta pengiriman luar kota khusus Lini Abadi Rp25.000 via ekspedisi aman kotak kraft.", "cancellation_policy": "Pembatalan sebelum pembayaran diverifikasi bebas biaya. Pesanan Lini Segar terbayar dapat dibatalkan maksimal H-1 sebelum dirangkai. Garansi penggantian berlaku maksimal 3 jam setelah paket diterima dengan bukti foto."}'::jsonb, TRUE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
