import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  appendAuditLog,
  generateCustomRequestNumber,
  generateOrderNumber,
  readLocalDb,
  toPublicProduct,
  writeLocalDb,
} from '@/services/localStore';
import type {
  Address,
  AdminProduct,
  AppRole,
  AuditLog,
  BusinessSettings,
  Category,
  ContactMessage,
  CustomOrder,
  CustomOrderStatus,
  GalleryItem,
  HomepageSection,
  InventoryMovement,
  InventoryMovementType,
  InventoryRecord,
  Order,
  OrderStatus,
  PaymentStatus,
  PublicProduct,
  Review,
  ShippingMethod,
  Testimonial,
  UserProfile,
} from '@/types/database';
import { sanitizeText } from '@/utils/format';

export interface ProductFilterParams {
  search?: string;
  line?: 'all' | 'fresh' | 'preserved';
  categorySlug?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc';
}

export interface CreateOrderPayload {
  user_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_address: string;
  fulfillment_type: 'delivery' | 'pickup' | 'pending_confirmation';
  shipping_method_id: string | null;
  delivery_address?: string;
  location_notes?: string;
  requested_delivery_date: string;
  requested_delivery_time?: string;
  recipient_name?: string;
  recipient_phone?: string;
  greeting_card_type?: string;
  greeting_card_message?: string;
  special_notes?: string;
  custom_instructions?: string;
  payment_method_code: string;
  payment_method_label: string;
  coupon_code?: string;
  items: {
    product_id: string;
    variant_id: string | null;
    quantity: number;
    customization_notes: string | null;
  }[];
}

export interface CreateCustomOrderPayload {
  user_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  customer_email?: string;
  product_type: string;
  occasion: string;
  needed_date: string;
  budget_min: number | null;
  budget_max: number | null;
  dominant_colors: string;
  preferred_flowers?: string;
  size_preference: string;
  greeting_card_message?: string;
  additional_notes?: string;
  attachments: { file_url: string; file_name: string; mime_type: string; file_size_bytes: number }[];
}

// ============================================================================
// PUBLIC CATALOG & CMS
// ============================================================================

export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (!includeInactive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Category[];
  }
  const db = readLocalDb();
  return db.categories
    .filter((c) => includeInactive || c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchPublicProducts(filters: ProductFilterParams = {}): Promise<PublicProduct[]> {
  let products: PublicProduct[] = [];

  if (isSupabaseConfigured && supabase) {
    // Queries ONLY products_public view — cost_price (HPP) is structurally impossible to read here
    const { data, error } = await supabase
      .from('products_public')
      .select('*, categories(name, slug), product_images(*), product_variants(*)');
    if (error) throw new Error(error.message);

    const { data: invData } = await supabase
      .from('inventory')
      .select('product_id, stock_quantity, is_stock_configured')
      .eq('item_type', 'product');

    const { data: revData } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .eq('is_published', true);

    products = (data || []).map((row) => {
      const inv = (invData || []).find((i) => i.product_id === row.id);
      const prodRevs = (revData || []).filter((r) => r.product_id === row.id);
      const avg =
        prodRevs.length > 0
          ? Number((prodRevs.reduce((s, r) => s + r.rating, 0) / prodRevs.length).toFixed(1))
          : null;
      return {
        ...row,
        category_name: row.categories?.name,
        category_slug: row.categories?.slug,
        images: (row.product_images || []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
        ),
        variants: (row.product_variants || []).filter((v: { is_active: boolean }) => v.is_active),
        stock_quantity: inv?.stock_quantity ?? 0,
        is_stock_configured: inv?.is_stock_configured ?? false,
        average_rating: avg,
        review_count: prodRevs.length,
      } as PublicProduct;
    });
  } else {
    const db = readLocalDb();
    products = db.products
      .filter((p) => p.is_active && !p.is_archived)
      .map((p) => toPublicProduct(p, db.categories, db.inventory, db.reviews));
  }

  // Filter & sort consistently
  let list = [...products];
  if (filters.line && filters.line !== 'all') {
    list = list.filter((p) => p.product_line === filters.line);
  }
  if (filters.categorySlug) {
    list = list.filter((p) => p.category_slug === filters.categorySlug);
  }
  if (filters.occasion) {
    const occ = filters.occasion.toLowerCase();
    list = list.filter((p) => p.occasions.some((o) => o.toLowerCase() === occ));
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.short_description || '').toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q) ||
        p.occasions.some((o) => o.toLowerCase().includes(q))
    );
  }
  if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
    list = list.filter((p) => p.selling_price !== null && p.selling_price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
    list = list.filter((p) => p.selling_price !== null && p.selling_price <= filters.maxPrice!);
  }

  switch (filters.sortBy) {
    case 'price_asc':
      list.sort((a, b) => (a.selling_price ?? Number.MAX_SAFE_INTEGER) - (b.selling_price ?? Number.MAX_SAFE_INTEGER));
      break;
    case 'price_desc':
      list.sort((a, b) => (b.selling_price ?? -1) - (a.selling_price ?? -1));
      break;
    case 'newest':
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'featured':
    default:
      list.sort((a, b) => Number(b.is_best_seller) - Number(a.is_best_seller) || Number(b.is_featured) - Number(a.is_featured));
      break;
  }

  return list;
}

export async function fetchPublicProductBySlug(slug: string): Promise<PublicProduct | null> {
  const all = await fetchPublicProducts();
  return all.find((p) => p.slug === slug) || null;
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', productId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      ...r,
      reviewer_name: r.profiles?.full_name || 'Pelanggan Abadikala',
    })) as Review[];
  }
  const db = readLocalDb();
  return db.reviews.filter((r) => r.product_id === productId && r.is_published);
}

export async function fetchHomepageSections(): Promise<HomepageSection[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as HomepageSection[];
  }
  return readLocalDb().homepage_sections.sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchGallery(includeInactive = false): Promise<GalleryItem[]> {
  if (isSupabaseConfigured && supabase) {
    let q = supabase.from('galleries').select('*').order('sort_order', { ascending: true });
    if (!includeInactive) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []) as GalleryItem[];
  }
  return readLocalDb()
    .galleries.filter((g) => includeInactive || g.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchTestimonials(includeUnpublished = false): Promise<Testimonial[]> {
  if (isSupabaseConfigured && supabase) {
    let q = supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (!includeUnpublished) q = q.eq('is_published', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []) as Testimonial[];
  }
  return readLocalDb().testimonials.filter((t) => includeUnpublished || t.is_published);
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('business_settings').select('*');
    if (error) throw new Error(error.message);
    const fallback = readLocalDb().business_settings;
    const map = new Map((data || []).map((row) => [row.setting_key, row]));
    const getVal = <K extends keyof BusinessSettings>(key: K): BusinessSettings[K] => {
      const found = map.get(key);
      if (!found) return fallback[key];
      if (typeof found.value === 'object' && found.value !== null && !Array.isArray(found.value)) {
        return { ...fallback[key], ...found.value, is_configured: found.is_configured } as BusinessSettings[K];
      }
      return found.value as BusinessSettings[K];
    };
    return {
      brand_identity: getVal('brand_identity'),
      contact_info: getVal('contact_info'),
      social_links: getVal('social_links'),
      delivery_policy: getVal('delivery_policy'),
      payment_config: getVal('payment_config'),
      personalized_services: getVal('personalized_services'),
      legal_drafts: getVal('legal_drafts'),
      faqs: getVal('faqs'),
    };
  }
  return readLocalDb().business_settings;
}

