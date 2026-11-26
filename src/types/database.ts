export type AppRole = 'super_admin' | 'admin' | 'staff' | 'customer';
export type ProductLine = 'fresh' | 'preserved';

export type OrderStatus =
  | 'awaiting_payment'
  | 'awaiting_verification'
  | 'payment_confirmed'
  | 'order_accepted'
  | 'processing'
  | 'arranging'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'confirmed'
  | 'rejected'
  | 'refunded';

export type CustomOrderStatus =
  | 'new'
  | 'under_review'
  | 'awaiting_quote'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected_or_cancelled';

export type InventoryItemType = 'product' | 'material';
export type InventoryMovementType =
  | 'initial'
  | 'restock'
  | 'order_deduction'
  | 'order_restoration'
  | 'adjustment'
  | 'spoilage';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
  avatar_url: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  district: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  product_line: ProductLine;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_delta: number;
  is_active: boolean;
  sort_order: number;
}

/**
 * PublicProduct strictly NEVER includes cost_price (HPP).
 * All customer-facing views and API responses use this type exclusively.
 */
export interface PublicProduct {
  id: string;
  category_id: string | null;
  category_name?: string;
  category_slug?: string;
  name: string;
  slug: string;
  sku: string | null;
  product_line: ProductLine;
  short_description: string | null;
  description: string | null;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
  processing_estimate: string | null;
  selling_price: number | null;
  compare_at_price: number | null;
  price_unit: string | null;
  is_price_on_request: boolean;
  is_customizable: boolean;
  customization_prompt: string | null;
  occasions: string[];
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  allow_backorder: boolean;
  seo_title: string | null;
  seo_description: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  stock_quantity: number;
  is_stock_configured: boolean;
  average_rating: number | null;
  review_count: number;
  created_at: string;
}

/**
 * AdminProduct extends PublicProduct with strictly internal business fields (cost_price / HPP, is_archived).
 */
export interface AdminProduct extends PublicProduct {
  cost_price: number | null;
  is_archived: boolean;
}

export interface InventoryRecord {
  id: string;
  item_type: InventoryItemType;
  product_id: string | null;
  product_name?: string;
  variant_id: string | null;
  material_name: string | null;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_stock_configured: boolean;
  notes: string | null;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  item_label?: string;
  movement_type: InventoryMovementType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_key: string | null;
  order_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  product: PublicProduct;
  variant_id: string | null;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  customization_notes: string | null;
}

export interface ShippingMethod {
  id: string;
  code: string;
  name: string;
  method_type: 'delivery' | 'pickup';
  description: string | null;
  service_area: string | null;
  base_fee: number | null;
  estimated_duration: string | null;
  is_configured: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  product_slug_snapshot: string | null;
  product_line_snapshot: ProductLine;
  variant_name_snapshot: string | null;
  image_url_snapshot: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  customization_notes: string | null;
  /** Strictly populated only inside Admin API calls */
  unit_cost_snapshot?: number | null;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  method_code: string;
  method_label: string;
  amount: number;
  status: PaymentStatus;
  proof_image_url: string | null;
  sender_name: string | null;
  sender_reference: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  custom_order_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string;
  customer_address: string | null;
  fulfillment_type: 'delivery' | 'pickup' | 'pending_confirmation';
  shipping_method_id: string | null;
  shipping_method_name: string | null;
  delivery_address: string | null;
  location_notes: string | null;
  requested_delivery_date: string | null;
  requested_delivery_time: string | null;
  tracking_number: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  greeting_card_type: string | null;
  greeting_card_message: string | null;
  special_notes: string | null;
  custom_instructions: string | null;
  subtotal: number;
  additional_fee: number;
  shipping_fee: number;
  discount_amount: number;
  coupon_code: string | null;
  total_amount: number;
  internal_notes: string | null;
  cancellation_reason: string | null;
  inventory_deducted: boolean;
  items: OrderItem[];
  history: OrderStatusHistoryItem[];
  payment: PaymentRecord | null;
  created_at: string;
  updated_at: string;
}

export interface CustomOrderAttachment {
  id: string;
  file_url: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
}

export interface CustomOrder {
  id: string;
  request_number: string;
  user_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  customer_email: string | null;
  product_type: string;
  occasion: string;
  needed_date: string;
  budget_min: number | null;
  budget_max: number | null;
  dominant_colors: string | null;
  preferred_flowers: string | null;
  size_preference: string | null;
  greeting_card_message: string | null;
  additional_notes: string | null;
  status: CustomOrderStatus;
  quoted_price: number | null;
  admin_quote_notes: string | null;
  linked_order_id: string | null;
  attachments: CustomOrderAttachment[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  created_at: string;
}

export interface HomepageSection {
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  external_link: string | null;
  category_tag: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  occasion: string | null;
  rating: number | null;
  quote: string;
  is_published: boolean;
  created_at: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
}

export interface BankAccountSetting {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface BusinessSettings {
  brand_identity: {
    business_name: string;
    short_name: string;
    tagline: string;
    city: string;
    logo_url: string;
  };
  contact_info: {
    is_configured: boolean;
    address: string;
    whatsapp: string;
    email: string;
    operational_hours: string;
  };
  social_links: {
    is_configured: boolean;
    instagram: string;
    tiktok: string;
    facebook: string;
  };
  delivery_policy: {
    is_configured: boolean;
    service_areas: string;
    courier_info: string;
    min_order_amount: number | null;
    preorder_lead_time: string;
    processing_time: string;
    pickup_available: boolean;
  };
  payment_config: {
    is_configured: boolean;
    manual_transfer_enabled: boolean;
    payment_gateway_enabled: boolean;
    bank_accounts: BankAccountSetting[];
    payment_instructions: string;
  };
  personalized_services: {
    handwritten_card: boolean;
    custom_bouquet: boolean;
    color_request: boolean;
    bouquet_preservation: boolean;
    gift_arrangement: boolean;
  };
  legal_drafts: {
    is_final: boolean;
    privacy_policy: string;
    terms_conditions: string;
    shipping_policy: string;
    cancellation_policy: string;
  };
  faqs: FaqItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_email: string;
  actor_role: AppRole;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
}
