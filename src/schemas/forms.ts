import { z } from 'zod';

const phoneRegex = /^[0-9+\-\s()]{9,20}$/;

export const loginSchema = z.object({
  email: z.string().email('Masukkan alamat email yang valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter.'),
    email: z.string().email('Masukkan alamat email yang valid.'),
    whatsapp_number: z.string().regex(phoneRegex, 'Masukkan nomor WhatsApp yang valid.'),
    password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
    confirm_password: z.string().min(6, 'Konfirmasi kata sandi wajib diisi.'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['confirm_password'],
  });

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Nama pelanggan wajib diisi.'),
  customer_whatsapp: z.string().regex(phoneRegex, 'Nomor WhatsApp tidak valid.'),
  customer_email: z.string().email('Email tidak valid.'),
  customer_address: z.string().min(5, 'Alamat pelanggan minimal 5 karakter.'),
  fulfillment_type: z.enum(['delivery', 'pickup', 'pending_confirmation']),
  shipping_method_id: z.string().optional().nullable(),
  delivery_address: z.string().optional(),
  location_notes: z.string().optional(),
  requested_delivery_date: z.string().min(1, 'Tanggal kebutuhan/pengiriman wajib dipilih.'),
  requested_delivery_time: z.string().optional(),
  recipient_name: z.string().optional(),
  recipient_phone: z.string().optional(),
  greeting_card_type: z.string().optional(),
  greeting_card_message: z.string().max(400, 'Pesan kartu ucapan maksimal 400 karakter.').optional(),
  special_notes: z.string().max(500).optional(),
  custom_instructions: z.string().max(500).optional(),
  payment_method_code: z.string().min(1, 'Pilih metode pembayaran.'),
  coupon_code: z.string().optional(),
});

export const customOrderSchema = z.object({
  customer_name: z.string().min(2, 'Nama lengkap wajib diisi.'),
  customer_whatsapp: z.string().regex(phoneRegex, 'Nomor WhatsApp tidak valid.'),
  customer_email: z.string().email('Email tidak valid.').optional().or(z.literal('')),
  product_type: z.string().min(2, 'Pilih jenis produk yang diinginkan.'),
  occasion: z.string().min(2, 'Pilih jenis acara.'),
  needed_date: z.string().min(1, 'Tanggal kebutuhan wajib diisi.'),
  budget_min: z.coerce.number().min(0, 'Budget tidak boleh negatif.').optional().or(z.literal('')),
  budget_max: z.coerce.number().min(0, 'Budget tidak boleh negatif.').optional().or(z.literal('')),
  dominant_colors: z.string().min(2, 'Sebutkan warna dominan yang diinginkan.'),
  preferred_flowers: z.string().optional(),
  size_preference: z.string().min(1, 'Pilih ukuran rangkaian.'),
  greeting_card_message: z.string().max(400).optional(),
  additional_notes: z.string().max(800).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter.'),
  email: z.string().email('Email tidak valid.'),
  whatsapp: z.string().optional(),
  subject: z.string().min(3, 'Subjek minimal 3 karakter.'),
  message: z.string().min(10, 'Pesan minimal 10 karakter.'),
});

export const addressSchema = z.object({
  label: z.string().min(2, 'Label alamat wajib diisi (misal: Rumah / Kantor).'),
  recipient_name: z.string().min(2, 'Nama penerima wajib diisi.'),
  phone: z.string().regex(phoneRegex, 'Nomor telepon tidak valid.'),
  street_address: z.string().min(5, 'Alamat jalan lengkap wajib diisi.'),
  district: z.string().optional(),
  city: z.string().min(2, 'Kota/Kabupaten wajib diisi.'),
  province: z.string().min(2, 'Provinsi wajib diisi.'),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  is_default: z.boolean().default(false),
});

export const productFormSchema = z.object({
  name: z.string().min(2, 'Nama produk wajib diisi.'),
  slug: z.string().min(2, 'Slug produk wajib diisi.'),
  sku: z.string().optional(),
  category_id: z.string().min(1, 'Pilih kategori produk.'),
  product_line: z.enum(['fresh', 'preserved']),
  short_description: z.string().min(5, 'Deskripsi singkat wajib diisi.'),
  description: z.string().min(10, 'Deskripsi lengkap minimal 10 karakter.'),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  care_instructions: z.string().optional(),
  processing_estimate: z.string().optional(),
  selling_price: z.union([z.coerce.number().min(0), z.literal(''), z.null()]).optional(),
  compare_at_price: z.union([z.coerce.number().min(0), z.literal(''), z.null()]).optional(),
  price_unit: z.string().default('item'),
  cost_price: z.union([z.coerce.number().min(0), z.literal(''), z.null()]).optional(),
  is_price_on_request: z.boolean().default(false),
  is_customizable: z.boolean().default(true),
  customization_prompt: z.string().optional(),
  occasions: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  allow_backorder: z.boolean().default(true),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  primary_image_url: z.string().min(1, 'URL gambar utama wajib diisi.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type CustomOrderFormValues = z.infer<typeof customOrderSchema>;
export type ContactFormValues = z.infer<typeof contactSchema>;
export type AddressFormValues = z.infer<typeof addressSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