export async function fetchShippingMethods(includeUnconfigured = false): Promise<ShippingMethod[]> {
  if (isSupabaseConfigured && supabase) {
    let q = supabase.from('shipping_methods').select('*').order('sort_order', { ascending: true });
    if (!includeUnconfigured) q = q.eq('is_active', true).eq('is_configured', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []) as ShippingMethod[];
  }
  return readLocalDb().shipping_methods.filter(
    (m) => includeUnconfigured || (m.is_active && m.is_configured)
  );
}

// ============================================================================
// CHECKOUT, ORDERS & TRACKING
// ============================================================================

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('create_order_from_checkout', {
      p_customer_name: sanitizeText(payload.customer_name),
      p_customer_whatsapp: sanitizeText(payload.customer_whatsapp),
      p_customer_email: sanitizeText(payload.customer_email),
      p_customer_address: sanitizeText(payload.customer_address),
      p_fulfillment_type: payload.fulfillment_type,
      p_shipping_method_id: payload.shipping_method_id,
      p_delivery_address: payload.delivery_address ? sanitizeText(payload.delivery_address) : null,
      p_location_notes: payload.location_notes ? sanitizeText(payload.location_notes) : null,
      p_requested_delivery_date: payload.requested_delivery_date || null,
      p_requested_delivery_time: payload.requested_delivery_time || null,
      p_recipient_name: payload.recipient_name ? sanitizeText(payload.recipient_name) : null,
      p_recipient_phone: payload.recipient_phone ? sanitizeText(payload.recipient_phone) : null,
      p_greeting_card_type: payload.greeting_card_type || null,
      p_greeting_card_message: payload.greeting_card_message
        ? sanitizeText(payload.greeting_card_message)
        : null,
      p_special_notes: payload.special_notes ? sanitizeText(payload.special_notes) : null,
      p_custom_instructions: payload.custom_instructions
        ? sanitizeText(payload.custom_instructions)
        : null,
      p_payment_method_code: payload.payment_method_code,
      p_payment_method_label: payload.payment_method_label,
      p_coupon_code: payload.coupon_code || null,
      p_items: payload.items,
    });
    if (error) throw new Error(error.message);
    const createdId = data.order_id as string;
    const { data: orderData, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*), payments(*)')
      .eq('id', createdId)
      .single();
    if (fetchErr || !orderData) {
      return {
        id: createdId,
        order_number: data.order_number,
        user_id: payload.user_id,
        custom_order_id: null,
        status: 'awaiting_payment',
        payment_status: 'pending',
        customer_name: payload.customer_name,
        customer_whatsapp: payload.customer_whatsapp,
        customer_email: payload.customer_email,
        customer_address: payload.customer_address,
        fulfillment_type: payload.fulfillment_type,
        shipping_method_id: payload.shipping_method_id,
        shipping_method_name: null,
        delivery_address: payload.delivery_address || null,
        location_notes: payload.location_notes || null,
        requested_delivery_date: payload.requested_delivery_date,
        requested_delivery_time: payload.requested_delivery_time || null,
        tracking_number: null,
        recipient_name: payload.recipient_name || null,
        recipient_phone: payload.recipient_phone || null,
        greeting_card_type: payload.greeting_card_type || null,
        greeting_card_message: payload.greeting_card_message || null,
        special_notes: payload.special_notes || null,
        custom_instructions: payload.custom_instructions || null,
        subtotal: data.total_amount,
        additional_fee: 0,
        shipping_fee: 0,
        discount_amount: 0,
        coupon_code: payload.coupon_code || null,
        total_amount: data.total_amount,
        internal_notes: null,
        cancellation_reason: null,
        inventory_deducted: false,
        items: [],
        history: [
          {
            id: crypto.randomUUID(),
            order_id: createdId,
            status: 'awaiting_payment',
            note: 'Pesanan dibuat dan menunggu konfirmasi pembayaran.',
            created_at: new Date().toISOString(),
          },
        ],
        payment: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return {
      ...orderData,
      items: orderData.order_items || [],
      history: orderData.order_status_history || [],
      payment: orderData.payments?.[0] || null,
    } as Order;
  }

  // Local Preview Mode — strictly recalculates prices from stored products, never trusts client prices
  const db = readLocalDb();
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();

  let subtotal = 0;
  const orderItems = payload.items.map((item) => {
    const product = db.products.find((p) => p.id === item.product_id && p.is_active && !p.is_archived);
    if (!product) throw new Error('Produk tidak tersedia.');
    if (product.selling_price === null || product.is_price_on_request) {
      throw new Error(`Produk "${product.name}" memerlukan penawaran harga melalui Custom Order.`);
    }
    const variant = item.variant_id
      ? product.variants.find((v) => v.id === item.variant_id && v.is_active)
      : null;
    const unitPrice = product.selling_price + (variant?.price_delta || 0);
    const qty = Math.max(1, Math.floor(item.quantity));
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;

    const primaryImg = product.images.find((i) => i.is_primary)?.image_url || product.images[0]?.image_url || null;

    return {
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: product.id,
      variant_id: variant?.id || null,
      product_name_snapshot: product.name,
      product_slug_snapshot: product.slug,
      product_line_snapshot: product.product_line,
      variant_name_snapshot: variant?.name || null,
      image_url_snapshot: primaryImg,
      quantity: qty,
      unit_price: unitPrice,
      unit_cost_snapshot: product.cost_price,
      line_total: lineTotal,
      customization_notes: item.customization_notes ? sanitizeText(item.customization_notes) : null,
    };
  });

  const shippingMethod = payload.shipping_method_id
    ? db.shipping_methods.find((s) => s.id === payload.shipping_method_id && s.is_active && s.is_configured)
    : null;
  const shippingFee = shippingMethod?.base_fee ?? 0;
  const discountAmount = 0;
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: payload.user_id,
    custom_order_id: null,
    status: 'awaiting_payment',
    payment_status: 'pending',
    customer_name: sanitizeText(payload.customer_name),
    customer_whatsapp: sanitizeText(payload.customer_whatsapp),
    customer_email: sanitizeText(payload.customer_email),
    customer_address: sanitizeText(payload.customer_address),
    fulfillment_type: payload.fulfillment_type,
    shipping_method_id: shippingMethod?.id || null,
    shipping_method_name: shippingMethod?.name || 'Menunggu konfirmasi pengiriman',
    delivery_address: payload.delivery_address ? sanitizeText(payload.delivery_address) : null,
    location_notes: payload.location_notes ? sanitizeText(payload.location_notes) : null,
    requested_delivery_date: payload.requested_delivery_date,
    requested_delivery_time: payload.requested_delivery_time || null,
    tracking_number: null,
    recipient_name: payload.recipient_name ? sanitizeText(payload.recipient_name) : null,
    recipient_phone: payload.recipient_phone ? sanitizeText(payload.recipient_phone) : null,
    greeting_card_type: payload.greeting_card_type || null,
    greeting_card_message: payload.greeting_card_message ? sanitizeText(payload.greeting_card_message) : null,
    special_notes: payload.special_notes ? sanitizeText(payload.special_notes) : null,
    custom_instructions: payload.custom_instructions ? sanitizeText(payload.custom_instructions) : null,
    subtotal,
    additional_fee: 0,
    shipping_fee: shippingFee,
    discount_amount: discountAmount,
    coupon_code: payload.coupon_code || null,
    total_amount: totalAmount,
    internal_notes: null,
    cancellation_reason: null,
    inventory_deducted: false,
    items: orderItems,
    history: [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        status: 'awaiting_payment',
        note: 'Pesanan dibuat dan menunggu konfirmasi pembayaran.',
        created_at: now,
      },
    ],
    payment: {
      id: crypto.randomUUID(),
      order_id: orderId,
      method_code: payload.payment_method_code,
      method_label: payload.payment_method_label,
      amount: totalAmount,
      status: 'pending',
      proof_image_url: null,
      sender_name: null,
      sender_reference: null,
      verified_at: null,
      rejection_reason: null,
      created_at: now,
    },
    created_at: now,
    updated_at: now,
  };

  db.orders.unshift(newOrder);
  writeLocalDb(db);
  return stripOrderItemCosts(newOrder);
}

