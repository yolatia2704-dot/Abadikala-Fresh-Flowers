import {
  SEED_BUSINESS_SETTINGS,
  SEED_CATEGORIES,
  SEED_GALLERY,
  SEED_HOMEPAGE_SECTIONS,
  SEED_PRODUCTS,
  SEED_SHIPPING_METHODS,
  SEED_TESTIMONIALS,
} from '@/constants/abadikala';
import type {
  Address,
  AdminProduct,
  AppRole,
  AuditLog,
  BusinessSettings,
  Category,
  ContactMessage,
  CustomOrder,
  GalleryItem,
  HomepageSection,
  InventoryMovement,
  InventoryRecord,
  Order,
  PublicProduct,
  Review,
  ShippingMethod,
  Testimonial,
  UserProfile,
} from '@/types/database';

const STORAGE_KEY = 'abadikala_preview_db_v2';

export interface LocalDatabaseState {
  categories: Category[];
  products: AdminProduct[];
  inventory: InventoryRecord[];
  inventory_movements: InventoryMovement[];
  orders: Order[];
  custom_orders: CustomOrder[];
  shipping_methods: ShippingMethod[];
  homepage_sections: HomepageSection[];
  galleries: GalleryItem[];
  testimonials: Testimonial[];
  reviews: Review[];
  business_settings: BusinessSettings;
  contact_messages: ContactMessage[];
  newsletter_subscribers: { id: string; email: string; created_at: string }[];
  users: (UserProfile & { password_hash?: string })[];
  addresses: Address[];
  audit_logs: AuditLog[];
}

function buildInitialInventory(products: AdminProduct[]): InventoryRecord[] {
  return products.map((p) => ({
    id: `inv-${p.id}`,
    item_type: 'product',
    product_id: p.id,
    product_name: p.name,
    variant_id: null,
    material_name: null,
    unit: p.price_unit || 'pcs',
    stock_quantity: p.stock_quantity,
    low_stock_threshold: 5,
    is_stock_configured: p.is_stock_configured,
    notes: 'Stok aktual belum dikonfigurasi admin (mode made-to-order aktif).',
    updated_at: new Date().toISOString(),
  }));
}

function createDefaultState(): LocalDatabaseState {
  return {
    categories: structuredClone(SEED_CATEGORIES),
    products: structuredClone(SEED_PRODUCTS),
    inventory: buildInitialInventory(SEED_PRODUCTS),
    inventory_movements: [],
    orders: [], // ZERO fake orders
    custom_orders: [],
    shipping_methods: structuredClone(SEED_SHIPPING_METHODS),
    homepage_sections: structuredClone(SEED_HOMEPAGE_SECTIONS),
    galleries: structuredClone(SEED_GALLERY),
    testimonials: structuredClone(SEED_TESTIMONIALS),
    reviews: [],
    business_settings: structuredClone(SEED_BUSINESS_SETTINGS),
    contact_messages: [],
    newsletter_subscribers: [],
    users: [],
    addresses: [],
    audit_logs: [],
  };
}

export function readLocalDb(): LocalDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as LocalDatabaseState;
  } catch {
    return createDefaultState();
  }
}

export function writeLocalDb(state: LocalDatabaseState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetLocalDb(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Strips all strictly internal fields (cost_price / HPP, is_archived) before exposing to customer UI.
 */
export function toPublicProduct(
  product: AdminProduct,
  categories: Category[],
  inventory: InventoryRecord[],
  reviews: Review[]
): PublicProduct {
  const cat = categories.find((c) => c.id === product.category_id);
  const inv = inventory.find((i) => i.item_type === 'product' && i.product_id === product.id);
  const publishedReviews = reviews.filter((r) => r.product_id === product.id && r.is_published);
  const avg =
    publishedReviews.length > 0
      ? Number(
          (
            publishedReviews.reduce((acc, r) => acc + r.rating, 0) / publishedReviews.length
          ).toFixed(1)
        )
      : null;

  const { cost_price: _cost, is_archived: _arch, ...publicFields } = product;
  void _cost;
  void _arch;

  return {
    ...publicFields,
    category_name: cat?.name || product.category_name,
    category_slug: cat?.slug || product.category_slug,
    stock_quantity: inv ? inv.stock_quantity : product.stock_quantity,
    is_stock_configured: inv ? inv.is_stock_configured : product.is_stock_configured,
    average_rating: avg,
    review_count: publishedReviews.length,
  };
}

export function appendAuditLog(
  db: LocalDatabaseState,
  actorEmail: string,
  actorRole: AppRole,
  action: string,
  entityType: string,
  entityId: string | null,
  summary: string
): void {
  db.audit_logs.unshift({
    id: crypto.randomUUID(),
    actor_email: actorEmail,
    actor_role: actorRole,
    action,
    entity_type: entityType,
    entity_id: entityId,
    summary,
    created_at: new Date().toISOString(),
  });
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ABK-${y}${m}${d}-${suffix}`;
}

export function generateCustomRequestNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CST-${y}${m}${d}-${suffix}`;
}