function stripOrderItemCosts(order: Order): Order {
  return {
    ...order,
    internal_notes: null,
    items: order.items.map(({ unit_cost_snapshot: _c, ...rest }) => {
      void _c;
      return rest;
    }),
  };
}

export async function submitPaymentProof(
  orderNumber: string,
  senderName: string,
  senderReference: string,
  proofDataUrl: string | null
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { data: ord, error: oErr } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single();
    if (oErr || !ord) throw new Error('Pesanan tidak ditemukan.');
    // Notice: customer only submits proof; status moves to awaiting_verification, NEVER confirmed.
    await supabase
      .from('payments')
      .update({
        sender_name: sanitizeText(senderName),
        sender_reference: sanitizeText(senderReference),
        proof_image_url: proofDataUrl,
        status: 'awaiting_verification',
      })
      .eq('order_id', ord.id);
    return;
  }

  const db = readLocalDb();
  const order = db.orders.find((o) => o.order_number === orderNumber);
  if (!order) throw new Error('Pesanan tidak ditemukan.');
  if (order.payment) {
    order.payment.sender_name = sanitizeText(senderName);
    order.payment.sender_reference = sanitizeText(senderReference);
    order.payment.proof_image_url = proofDataUrl;
    order.payment.status = 'awaiting_verification';
  }
  order.payment_status = 'awaiting_verification';
  order.status = 'awaiting_verification';
  order.history.push({
    id: crypto.randomUUID(),
    order_id: order.id,
    status: 'awaiting_verification',
    note: `Bukti pembayaran dikirim oleh ${sanitizeText(senderName)} — menunggu verifikasi admin.`,
    created_at: new Date().toISOString(),
  });
  order.updated_at = new Date().toISOString();
  writeLocalDb(db);
}

export async function trackOrderPublic(orderNumber: string, verification: string): Promise<Order | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc('track_order_public', {
      p_order_number: orderNumber.trim(),
      p_verification: verification.trim(),
    });
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.order_number,
      order_number: data.order_number,
      user_id: null,
      custom_order_id: null,
      status: data.status,
      payment_status: data.payment_status,
      customer_name: data.customer_name,
      customer_whatsapp: '',
      customer_email: '',
      customer_address: null,
      fulfillment_type: data.fulfillment_type,
      shipping_method_id: null,
      shipping_method_name: null,
      delivery_address: null,
      location_notes: null,
      requested_delivery_date: data.requested_delivery_date,
      requested_delivery_time: null,
      tracking_number: data.tracking_number,
      recipient_name: null,
      recipient_phone: null,
      greeting_card_type: null,
      greeting_card_message: null,
      special_notes: null,
      custom_instructions: null,
      subtotal: Number(data.subtotal),
      additional_fee: 0,
      shipping_fee: Number(data.shipping_fee),
      discount_amount: Number(data.discount_amount),
      coupon_code: null,
      total_amount: Number(data.total_amount),
      internal_notes: null,
      cancellation_reason: null,
      inventory_deducted: false,
      items: (data.items || []).map((i: Record<string, unknown>) => ({
        id: String(i.id),
        order_id: data.order_number,
        product_id: null,
        variant_id: null,
        product_name_snapshot: String(i.product_name),
        product_slug_snapshot: null,
        product_line_snapshot: 'fresh',
        variant_name_snapshot: i.variant_name ? String(i.variant_name) : null,
        image_url_snapshot: i.image_url ? String(i.image_url) : null,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        line_total: Number(i.line_total),
        customization_notes: null,
      })),
      history: data.history || [],
      payment: null,
      created_at: data.created_at,
      updated_at: data.created_at,
    };
  }

  const db = readLocalDb();
  const cleanContact = verification.trim().toLowerCase();
  const cleanDigits = verification.replace(/[^0-9]/g, '');
  const found = db.orders.find(
    (o) =>
      o.order_number.toUpperCase() === orderNumber.trim().toUpperCase() &&
      (o.customer_email.toLowerCase() === cleanContact ||
        (cleanDigits.length >= 6 && o.customer_whatsapp.replace(/[^0-9]/g, '') === cleanDigits))
  );
  return found ? stripOrderItemCosts(found) : null;
}

export async function fetchCustomerOrders(userId: string): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(id, order_id, product_id, variant_id, product_name_snapshot, product_slug_snapshot, product_line_snapshot, variant_name_snapshot, image_url_snapshot, quantity, unit_price, line_total, customization_notes), order_status_history(*), payments(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      ...row,
      internal_notes: null,
      items: row.order_items || [],
      history: row.order_status_history || [],
      payment: row.payments?.[0] || null,
    })) as Order[];
  }
  return readLocalDb()
    .orders.filter((o) => o.user_id === userId)
    .map(stripOrderItemCosts);
}

// ============================================================================
// CUSTOM ORDERS, CONTACT & NEWSLETTER
// ============================================================================

export async function createCustomOrder(payload: CreateCustomOrderPayload): Promise<CustomOrder> {
  const requestNumber = generateCustomRequestNumber();
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('custom_orders')
      .insert({
        request_number: requestNumber,
        user_id: payload.user_id,
        customer_name: sanitizeText(payload.customer_name),
        customer_whatsapp: sanitizeText(payload.customer_whatsapp),
        customer_email: payload.customer_email ? sanitizeText(payload.customer_email) : null,
        product_type: sanitizeText(payload.product_type),
        occasion: sanitizeText(payload.occasion),
        needed_date: payload.needed_date,
        budget_min: payload.budget_min,
        budget_max: payload.budget_max,
        dominant_colors: sanitizeText(payload.dominant_colors),
        preferred_flowers: payload.preferred_flowers ? sanitizeText(payload.preferred_flowers) : null,
        size_preference: payload.size_preference,
        greeting_card_message: payload.greeting_card_message
          ? sanitizeText(payload.greeting_card_message)
          : null,
        additional_notes: payload.additional_notes ? sanitizeText(payload.additional_notes) : null,
        status: 'new',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (payload.attachments.length > 0) {
      await supabase.from('custom_order_attachments').insert(
        payload.attachments.map((a) => ({
          custom_order_id: data.id,
          ...a,
        }))
      );
    }

    return { ...data, attachments: payload.attachments.map((a) => ({ id: crypto.randomUUID(), ...a })) } as CustomOrder;
  }

  const db = readLocalDb();
  const created: CustomOrder = {
    id: crypto.randomUUID(),
    request_number: requestNumber,
    user_id: payload.user_id,
    customer_name: sanitizeText(payload.customer_name),
    customer_whatsapp: sanitizeText(payload.customer_whatsapp),
    customer_email: payload.customer_email ? sanitizeText(payload.customer_email) : null,
    product_type: sanitizeText(payload.product_type),
    occasion: sanitizeText(payload.occasion),
    needed_date: payload.needed_date,
    budget_min: payload.budget_min,
    budget_max: payload.budget_max,
    dominant_colors: sanitizeText(payload.dominant_colors),
    preferred_flowers: payload.preferred_flowers ? sanitizeText(payload.preferred_flowers) : null,
    size_preference: payload.size_preference,
    greeting_card_message: payload.greeting_card_message ? sanitizeText(payload.greeting_card_message) : null,
    additional_notes: payload.additional_notes ? sanitizeText(payload.additional_notes) : null,
    status: 'new',
    quoted_price: null,
    admin_quote_notes: null,
    linked_order_id: null,
    attachments: payload.attachments.map((a) => ({ id: crypto.randomUUID(), ...a })),
    created_at: now,
    updated_at: now,
  };
  db.custom_orders.unshift(created);
  writeLocalDb(db);
  return created;
}

export async function submitContactMessage(payload: {
  name: string;
  email: string;
  whatsapp?: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('contact_messages').insert({
      name: sanitizeText(payload.name),
      email: sanitizeText(payload.email),
      whatsapp: payload.whatsapp ? sanitizeText(payload.whatsapp) : null,
      subject: sanitizeText(payload.subject),
      message: sanitizeText(payload.message),
    });
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  db.contact_messages.unshift({
    id: crypto.randomUUID(),
    name: sanitizeText(payload.name),
    email: sanitizeText(payload.email),
    whatsapp: payload.whatsapp ? sanitizeText(payload.whatsapp) : null,
    subject: sanitizeText(payload.subject),
    message: sanitizeText(payload.message),
    status: 'unread',
    created_at: new Date().toISOString(),
  });
  writeLocalDb(db);
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: cleanEmail, is_active: true }, { onConflict: 'email' });
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  if (!db.newsletter_subscribers.some((s) => s.email === cleanEmail)) {
    db.newsletter_subscribers.unshift({
      id: crypto.randomUUID(),
      email: cleanEmail,
      created_at: new Date().toISOString(),
    });
    writeLocalDb(db);
  }
}

// ============================================================================
// CUSTOMER ADDRESSES
// ============================================================================

export async function fetchUserAddresses(userId: string): Promise<Address[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Address[];
  }
  return readLocalDb().addresses.filter((a) => a.user_id === userId);
}

export async function saveUserAddress(
  userId: string,
  payload: Omit<Address, 'id' | 'user_id' | 'created_at'>
): Promise<Address> {
  if (isSupabaseConfigured && supabase) {
    if (payload.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
    }
    const { data, error } = await supabase
      .from('addresses')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Address;
  }
  const db = readLocalDb();
  if (payload.is_default) {
    db.addresses.forEach((a) => {
      if (a.user_id === userId) a.is_default = false;
    });
  }
  const created: Address = {
    ...payload,
    id: crypto.randomUUID(),
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  db.addresses.unshift(created);
  writeLocalDb(db);
  return created;
}

export async function deleteUserAddress(addressId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('addresses').delete().eq('id', addressId);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  db.addresses = db.addresses.filter((a) => a.id !== addressId);
  writeLocalDb(db);
}

// ============================================================================
// ADMIN APIs (Strictly protected by RLS in Supabase & Role Guard in App)
// ============================================================================

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug), product_images(*), product_variants(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const { data: invData } = await supabase.from('inventory').select('*').eq('item_type', 'product');
    return (data || []).map((row) => {
      const inv = (invData || []).find((i) => i.product_id === row.id);
      return {
        ...row,
        category_name: row.categories?.name,
        category_slug: row.categories?.slug,
        images: row.product_images || [],
        variants: row.product_variants || [],
        stock_quantity: inv?.stock_quantity ?? 0,
        is_stock_configured: inv?.is_stock_configured ?? false,
        average_rating: null,
        review_count: 0,
      } as AdminProduct;
    });
  }
  const db = readLocalDb();
  return db.products.map((p) => {
    const cat = db.categories.find((c) => c.id === p.category_id);
    const inv = db.inventory.find((i) => i.item_type === 'product' && i.product_id === p.id);
    return {
      ...p,
      category_name: cat?.name || p.category_name,
      category_slug: cat?.slug || p.category_slug,
      stock_quantity: inv?.stock_quantity ?? p.stock_quantity,
      is_stock_configured: inv?.is_stock_configured ?? p.is_stock_configured,
    };
  });
}

export async function upsertAdminProduct(
  product: Partial<AdminProduct> & { primary_image_url?: string },
  actor: { email: string; role: AppRole }
): Promise<AdminProduct> {
  if (isSupabaseConfigured && supabase) {
    const { primary_image_url, images: _imgs, variants: _vars, category_name: _cn, category_slug: _cs, stock_quantity: _sq, is_stock_configured: _isc, average_rating: _ar, review_count: _rc, ...dbFields } = product;
    void _imgs; void _vars; void _cn; void _cs; void _sq; void _isc; void _ar; void _rc;

    if (product.id) {
      const { data, error } = await supabase
        .from('products')
        .update(dbFields)
        .eq('id', product.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (primary_image_url) {
        await supabase.from('product_images').delete().eq('product_id', product.id).eq('is_primary', true);
        await supabase.from('product_images').insert({
          product_id: product.id,
          image_url: primary_image_url,
          alt_text: data.name,
          is_primary: true,
          sort_order: 1,
        });
      }
      return data as AdminProduct;
    } else {
      const { data, error } = await supabase.from('products').insert(dbFields).select().single();
      if (error) throw new Error(error.message);
      if (primary_image_url) {
        await supabase.from('product_images').insert({
          product_id: data.id,
          image_url: primary_image_url,
          alt_text: data.name,
          is_primary: true,
          sort_order: 1,
        });
      }
      await supabase.from('inventory').insert({
        item_type: 'product',
        product_id: data.id,
        unit: data.price_unit || 'pcs',
        stock_quantity: 0,
        low_stock_threshold: 5,
        is_stock_configured: false,
      });
      return data as AdminProduct;
    }
  }

  const db = readLocalDb();
  const now = new Date().toISOString();
  const cat = db.categories.find((c) => c.id === product.category_id);

  if (product.id) {
    const idx = db.products.findIndex((p) => p.id === product.id);
    if (idx === -1) throw new Error('Produk tidak ditemukan.');
    const existing = db.products[idx];
    const updated: AdminProduct = {
      ...existing,
      ...product,
      category_name: cat?.name || existing.category_name,
      category_slug: cat?.slug || existing.category_slug,
      images: product.primary_image_url
        ? [
            {
              id: existing.images[0]?.id || crypto.randomUUID(),
              product_id: existing.id,
              image_url: product.primary_image_url,
              alt_text: product.name || existing.name,
              is_primary: true,
              sort_order: 1,
            },
            ...existing.images.slice(1),
          ]
        : existing.images,
    };
    db.products[idx] = updated;
    appendAuditLog(db, actor.email, actor.role, 'product.updated', 'products', updated.id, `Memperbarui produk ${updated.name}`);
    writeLocalDb(db);
    return updated;
  }

  const newId = crypto.randomUUID();
  const created: AdminProduct = {
    id: newId,
    category_id: product.category_id || null,
    category_name: cat?.name,
    category_slug: cat?.slug,
    name: product.name || 'Produk Baru',
    slug: product.slug || `produk-${Date.now()}`,
    sku: product.sku || null,
    product_line: product.product_line || 'fresh',
    short_description: product.short_description || null,
    description: product.description || null,
    materials: product.materials || null,
    dimensions: product.dimensions || null,
    care_instructions: product.care_instructions || null,
    processing_estimate: product.processing_estimate || null,
    selling_price: product.selling_price ?? null,
    compare_at_price: product.compare_at_price ?? null,
    price_unit: product.price_unit || 'item',
    cost_price: product.cost_price ?? null,
    is_price_on_request: Boolean(product.is_price_on_request),
    is_customizable: product.is_customizable ?? true,
    customization_prompt: product.customization_prompt || null,
    occasions: product.occasions || [],
    is_active: product.is_active ?? true,
    is_archived: false,
    is_featured: Boolean(product.is_featured),
    is_best_seller: Boolean(product.is_best_seller),
    is_new_arrival: Boolean(product.is_new_arrival),
    allow_backorder: product.allow_backorder ?? true,
    seo_title: product.seo_title || null,
    seo_description: product.seo_description || null,
    images: [
      {
        id: crypto.randomUUID(),
        product_id: newId,
        image_url: product.primary_image_url || '/images/hero-abadikala.jpg',
        alt_text: product.name || 'Produk Abadikala',
        is_primary: true,
        sort_order: 1,
      },
    ],
    variants: [],
    stock_quantity: 0,
    is_stock_configured: false,
    average_rating: null,
    review_count: 0,
    created_at: now,
  };
  db.products.unshift(created);
  db.inventory.unshift({
    id: `inv-${newId}`,
    item_type: 'product',
    product_id: newId,
    product_name: created.name,
    variant_id: null,
    material_name: null,
    unit: created.price_unit || 'pcs',
    stock_quantity: 0,
    low_stock_threshold: 5,
    is_stock_configured: false,
    notes: 'Stok awal produk baru',
    updated_at: now,
  });
  appendAuditLog(db, actor.email, actor.role, 'product.created', 'products', newId, `Menambahkan produk ${created.name}`);
  writeLocalDb(db);
  return created;
}

export async function archiveOrDeleteProduct(
  productId: string,
  actor: { email: string; role: AppRole }
): Promise<'archived' | 'deleted'> {
  if (isSupabaseConfigured && supabase) {
    const { count } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);
    if ((count || 0) > 0) {
      await supabase.from('products').update({ is_archived: true, is_active: false }).eq('id', productId);
      return 'archived';
    }
    await supabase.from('products').delete().eq('id', productId);
    return 'deleted';
  }
  const db = readLocalDb();
  const hasOrders = db.orders.some((o) => o.items.some((i) => i.product_id === productId));
  const prod = db.products.find((p) => p.id === productId);
  if (hasOrders) {
    if (prod) {
      prod.is_archived = true;
      prod.is_active = false;
      appendAuditLog(db, actor.email, actor.role, 'product.archived', 'products', productId, `Mengarsipkan produk ${prod.name} (memiliki riwayat transaksi)`);
    }
    writeLocalDb(db);
    return 'archived';
  }
  db.products = db.products.filter((p) => p.id !== productId);
  db.inventory = db.inventory.filter((i) => i.product_id !== productId);
  appendAuditLog(db, actor.email, actor.role, 'product.deleted', 'products', productId, `Menghapus produk ${prod?.name || productId}`);
  writeLocalDb(db);
  return 'deleted';
}

export async function upsertCategory(
  category: Partial<Category>,
  actor: { email: string; role: AppRole }
): Promise<Category> {
  if (isSupabaseConfigured && supabase) {
    if (category.id) {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', category.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Category;
    }
    const { data, error } = await supabase.from('categories').insert(category).select().single();
    if (error) throw new Error(error.message);
    return data as Category;
  }
  const db = readLocalDb();
  if (category.id) {
    const idx = db.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      db.categories[idx] = { ...db.categories[idx], ...category };
      appendAuditLog(db, actor.email, actor.role, 'category.updated', 'categories', category.id, `Memperbarui kategori ${db.categories[idx].name}`);
      writeLocalDb(db);
      return db.categories[idx];
    }
  }
  const created: Category = {
    id: crypto.randomUUID(),
    name: category.name || 'Kategori Baru',
    slug: category.slug || `kategori-${Date.now()}`,
    product_line: category.product_line || 'fresh',
    description: category.description || null,
    image_url: category.image_url || '/images/hero-abadikala.jpg',
    sort_order: category.sort_order ?? db.categories.length + 1,
    is_active: category.is_active ?? true,
  };
  db.categories.push(created);
  appendAuditLog(db, actor.email, actor.role, 'category.created', 'categories', created.id, `Menambahkan kategori ${created.name}`);
  writeLocalDb(db);
  return created;
}

export async function deleteCategory(id: string, actor: { email: string; role: AppRole }): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  const target = db.categories.find((c) => c.id === id);
  db.categories = db.categories.filter((c) => c.id !== id);
  appendAuditLog(db, actor.email, actor.role, 'category.deleted', 'categories', id, `Menghapus kategori ${target?.name || id}`);
  writeLocalDb(db);
}

// ============================================================================
// ADMIN ORDERS, INVENTORY, CUSTOM ORDERS, CUSTOMERS, CMS, SETTINGS
// ============================================================================

export async function fetchAdminOrders(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*), payments(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      ...row,
      items: row.order_items || [],
      history: (row.order_status_history || []).sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      payment: row.payments?.[0] || null,
    })) as Order[];
  }
  return readLocalDb().orders;
}

export async function adminUpdateOrder(
  orderId: string,
  updates: {
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    note?: string;
    internal_notes?: string;
    tracking_number?: string;
    deduct_stock?: boolean;
  },
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    if (updates.status) {
      const { error } = await supabase.rpc('admin_update_order_status', {
        p_order_id: orderId,
        p_new_status: updates.status,
        p_note: updates.note || null,
        p_deduct_stock: Boolean(updates.deduct_stock),
      });
      if (error) throw new Error(error.message);
    }
    const patch: Record<string, unknown> = {};
    if (updates.payment_status) patch.payment_status = updates.payment_status;
    if (updates.internal_notes !== undefined) patch.internal_notes = updates.internal_notes;
    if (updates.tracking_number !== undefined) patch.tracking_number = updates.tracking_number;
    if (Object.keys(patch).length > 0) {
      await supabase.from('orders').update(patch).eq('id', orderId);
    }
    if (updates.payment_status) {
      await supabase
        .from('payments')
        .update({
          status: updates.payment_status,
          verified_at: updates.payment_status === 'confirmed' ? new Date().toISOString() : null,
        })
        .eq('order_id', orderId);
    }
    return;
  }

  const db = readLocalDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Pesanan tidak ditemukan.');
  const now = new Date().toISOString();

  if (updates.status && updates.status !== order.status) {
    order.status = updates.status;
    if (updates.status === 'cancelled' && updates.note) {
      order.cancellation_reason = updates.note;
    }
    order.history.push({
      id: crypto.randomUUID(),
      order_id: order.id,
      status: updates.status,
      note: updates.note || `Status diperbarui oleh ${actor.email}`,
      created_at: now,
    });
    appendAuditLog(
      db,
      actor.email,
      actor.role,
      'order.status_updated',
      'orders',
      order.id,
      `Order ${order.order_number} -> ${updates.status}`
    );
  }

  if (updates.payment_status && updates.payment_status !== order.payment_status) {
    order.payment_status = updates.payment_status;
    if (order.payment) {
      order.payment.status = updates.payment_status;
      if (updates.payment_status === 'confirmed') {
        order.payment.verified_at = now;
      }
    }
    appendAuditLog(
      db,
      actor.email,
      actor.role,
      'payment.status_updated',
      'payments',
      order.id,
      `Pembayaran ${order.order_number} -> ${updates.payment_status}`
    );
  }

  if (updates.internal_notes !== undefined) order.internal_notes = updates.internal_notes;
  if (updates.tracking_number !== undefined) order.tracking_number = updates.tracking_number;

  // Idempotent stock deduction — NEVER deducts twice for the same order
  if (updates.deduct_stock && !order.inventory_deducted) {
    for (const item of order.items) {
      if (!item.product_id) continue;
      const inv = db.inventory.find((i) => i.item_type === 'product' && i.product_id === item.product_id);
      const refKey = `order_deduct:${order.id}:${item.id}`;
      const alreadyLogged = db.inventory_movements.some((m) => m.reference_key === refKey);
      if (inv && inv.is_stock_configured && !alreadyLogged) {
        const before = inv.stock_quantity;
        const after = Math.max(0, before - item.quantity);
        inv.stock_quantity = after;
        inv.updated_at = now;
        db.inventory_movements.unshift({
          id: crypto.randomUUID(),
          inventory_id: inv.id,
          item_label: inv.product_name || item.product_name_snapshot,
          movement_type: 'order_deduction',
          quantity_change: -item.quantity,
          quantity_before: before,
          quantity_after: after,
          reference_key: refKey,
          order_id: order.id,
          notes: `Pengurangan otomatis order ${order.order_number}`,
          created_at: now,
        });
      }
    }
    order.inventory_deducted = true;
  }

  order.updated_at = now;
  writeLocalDb(db);
}

export async function fetchInventory(): Promise<{
  items: InventoryRecord[];
  movements: InventoryMovement[];
}> {
  if (isSupabaseConfigured && supabase) {
    const { data: items, error: iErr } = await supabase
      .from('inventory')
      .select('*, products(name)')
      .order('updated_at', { ascending: false });
    if (iErr) throw new Error(iErr.message);
    const { data: movements, error: mErr } = await supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (mErr) throw new Error(mErr.message);
    return {
      items: (items || []).map((i) => ({ ...i, product_name: i.products?.name })) as InventoryRecord[],
      movements: (movements || []) as InventoryMovement[],
    };
  }
  const db = readLocalDb();
  return { items: db.inventory, movements: db.inventory_movements };
}

export async function adjustInventory(
  inventoryId: string,
  delta: number,
  movementType: InventoryMovementType,
  notes: string,
  lowStockThreshold: number | undefined,
  actor: { email: string; role: AppRole }
): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { data: inv, error } = await supabase.from('inventory').select('*').eq('id', inventoryId).single();
    if (error || !inv) throw new Error('Data stok tidak ditemukan.');
    const nextQty = Math.max(0, inv.stock_quantity + delta);
    await supabase
      .from('inventory')
      .update({
        stock_quantity: nextQty,
        is_stock_configured: true,
        low_stock_threshold: lowStockThreshold ?? inv.low_stock_threshold,
      })
      .eq('id', inventoryId);
    await supabase.from('inventory_movements').insert({
      inventory_id: inventoryId,
      movement_type: movementType,
      quantity_change: delta,
      quantity_before: inv.stock_quantity,
      quantity_after: nextQty,
      notes,
    });
    return;
  }

  const db = readLocalDb();
  const inv = db.inventory.find((i) => i.id === inventoryId);
  if (!inv) throw new Error('Data stok tidak ditemukan.');
  const before = inv.stock_quantity;
  const after = Math.max(0, before + delta);
  inv.stock_quantity = after;
  inv.is_stock_configured = true;
  if (typeof lowStockThreshold === 'number') inv.low_stock_threshold = lowStockThreshold;
  inv.updated_at = now;
  db.inventory_movements.unshift({
    id: crypto.randomUUID(),
    inventory_id: inv.id,
    item_label: inv.item_type === 'material' ? inv.material_name || 'Bahan' : inv.product_name || 'Produk',
    movement_type: movementType,
    quantity_change: delta,
    quantity_before: before,
    quantity_after: after,
    reference_key: null,
    order_id: null,
    notes,
    created_at: now,
  });
  appendAuditLog(
    db,
    actor.email,
    actor.role,
    'inventory.adjusted',
    'inventory',
    inv.id,
    `Penyesuaian stok ${inv.product_name || inv.material_name}: ${before} -> ${after}`
  );
  writeLocalDb(db);
}

export async function addRawMaterialInventory(
  materialName: string,
  unit: string,
  initialQty: number,
  threshold: number,
  actor: { email: string; role: AppRole }
): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        item_type: 'material',
        material_name: sanitizeText(materialName),
        unit: sanitizeText(unit),
        stock_quantity: Math.max(0, initialQty),
        low_stock_threshold: Math.max(0, threshold),
        is_stock_configured: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from('inventory_movements').insert({
      inventory_id: data.id,
      movement_type: 'initial',
      quantity_change: initialQty,
      quantity_before: 0,
      quantity_after: initialQty,
      notes: 'Stok bahan baku awal',
    });
    return;
  }
  const db = readLocalDb();
  const id = crypto.randomUUID();
  db.inventory.unshift({
    id,
    item_type: 'material',
    product_id: null,
    variant_id: null,
    material_name: sanitizeText(materialName),
    unit: sanitizeText(unit),
    stock_quantity: Math.max(0, initialQty),
    low_stock_threshold: Math.max(0, threshold),
    is_stock_configured: true,
    notes: 'Bahan baku florist',
    updated_at: now,
  });
  db.inventory_movements.unshift({
    id: crypto.randomUUID(),
    inventory_id: id,
    item_label: sanitizeText(materialName),
    movement_type: 'initial',
    quantity_change: initialQty,
    quantity_before: 0,
    quantity_after: initialQty,
    reference_key: null,
    order_id: null,
    notes: 'Penambahan bahan baku baru',
    created_at: now,
  });
  appendAuditLog(db, actor.email, actor.role, 'inventory.material_added', 'inventory', id, `Menambahkan bahan baku ${materialName}`);
  writeLocalDb(db);
}

export async function fetchAdminCustomOrders(): Promise<CustomOrder[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('custom_orders')
      .select('*, custom_order_attachments(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      ...row,
      attachments: row.custom_order_attachments || [],
    })) as CustomOrder[];
  }
  return readLocalDb().custom_orders;
}

export async function adminUpdateCustomOrder(
  id: string,
  updates: { status?: CustomOrderStatus; quoted_price?: number | null; admin_quote_notes?: string },
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('custom_orders').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  const target = db.custom_orders.find((c) => c.id === id);
  if (!target) throw new Error('Custom order tidak ditemukan.');
  if (updates.status) target.status = updates.status;
  if (updates.quoted_price !== undefined) target.quoted_price = updates.quoted_price;
  if (updates.admin_quote_notes !== undefined) target.admin_quote_notes = updates.admin_quote_notes;
  target.updated_at = new Date().toISOString();
  appendAuditLog(
    db,
    actor.email,
    actor.role,
    'custom_order.updated',
    'custom_orders',
    id,
    `Custom order ${target.request_number} diperbarui (${target.status})`
  );
  writeLocalDb(db);
}

export async function convertCustomOrderToOrder(
  customOrderId: string,
  actor: { email: string; role: AppRole }
): Promise<Order> {
  const db = readLocalDb();
  const co = db.custom_orders.find((c) => c.id === customOrderId);
  if (!co) throw new Error('Custom order tidak ditemukan.');
  if (co.status !== 'approved' || !co.quoted_price) {
    throw new Error('Custom order hanya dapat dikonversi ke pesanan setelah harga disetujui pelanggan.');
  }
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  const order: Order = {
    id: orderId,
    order_number: orderNumber,
    user_id: co.user_id,
    custom_order_id: co.id,
    status: 'awaiting_payment',
    payment_status: 'pending',
    customer_name: co.customer_name,
    customer_whatsapp: co.customer_whatsapp,
    customer_email: co.customer_email || 'belum-diisi@abadikala.local',
    customer_address: null,
    fulfillment_type: 'pending_confirmation',
    shipping_method_id: null,
    shipping_method_name: 'Menunggu konfirmasi pengiriman',
    delivery_address: null,
    location_notes: null,
    requested_delivery_date: co.needed_date,
    requested_delivery_time: null,
    tracking_number: null,
    recipient_name: co.customer_name,
    recipient_phone: co.customer_whatsapp,
    greeting_card_type: co.greeting_card_message ? 'Kartu Tulisan Tangan' : null,
    greeting_card_message: co.greeting_card_message,
    special_notes: co.additional_notes,
    custom_instructions: `${co.product_type} • ${co.occasion} • Warna: ${co.dominant_colors || '-'}`,
    subtotal: co.quoted_price,
    additional_fee: 0,
    shipping_fee: 0,
    discount_amount: 0,
    coupon_code: null,
    total_amount: co.quoted_price,
    internal_notes: `Dikonversi dari Custom Request ${co.request_number}`,
    cancellation_reason: null,
    inventory_deducted: false,
    items: [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: null,
        variant_id: null,
        product_name_snapshot: `Custom: ${co.product_type} (${co.request_number})`,
        product_slug_snapshot: null,
        product_line_snapshot: co.product_type.toLowerCase().includes('awet') ? 'preserved' : 'fresh',
        variant_name_snapshot: co.size_preference,
        image_url_snapshot: co.attachments[0]?.file_url || '/images/hero-abadikala.jpg',
        quantity: 1,
        unit_price: co.quoted_price,
        unit_cost_snapshot: null,
        line_total: co.quoted_price,
        customization_notes: co.admin_quote_notes,
      },
    ],
    history: [
      {
        id: crypto.randomUUID(),
        order_id: orderId,
        status: 'awaiting_payment',
        note: `Pesanan dibuat dari Custom Request ${co.request_number} setelah persetujuan harga.`,
        created_at: now,
      },
    ],
    payment: {
      id: crypto.randomUUID(),
      order_id: orderId,
      method_code: 'manual_transfer',
      method_label: 'Transfer Manual (Konfirmasi Admin)',
      amount: co.quoted_price,
      status: 'pending',
      proof_image_url: null,
      sender_name: null,
      sender_reference: null,
      verified_at: null,
      rejection_reason: null,
      created_at: now,
    },
    created_at: now,
    updated_at: now,
  };
  co.linked_order_id = orderId;
  co.status = 'in_progress';
  db.orders.unshift(order);
  appendAuditLog(
    db,
    actor.email,
    actor.role,
    'custom_order.converted',
    'orders',
    orderId,
    `Konversi ${co.request_number} menjadi pesanan ${orderNumber}`
  );
  writeLocalDb(db);
  return order;
}

export async function updateHomepageSection(
  sectionKey: string,
  patch: Partial<HomepageSection>,
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('homepage_sections')
      .update(patch)
      .eq('section_key', sectionKey);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  const idx = db.homepage_sections.findIndex((s) => s.section_key === sectionKey);
  if (idx >= 0) {
    db.homepage_sections[idx] = { ...db.homepage_sections[idx], ...patch };
    appendAuditLog(db, actor.email, actor.role, 'cms.section_updated', 'homepage_sections', sectionKey, `Memperbarui konten section ${sectionKey}`);
    writeLocalDb(db);
  }
}

export async function saveBusinessSettings(
  settings: BusinessSettings,
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const entries: { setting_key: string; setting_group: string; value: unknown; is_configured: boolean }[] = [
      { setting_key: 'brand_identity', setting_group: 'general', value: settings.brand_identity, is_configured: true },
      { setting_key: 'contact_info', setting_group: 'contact', value: settings.contact_info, is_configured: settings.contact_info.is_configured },
      { setting_key: 'social_links', setting_group: 'social', value: settings.social_links, is_configured: settings.social_links.is_configured },
      { setting_key: 'delivery_policy', setting_group: 'operations', value: settings.delivery_policy, is_configured: settings.delivery_policy.is_configured },
      { setting_key: 'payment_config', setting_group: 'payment', value: settings.payment_config, is_configured: settings.payment_config.is_configured },
      { setting_key: 'personalized_services', setting_group: 'services', value: settings.personalized_services, is_configured: true },
      { setting_key: 'legal_drafts', setting_group: 'legal', value: settings.legal_drafts, is_configured: settings.legal_drafts.is_final },
      { setting_key: 'faqs', setting_group: 'cms', value: settings.faqs, is_configured: true },
    ];
    for (const entry of entries) {
      await supabase.from('business_settings').upsert(entry, { onConflict: 'setting_key' });
    }
    return;
  }
  const db = readLocalDb();
  db.business_settings = settings;
  appendAuditLog(db, actor.email, actor.role, 'settings.updated', 'business_settings', null, 'Memperbarui pengaturan bisnis Abadikala');
  writeLocalDb(db);
}

export async function saveShippingMethod(
  method: ShippingMethod,
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('shipping_methods').upsert(method);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  const idx = db.shipping_methods.findIndex((m) => m.id === method.id);
  if (idx >= 0) db.shipping_methods[idx] = method;
  else db.shipping_methods.push(method);
  appendAuditLog(db, actor.email, actor.role, 'shipping.updated', 'shipping_methods', method.id, `Memperbarui metode pengiriman ${method.name}`);
  writeLocalDb(db);
}

export async function saveGalleryItems(
  items: GalleryItem[],
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    for (const item of items) {
      await supabase.from('galleries').upsert(item);
    }
    return;
  }
  const db = readLocalDb();
  db.galleries = items;
  appendAuditLog(db, actor.email, actor.role, 'cms.gallery_updated', 'galleries', null, 'Memperbarui galeri visual Abadikala');
  writeLocalDb(db);
}

export async function saveTestimonial(
  item: Omit<Testimonial, 'id' | 'created_at'>,
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('testimonials').insert(item);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  db.testimonials.unshift({
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  });
  appendAuditLog(db, actor.email, actor.role, 'cms.testimonial_added', 'testimonials', null, `Menambahkan testimoni terverifikasi dari ${item.customer_name}`);
  writeLocalDb(db);
}

export async function fetchAdminCustomers(): Promise<
  (UserProfile & { order_count: number; total_spent: number })[]
> {
  if (isSupabaseConfigured && supabase) {
    const { data: profiles } = await supabase.from('profiles').select('*, user_roles(role)');
    const { data: orders } = await supabase.from('orders').select('user_id, total_amount, status, payment_status');
    return (profiles || []).map((p) => {
      const custOrders = (orders || []).filter((o) => o.user_id === p.id && o.status !== 'cancelled');
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        whatsapp_number: p.whatsapp_number,
        avatar_url: p.avatar_url,
        role: p.user_roles?.[0]?.role || 'customer',
        is_active: p.is_active,
        created_at: p.created_at,
        order_count: custOrders.length,
        total_spent: custOrders
          .filter((o) => o.payment_status === 'confirmed')
          .reduce((s, o) => s + Number(o.total_amount), 0),
      };
    });
  }
  const db = readLocalDb();
  const map = new Map<string, UserProfile & { order_count: number; total_spent: number }>();

  for (const u of db.users) {
    map.set(u.email.toLowerCase(), {
      ...u,
      order_count: 0,
      total_spent: 0,
    });
  }
  for (const o of db.orders) {
    const key = o.customer_email.toLowerCase();
    const existing = map.get(key) || {
      id: o.user_id || `guest-${key}`,
      full_name: o.customer_name,
      email: o.customer_email,
      whatsapp_number: o.customer_whatsapp,
      avatar_url: null,
      role: 'customer' as AppRole,
      is_active: true,
      created_at: o.created_at,
      order_count: 0,
      total_spent: 0,
    };
    if (o.status !== 'cancelled') {
      existing.order_count += 1;
      if (o.payment_status === 'confirmed') {
        existing.total_spent += o.total_amount;
      }
    }
    map.set(key, existing);
  }
  return Array.from(map.values());
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as ContactMessage[];
  }
  return readLocalDb().contact_messages;
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessage['status'],
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  const msg = db.contact_messages.find((m) => m.id === id);
  if (msg) {
    msg.status = status;
    appendAuditLog(
      db,
      actor.email,
      actor.role,
      'contact_message.updated',
      'contact_messages',
      id,
      `Status pesan dari ${msg.name} diubah ke ${status}`
    );
    writeLocalDb(db);
  }
}

export async function deleteTestimonial(
  id: string,
  actor: { email: string; role: AppRole }
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const db = readLocalDb();
  db.testimonials = db.testimonials.filter((t) => t.id !== id);
  appendAuditLog(db, actor.email, actor.role, 'cms.testimonial_deleted', 'testimonials', id, 'Menghapus testimoni');
  writeLocalDb(db);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data || []).map((row) => ({
      id: row.id,
      actor_email: row.profiles?.email || 'system',
      actor_role: row.actor_role || 'admin',
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      summary: `${row.action} (${row.entity_type})`,
      created_at: row.created_at,
    }));
  }
  return readLocalDb().audit_logs;
}
