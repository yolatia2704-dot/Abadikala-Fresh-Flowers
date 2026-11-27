-- ==============================================================================
-- ABADIKALA FRESH FLOWERS — COMPLETE ONE-CLICK SUPABASE SETUP SQL (UTF-8)
-- Copy & paste entire file into Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- ==============================================================================
-- Abadikala Fresh Flowers — Migration 001: Core Relational Schema (30 Tables)
-- Idempotent where possible. Uses UUID PKs and NUMERIC(12,2) for all money values.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- Enum Types
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'staff', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_line AS ENUM ('fresh', 'preserved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'awaiting_payment',
    'awaiting_verification',
    'payment_confirmed',
    'order_accepted',
    'processing',
    'arranging',
    'ready_for_delivery',
    'out_for_delivery',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'awaiting_verification',
    'confirmed',
    'rejected',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.custom_order_status AS ENUM (
    'new',
    'under_review',
    'awaiting_quote',
    'awaiting_customer_approval',
    'approved',
    'in_progress',
    'completed',
    'rejected_or_cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inventory_item_type AS ENUM ('product', 'material');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inventory_movement_type AS ENUM (
    'initial',
    'restock',
    'order_deduction',
    'order_restoration',
    'adjustment',
    'spoilage'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------------------
-- Updated At Trigger Function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  whatsapp_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. user_roles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'customer',
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ------------------------------------------------------------------------------
-- 3. addresses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Utama',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  district TEXT,
  city TEXT NOT NULL DEFAULT 'Lhokseumawe',
  province TEXT NOT NULL DEFAULT 'Aceh',
  postal_code TEXT,
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  product_line public.product_line NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. products
-- Note: cost_price (HPP) is strictly internal and protected via RLS & column grants.
-- selling_price is nullable for service items whose price is not fixed (e.g., Flower Bar).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  product_line public.product_line NOT NULL,
  short_description TEXT,
  description TEXT,
  materials TEXT,
  dimensions TEXT,
  care_instructions TEXT,
  processing_estimate TEXT,
  selling_price NUMERIC(12,2) CHECK (selling_price IS NULL OR selling_price >= 0),
  compare_at_price NUMERIC(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  price_unit TEXT DEFAULT 'item',
  cost_price NUMERIC(12,2) CHECK (cost_price IS NULL OR cost_price >= 0),
  is_price_on_request BOOLEAN NOT NULL DEFAULT FALSE,
  is_customizable BOOLEAN NOT NULL DEFAULT TRUE,
  customization_prompt TEXT,
  occasions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  allow_backorder BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. product_images
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. product_variants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price_delta NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. inventory (supports both finished products and raw florist materials)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type public.inventory_item_type NOT NULL DEFAULT 'product',
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  material_name TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_stock_configured BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. inventory_movements (reference_key prevents duplicate order deductions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type public.inventory_movement_type NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_key TEXT UNIQUE,
  order_id UUID,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. carts & 11. cart_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  customization_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. wishlists & 13. wishlist_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wishlist_id, product_id)
);

-- ------------------------------------------------------------------------------
-- 18. shipping_methods (created before orders for FK)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('delivery', 'pickup')),
  description TEXT,
  service_area TEXT,
  base_fee NUMERIC(12,2) CHECK (base_fee IS NULL OR base_fee >= 0),
  estimated_duration TEXT,
  is_configured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 21. coupons (created before orders for FK)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(12,2),
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. orders
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  custom_order_id UUID,
  status public.order_status NOT NULL DEFAULT 'awaiting_payment',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  -- Customer snapshot
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT,
  -- Fulfillment & delivery
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup', 'pending_confirmation')),
  shipping_method_id UUID REFERENCES public.shipping_methods(id) ON DELETE SET NULL,
  shipping_method_name TEXT,
  delivery_address TEXT,
  location_notes TEXT,
  requested_delivery_date DATE,
  requested_delivery_time TEXT,
  tracking_number TEXT,
  -- Gift details
  recipient_name TEXT,
  recipient_phone TEXT,
  greeting_card_type TEXT,
  greeting_card_message TEXT,
  special_notes TEXT,
  custom_instructions TEXT,
  -- Financial breakdown (NUMERIC, never floating point)
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  additional_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (additional_fee >= 0),
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  -- Admin metadata
  internal_notes TEXT,
  cancellation_reason TEXT,
  inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. order_items (snapshots product & pricing so edits never mutate order history)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  product_slug_snapshot TEXT,
  product_line_snapshot public.product_line NOT NULL,
  variant_name_snapshot TEXT,
  image_url_snapshot TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost_snapshot NUMERIC(12,2) CHECK (unit_cost_snapshot IS NULL OR unit_cost_snapshot >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  customization_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. order_status_history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 17. payments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method_code TEXT NOT NULL,
  method_label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status public.payment_status NOT NULL DEFAULT 'pending',
  proof_image_url TEXT,
  sender_name TEXT,
  sender_reference TEXT,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 19. custom_orders & 20. custom_order_attachments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_email TEXT,
  product_type TEXT NOT NULL,
  occasion TEXT NOT NULL,
  needed_date DATE NOT NULL,
  budget_min NUMERIC(12,2) CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max NUMERIC(12,2) CHECK (budget_max IS NULL OR budget_max >= 0),
  dominant_colors TEXT,
  preferred_flowers TEXT,
  size_preference TEXT,
  greeting_card_message TEXT,
  additional_notes TEXT,
  status public.custom_order_status NOT NULL DEFAULT 'new',
  quoted_price NUMERIC(12,2) CHECK (quoted_price IS NULL OR quoted_price >= 0),
  admin_quote_notes TEXT,
  customer_approved_at TIMESTAMPTZ,
  linked_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_order_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 22. reviews (real verified customer reviews only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 23. banners
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_label TEXT,
  cta_url TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 24. homepage_sections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 25. galleries
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT,
  image_url TEXT NOT NULL,
  external_link TEXT,
  category_tag TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 26. testimonials (only real admin-verified testimonials, starts empty)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  occasion TEXT,
  rating SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  quote TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 27. business_settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_group TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_configured BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 28. contact_messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 29. newsletter_subscribers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 30. audit_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role public.app_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Indexes for Performance
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_line_active ON public.products(product_line, is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id, is_published);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- Attach updated_at Triggers
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'user_roles', 'addresses', 'categories', 'products',
    'product_variants', 'inventory', 'carts', 'cart_items', 'wishlists',
    'shipping_methods', 'coupons', 'orders', 'payments', 'custom_orders',
    'reviews', 'banners', 'homepage_sections', 'galleries', 'testimonials',
    'business_settings', 'contact_messages'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ==============================================================================
-- Abadikala Fresh Flowers — Migration 002: Row Level Security, Safe Views & Storage
-- Enforces RBAC, customer privacy, and strict HPP (cost_price) isolation.
-- ==============================================================================

-- Role Helper Functions (SECURITY DEFINER to safely read user_roles under RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = uid LIMIT 1),
    'customer'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role IN ('super_admin', 'admin', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_role(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role IN ('super_admin', 'admin')
  );
$$;

-- ------------------------------------------------------------------------------
-- Public Catalog View — Explicitly EXCLUDES cost_price (HPP)
-- Customers and guests query ONLY this view, never raw products.cost_price.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.products_public
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.category_id,
  p.name,
  p.slug,
  p.sku,
  p.product_line,
  p.short_description,
  p.description,
  p.materials,
  p.dimensions,
  p.care_instructions,
  p.processing_estimate,
  p.selling_price,
  p.compare_at_price,
  p.price_unit,
  p.is_price_on_request,
  p.is_customizable,
  p.customization_prompt,
  p.occasions,
  p.is_active,
  p.is_featured,
  p.is_best_seller,
  p.is_new_arrival,
  p.allow_backorder,
  p.seo_title,
  p.seo_description,
  p.created_at,
  p.updated_at
FROM public.products p
WHERE p.is_active = TRUE AND p.is_archived = FALSE;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- Extra column-level protection: prevent non-admin direct selection of internal HPP columns
REVOKE SELECT (unit_cost_snapshot) ON public.order_items FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- Enable RLS on ALL 30 Tables
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'user_roles', 'addresses', 'categories', 'products',
    'product_images', 'product_variants', 'inventory', 'inventory_movements',
    'carts', 'cart_items', 'wishlists', 'wishlist_items', 'orders',
    'order_items', 'order_status_history', 'payments', 'shipping_methods',
    'custom_orders', 'custom_order_attachments', 'coupons', 'reviews',
    'banners', 'homepage_sections', 'galleries', 'testimonials',
    'business_settings', 'contact_messages', 'newsletter_subscribers', 'audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own_or_manager" ON public.profiles;
CREATE POLICY "profiles_update_own_or_manager" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_manager_role(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 2. user_roles (Only super_admin / admin can mutate; user can read own role)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "user_roles_manage_super_admin" ON public.user_roles;
CREATE POLICY "user_roles_manage_super_admin" ON public.user_roles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

-- ------------------------------------------------------------------------------
-- 3. addresses
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "addresses_own_crud" ON public.addresses;
CREATE POLICY "addresses_own_crud" ON public.addresses
  FOR ALL USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. categories
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 5. products (Raw table with cost_price is ADMIN ONLY; public reads products_public view)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "products_admin_only_select" ON public.products;
CREATE POLICY "products_admin_only_select" ON public.products
  FOR SELECT USING (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 6 & 7. product_images & product_variants
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "product_images_public_read" ON public.product_images;
CREATE POLICY "product_images_public_read" ON public.product_images
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "product_images_admin_write" ON public.product_images;
CREATE POLICY "product_images_admin_write" ON public.product_images
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "product_variants_public_read" ON public.product_variants;
CREATE POLICY "product_variants_public_read" ON public.product_variants
  FOR SELECT USING (is_active = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "product_variants_admin_write" ON public.product_variants;
CREATE POLICY "product_variants_admin_write" ON public.product_variants
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 8 & 9. inventory & inventory_movements
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "inventory_public_read_products" ON public.inventory;
CREATE POLICY "inventory_public_read_products" ON public.inventory
  FOR SELECT USING (item_type = 'product' OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "inventory_admin_write" ON public.inventory;
CREATE POLICY "inventory_admin_write" ON public.inventory
  FOR ALL USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "inventory_movements_admin_only" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_only" ON public.inventory_movements
  FOR ALL USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 10-13. carts, cart_items, wishlists, wishlist_items
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "carts_own" ON public.carts;
CREATE POLICY "carts_own" ON public.carts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_items_own" ON public.cart_items;
CREATE POLICY "cart_items_own" ON public.cart_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wishlists_own" ON public.wishlists;
CREATE POLICY "wishlists_own" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_items_own" ON public.wishlist_items;
CREATE POLICY "wishlist_items_own" ON public.wishlist_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.user_id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 14-17. orders, order_items, order_status_history, payments
-- Customers can only READ their own orders & upload payment proof; NEVER mutate status/prices.
-- Order creation happens through create_order_from_checkout RPC.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update" ON public.orders
  FOR UPDATE USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_admin_role(auth.uid())))
  );

DROP POLICY IF EXISTS "order_status_history_select_own_or_admin" ON public.order_status_history;
CREATE POLICY "order_status_history_select_own_or_admin" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_admin_role(auth.uid())))
  );

DROP POLICY IF EXISTS "order_status_history_admin_insert" ON public.order_status_history;
CREATE POLICY "order_status_history_admin_insert" ON public.order_status_history
  FOR INSERT WITH CHECK (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payments;
CREATE POLICY "payments_select_own_or_admin" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_admin_role(auth.uid())))
  );

DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_admin_update" ON public.payments
  FOR UPDATE USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 18. shipping_methods & 21. coupons
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "shipping_methods_read" ON public.shipping_methods;
CREATE POLICY "shipping_methods_read" ON public.shipping_methods
  FOR SELECT USING ((is_active = TRUE AND is_configured = TRUE) OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "shipping_methods_admin_write" ON public.shipping_methods;
CREATE POLICY "shipping_methods_admin_write" ON public.shipping_methods
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "coupons_public_read_active" ON public.coupons;
CREATE POLICY "coupons_public_read_active" ON public.coupons
  FOR SELECT USING (is_active = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "coupons_admin_write" ON public.coupons;
CREATE POLICY "coupons_admin_write" ON public.coupons
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 19 & 20. custom_orders & custom_order_attachments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "custom_orders_insert_public" ON public.custom_orders;
CREATE POLICY "custom_orders_insert_public" ON public.custom_orders
  FOR INSERT WITH CHECK (
    status = 'new' AND quoted_price IS NULL
  );

DROP POLICY IF EXISTS "custom_orders_select_own_or_admin" ON public.custom_orders;
CREATE POLICY "custom_orders_select_own_or_admin" ON public.custom_orders
  FOR SELECT USING (auth.uid() = user_id OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "custom_orders_admin_update" ON public.custom_orders;
CREATE POLICY "custom_orders_admin_update" ON public.custom_orders
  FOR UPDATE USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "custom_order_attachments_insert" ON public.custom_order_attachments;
CREATE POLICY "custom_order_attachments_insert" ON public.custom_order_attachments
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "custom_order_attachments_select" ON public.custom_order_attachments;
CREATE POLICY "custom_order_attachments_select" ON public.custom_order_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.custom_orders co WHERE co.id = custom_order_id AND (co.user_id = auth.uid() OR public.has_admin_role(auth.uid())))
  );

-- ------------------------------------------------------------------------------
-- 22. reviews
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (is_published = TRUE OR auth.uid() = user_id OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "reviews_customer_insert" ON public.reviews;
CREATE POLICY "reviews_customer_insert" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_published = FALSE);

DROP POLICY IF EXISTS "reviews_admin_manage" ON public.reviews;
CREATE POLICY "reviews_admin_manage" ON public.reviews
  FOR UPDATE USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 23-27. CMS & Business Settings (Public reads active/public rows; Admin edits)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "banners_public_read" ON public.banners;
CREATE POLICY "banners_public_read" ON public.banners
  FOR SELECT USING (is_active = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "banners_admin_write" ON public.banners;
CREATE POLICY "banners_admin_write" ON public.banners
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "homepage_sections_public_read" ON public.homepage_sections;
CREATE POLICY "homepage_sections_public_read" ON public.homepage_sections
  FOR SELECT USING (is_active = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "homepage_sections_admin_write" ON public.homepage_sections;
CREATE POLICY "homepage_sections_admin_write" ON public.homepage_sections
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "galleries_public_read" ON public.galleries;
CREATE POLICY "galleries_public_read" ON public.galleries
  FOR SELECT USING (is_active = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "galleries_admin_write" ON public.galleries;
CREATE POLICY "galleries_admin_write" ON public.galleries
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "testimonials_public_read" ON public.testimonials;
CREATE POLICY "testimonials_public_read" ON public.testimonials
  FOR SELECT USING (is_published = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "testimonials_admin_write" ON public.testimonials;
CREATE POLICY "testimonials_admin_write" ON public.testimonials
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "business_settings_public_read" ON public.business_settings;
CREATE POLICY "business_settings_public_read" ON public.business_settings
  FOR SELECT USING (is_public = TRUE OR public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "business_settings_admin_write" ON public.business_settings;
CREATE POLICY "business_settings_admin_write" ON public.business_settings
  FOR ALL USING (public.is_manager_role(auth.uid()))
  WITH CHECK (public.is_manager_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- 28-30. contact_messages, newsletter_subscribers, audit_logs
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_public_insert" ON public.contact_messages
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "contact_messages_admin_manage" ON public.contact_messages;
CREATE POLICY "contact_messages_admin_manage" ON public.contact_messages
  FOR ALL USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "newsletter_admin_read" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_read" ON public.newsletter_subscribers
  FOR SELECT USING (public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT USING (public.is_manager_role(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (public.has_admin_role(auth.uid()));

-- ------------------------------------------------------------------------------
-- Storage Buckets (Supabase Storage)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('site-assets', 'site-assets', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('custom-order-references', 'custom-order-references', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('product-images', 'site-assets'));

DROP POLICY IF EXISTS "admin_manage_public_buckets" ON storage.objects;
CREATE POLICY "admin_manage_public_buckets" ON storage.objects
  FOR ALL USING (bucket_id IN ('product-images', 'site-assets') AND public.has_admin_role(auth.uid()))
  WITH CHECK (bucket_id IN ('product-images', 'site-assets') AND public.has_admin_role(auth.uid()));

DROP POLICY IF EXISTS "upload_custom_order_refs" ON storage.objects;
CREATE POLICY "upload_custom_order_refs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'custom-order-references');

DROP POLICY IF EXISTS "admin_read_private_buckets" ON storage.objects;
CREATE POLICY "admin_read_private_buckets" ON storage.objects
  FOR SELECT USING (bucket_id IN ('custom-order-references', 'payment-proofs') AND public.has_admin_role(auth.uid()));


-- ==============================================================================
-- Abadikala Fresh Flowers — Migration 003: Secure Server-Side RPCs & Triggers
-- ==============================================================================

-- Auto-create profile and default customer role on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, whatsapp_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'whatsapp_number'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- Server-Validated Checkout RPC
-- Recalculates all product prices from DB (never trusts client prices) and
-- always initializes payment_status as 'pending'.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_from_checkout(
  p_customer_name TEXT,
  p_customer_whatsapp TEXT,
  p_customer_email TEXT,
  p_customer_address TEXT,
  p_fulfillment_type TEXT,
  p_shipping_method_id UUID,
  p_delivery_address TEXT,
  p_location_notes TEXT,
  p_requested_delivery_date DATE,
  p_requested_delivery_time TEXT,
  p_recipient_name TEXT,
  p_recipient_phone TEXT,
  p_greeting_card_type TEXT,
  p_greeting_card_message TEXT,
  p_special_notes TEXT,
  p_custom_instructions TEXT,
  p_payment_method_code TEXT,
  p_payment_method_label TEXT,
  p_coupon_code TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID := gen_random_uuid();
  v_order_number TEXT;
  v_item JSONB;
  v_product RECORD;
  v_variant RECORD;
  v_unit_price NUMERIC(12,2);
  v_line_total NUMERIC(12,2);
  v_subtotal NUMERIC(12,2) := 0;
  v_shipping_fee NUMERIC(12,2) := 0;
  v_shipping_name TEXT := NULL;
  v_discount NUMERIC(12,2) := 0;
  v_coupon_id UUID := NULL;
  v_coupon RECORD;
  v_total NUMERIC(12,2);
  v_qty INTEGER;
  v_img TEXT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang belanja tidak boleh kosong.';
  END IF;

  v_order_number := 'ABK-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(replace(v_order_id::text, '-', ''), 1, 6));

  -- Resolve configured shipping method if provided
  IF p_shipping_method_id IS NOT NULL THEN
    SELECT name, COALESCE(base_fee, 0) INTO v_shipping_name, v_shipping_fee
    FROM public.shipping_methods
    WHERE id = p_shipping_method_id AND is_active = TRUE AND is_configured = TRUE;
  END IF;

  -- First pass: validate products & compute authoritative subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(1, (v_item->>'quantity')::INTEGER);
    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID AND is_active = TRUE AND is_archived = FALSE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk tidak ditemukan atau sudah tidak tersedia.';
    END IF;

    IF v_product.selling_price IS NULL OR v_product.is_price_on_request THEN
      RAISE EXCEPTION 'Produk "%" memerlukan konfirmasi harga terlebih dahulu melalui Custom Order.', v_product.name;
    END IF;

    v_unit_price := v_product.selling_price;
    IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> '' THEN
      SELECT * INTO v_variant
      FROM public.product_variants
      WHERE id = (v_item->>'variant_id')::UUID AND product_id = v_product.id AND is_active = TRUE;
      IF FOUND THEN
        v_unit_price := v_unit_price + v_variant.price_delta;
      END IF;
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  END LOOP;

  -- Optional coupon validation
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(trim(p_coupon_code))
      AND is_active = TRUE
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at >= NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit)
      AND v_subtotal >= min_order_amount;

    IF FOUND THEN
      v_coupon_id := v_coupon.id;
      IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND(v_subtotal * (v_coupon.discount_value / 100.0), 2);
        IF v_coupon.max_discount_amount IS NOT NULL THEN
          v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
        END IF;
      ELSE
        v_discount := LEAST(v_subtotal, v_coupon.discount_value);
      END IF;
      UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = v_coupon.id;
    END IF;
  END IF;

  v_total := GREATEST(0, v_subtotal + v_shipping_fee - v_discount);

  INSERT INTO public.orders (
    id, order_number, user_id, status, payment_status,
    customer_name, customer_whatsapp, customer_email, customer_address,
    fulfillment_type, shipping_method_id, shipping_method_name,
    delivery_address, location_notes, requested_delivery_date, requested_delivery_time,
    recipient_name, recipient_phone, greeting_card_type, greeting_card_message,
    special_notes, custom_instructions,
    subtotal, shipping_fee, discount_amount, coupon_id, coupon_code, total_amount
  ) VALUES (
    v_order_id, v_order_number, auth.uid(), 'awaiting_payment', 'pending',
    p_customer_name, p_customer_whatsapp, p_customer_email, p_customer_address,
    p_fulfillment_type, p_shipping_method_id, v_shipping_name,
    p_delivery_address, p_location_notes, p_requested_delivery_date, p_requested_delivery_time,
    p_recipient_name, p_recipient_phone, p_greeting_card_type, p_greeting_card_message,
    p_special_notes, p_custom_instructions,
    v_subtotal, v_shipping_fee, v_discount, v_coupon_id, p_coupon_code, v_total
  );

  -- Insert immutable item snapshots (including internal cost snapshot for admin margin reports)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := GREATEST(1, (v_item->>'quantity')::INTEGER);
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::UUID;
    v_unit_price := v_product.selling_price;
    v_variant := NULL;

    IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> '' THEN
      SELECT * INTO v_variant FROM public.product_variants WHERE id = (v_item->>'variant_id')::UUID;
      IF FOUND THEN
        v_unit_price := v_unit_price + v_variant.price_delta;
      END IF;
    END IF;

    SELECT image_url INTO v_img
    FROM public.product_images
    WHERE product_id = v_product.id
    ORDER BY is_primary DESC, sort_order ASC
    LIMIT 1;

    v_line_total := v_unit_price * v_qty;

    INSERT INTO public.order_items (
      order_id, product_id, variant_id,
      product_name_snapshot, product_slug_snapshot, product_line_snapshot,
      variant_name_snapshot, image_url_snapshot,
      quantity, unit_price, unit_cost_snapshot, line_total, customization_notes
    ) VALUES (
      v_order_id, v_product.id, CASE WHEN v_variant.id IS NOT NULL THEN v_variant.id ELSE NULL END,
      v_product.name, v_product.slug, v_product.product_line,
      CASE WHEN v_variant.id IS NOT NULL THEN v_variant.name ELSE NULL END, v_img,
      v_qty, v_unit_price, v_product.cost_price, v_line_total, v_item->>'customization_notes'
    );
  END LOOP;

  -- Create initial pending payment record (never auto-confirmed by customer)
  INSERT INTO public.payments (order_id, method_code, method_label, amount, status)
  VALUES (v_order_id, p_payment_method_code, p_payment_method_label, v_total, 'pending');

  -- Record initial order status history
  INSERT INTO public.order_status_history (order_id, status, note, changed_by)
  VALUES (v_order_id, 'awaiting_payment', 'Pesanan dibuat dan menunggu konfirmasi pembayaran.', auth.uid());

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total,
    'status', 'awaiting_payment',
    'payment_status', 'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_from_checkout TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- Public Order Tracking RPC (requires matching order_number + phone/email)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_order_public(
  p_order_number TEXT,
  p_verification TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
  v_history JSONB;
  v_clean_input TEXT := lower(regexp_replace(trim(p_verification), '\s+', '', 'g'));
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE upper(order_number) = upper(trim(p_order_number))
    AND (
      lower(trim(customer_email)) = v_clean_input
      OR regexp_replace(customer_whatsapp, '[^0-9]', '', 'g') = regexp_replace(p_verification, '[^0-9]', '', 'g')
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'product_name', oi.product_name_snapshot,
    'variant_name', oi.variant_name_snapshot,
    'quantity', oi.quantity,
    'unit_price', oi.unit_price,
    'line_total', oi.line_total,
    'image_url', oi.image_url_snapshot
  )), '[]'::jsonb)
  INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'status', h.status,
    'note', h.note,
    'created_at', h.created_at
  ) ORDER BY h.created_at ASC), '[]'::jsonb)
  INTO v_history
  FROM public.order_status_history h
  WHERE h.order_id = v_order.id;

  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'customer_name', v_order.customer_name,
    'fulfillment_type', v_order.fulfillment_type,
    'requested_delivery_date', v_order.requested_delivery_date,
    'tracking_number', v_order.tracking_number,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'discount_amount', v_order.discount_amount,
    'total_amount', v_order.total_amount,
    'created_at', v_order.created_at,
    'items', v_items,
    'history', v_history
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_order_public TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- Admin Order Status Update + Idempotent Stock Deduction + Audit Log
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id UUID,
  p_new_status public.order_status,
  p_note TEXT DEFAULT NULL,
  p_deduct_stock BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_inv RECORD;
  v_ref_key TEXT;
BEGIN
  IF NOT public.has_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengubah status pesanan.';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak ditemukan.';
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      cancellation_reason = CASE WHEN p_new_status = 'cancelled' THEN COALESCE(p_note, cancellation_reason) ELSE cancellation_reason END
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (order_id, status, note, changed_by)
  VALUES (p_order_id, p_new_status, p_note, auth.uid());

  -- Idempotent stock deduction when requested and not yet deducted
  IF p_deduct_stock AND NOT v_order.inventory_deducted THEN
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
    LOOP
      SELECT * INTO v_inv
      FROM public.inventory
      WHERE item_type = 'product' AND product_id = v_item.product_id
      LIMIT 1
      FOR UPDATE;

      IF FOUND AND v_inv.is_stock_configured THEN
        v_ref_key := 'order_deduct:' || p_order_id::text || ':' || v_item.id::text;
        IF NOT EXISTS (SELECT 1 FROM public.inventory_movements WHERE reference_key = v_ref_key) THEN
          UPDATE public.inventory
          SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity)
          WHERE id = v_inv.id;

          INSERT INTO public.inventory_movements (
            inventory_id, movement_type, quantity_change, quantity_before, quantity_after,
            reference_key, order_id, notes, created_by
          ) VALUES (
            v_inv.id, 'order_deduction', -v_item.quantity, v_inv.stock_quantity,
            GREATEST(0, v_inv.stock_quantity - v_item.quantity),
            v_ref_key, p_order_id, 'Pengurangan otomatis saat konfirmasi pesanan ' || v_order.order_number, auth.uid()
          );
        END IF;
      END IF;
    END LOOP;

    UPDATE public.orders SET inventory_deducted = TRUE WHERE id = p_order_id;
  END IF;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    auth.uid(),
    public.get_user_role(auth.uid()),
    'order.status_updated',
    'orders',
    p_order_id::text,
    jsonb_build_object('status', v_order.status),
    jsonb_build_object('status', p_new_status, 'note', p_note)
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_order_status TO authenticated;

-- ------------------------------------------------------------------------------
-- Admin Financial Report RPC (calculates actual profit using internal HPP)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_financial_report(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.has_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Akses ditolak: laporan keuangan hanya untuk admin.';
  END IF;

  SELECT jsonb_build_object(
    'total_orders', COUNT(DISTINCT o.id),
    'confirmed_revenue', COALESCE(SUM(CASE WHEN o.payment_status = 'confirmed' AND o.status <> 'cancelled' THEN o.total_amount ELSE 0 END), 0),
    'total_hpp', COALESCE((
      SELECT SUM(COALESCE(oi.unit_cost_snapshot, 0) * oi.quantity)
      FROM public.order_items oi
      JOIN public.orders ord ON ord.id = oi.order_id
      WHERE ord.payment_status = 'confirmed'
        AND ord.status <> 'cancelled'
        AND (p_start_date IS NULL OR ord.created_at >= p_start_date)
        AND (p_end_date IS NULL OR ord.created_at <= p_end_date)
    ), 0)
  )
  INTO v_result
  FROM public.orders o
  WHERE (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date);

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_financial_report TO authenticated;


-- ==============================================================================
-- Abadikala Fresh Flowers — Migration 004:
-- 1. Instant Customer Registration RPC (eliminates Supabase free SMTP email rate limit)
-- 2. Auto-confirm email trigger on auth.users
-- 3. Guest & Customer Manual Payment Proof RPC (never auto-confirms payment)
-- 4. Admin Custom Order -> Official Order conversion RPC
-- 5. Complete PostgreSQL Role GRANTs matching RLS policies
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Auto-confirm email on new auth.users inserts (defense in depth)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_confirm_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_auth_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_auth_user();

-- ------------------------------------------------------------------------------
-- 2. Instant Customer Registration RPC (bypasses GoTrue free-tier SMTP rate limit)
-- Creates confirmed auth.users + auth.identities + profiles + user_roles('customer').
-- Client immediately signs in via supabase.auth.signInWithPassword().
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_customer_instant(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_whatsapp_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
  v_email TEXT := lower(trim(COALESCE(p_email, '')));
  v_name TEXT := trim(COALESCE(p_full_name, ''));
  v_wa TEXT := NULLIF(trim(COALESCE(p_whatsapp_number, '')), '');
  v_user_id UUID := gen_random_uuid();
  v_instance_id UUID;
  v_hashed_pw TEXT;
BEGIN
  IF v_email = '' OR position('@' IN v_email) < 2 THEN
    RAISE EXCEPTION 'Masukkan alamat email yang valid.';
  END IF;
  IF char_length(COALESCE(p_password, '')) < 6 THEN
    RAISE EXCEPTION 'Kata sandi minimal 6 karakter.';
  END IF;
  IF char_length(v_name) < 2 THEN
    RAISE EXCEPTION 'Nama lengkap minimal 2 karakter.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_email AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.';
  END IF;

  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) INTO v_instance_id;

  v_hashed_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_instance_id,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_hashed_pw,
    NOW(),
    NULL,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', v_name, 'whatsapp_number', v_wa),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  INSERT INTO public.profiles (id, full_name, email, whatsapp_number)
  VALUES (v_user_id, v_name, v_email, v_wa)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, public.profiles.whatsapp_number);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('user_id', v_user_id, 'email', v_email);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_customer_instant(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. Guest & Customer Manual Payment Proof Submission RPC
-- Strictly sets status to 'awaiting_verification' (NEVER 'confirmed').
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_payment_proof_public(
  p_order_number TEXT,
  p_sender_name TEXT,
  p_sender_reference TEXT DEFAULT NULL,
  p_proof_image_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_clean_sender TEXT := trim(COALESCE(p_sender_name, ''));
BEGIN
  IF v_clean_sender = '' THEN
    RAISE EXCEPTION 'Nama pemilik rekening pengirim wajib diisi.';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE upper(order_number) = upper(trim(COALESCE(p_order_number, '')))
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pesanan tidak ditemukan.';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Pesanan yang dibatalkan tidak dapat menerima bukti pembayaran.';
  END IF;

  UPDATE public.payments
  SET sender_name = v_clean_sender,
      sender_reference = NULLIF(trim(COALESCE(p_sender_reference, '')), ''),
      proof_image_url = COALESCE(p_proof_image_url, proof_image_url),
      status = 'awaiting_verification'
  WHERE order_id = v_order.id;

  UPDATE public.orders
  SET payment_status = 'awaiting_verification',
      status = CASE WHEN status = 'awaiting_payment' THEN 'awaiting_verification' ELSE status END
  WHERE id = v_order.id;

  INSERT INTO public.order_status_history (order_id, status, note, changed_by)
  VALUES (
    v_order.id,
    'awaiting_verification',
    'Bukti pembayaran dikirim oleh ' || v_clean_sender || ' — menunggu verifikasi admin.',
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_payment_proof_public(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. Admin Custom Order -> Official Order Conversion RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_convert_custom_order_to_order(
  p_custom_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_co RECORD;
  v_order_id UUID := gen_random_uuid();
  v_order_number TEXT;
BEGIN
  IF NOT public.has_admin_role(auth.uid()) THEN
    RAISE EXCEPTION 'Akses ditolak: hanya admin yang dapat mengonversi custom order.';
  END IF;

  SELECT * INTO v_co FROM public.custom_orders WHERE id = p_custom_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Custom order tidak ditemukan.';
  END IF;
  IF v_co.status <> 'approved' OR v_co.quoted_price IS NULL THEN
    RAISE EXCEPTION 'Custom order hanya dapat dikonversi setelah berstatus Disetujui dan memiliki penawaran harga.';
  END IF;
  IF v_co.linked_order_id IS NOT NULL THEN
    RAISE EXCEPTION 'Custom order ini sudah terhubung dengan pesanan resmi.';
  END IF;

  v_order_number := 'ABK-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(replace(v_order_id::text, '-', ''), 1, 6));

  INSERT INTO public.orders (
    id, order_number, user_id, custom_order_id, status, payment_status,
    customer_name, customer_whatsapp, customer_email,
    fulfillment_type, shipping_method_name, requested_delivery_date,
    recipient_name, recipient_phone, greeting_card_type, greeting_card_message,
    special_notes, custom_instructions, subtotal, total_amount, internal_notes
  ) VALUES (
    v_order_id, v_order_number, v_co.user_id, v_co.id, 'awaiting_payment', 'pending',
    v_co.customer_name, v_co.customer_whatsapp, COALESCE(v_co.customer_email, 'belum-diisi@abadikala.local'),
    'pending_confirmation', 'Menunggu konfirmasi pengiriman', v_co.needed_date,
    v_co.customer_name, v_co.customer_whatsapp,
    CASE WHEN v_co.greeting_card_message IS NOT NULL THEN 'Kartu Tulisan Tangan' ELSE NULL END,
    v_co.greeting_card_message, v_co.additional_notes,
    v_co.product_type || ' • ' || v_co.occasion || ' • Warna: ' || COALESCE(v_co.dominant_colors, '-'),
    v_co.quoted_price, v_co.quoted_price,
    'Dikonversi dari Custom Request ' || v_co.request_number
  );

  INSERT INTO public.order_items (
    order_id, product_name_snapshot, product_line_snapshot, variant_name_snapshot,
    image_url_snapshot, quantity, unit_price, line_total, customization_notes
  ) VALUES (
    v_order_id,
    'Custom: ' || v_co.product_type || ' (' || v_co.request_number || ')',
    CASE WHEN lower(v_co.product_type) LIKE '%awet%' OR lower(v_co.product_type) LIKE '%kering%' OR lower(v_co.product_type) LIKE '%pres%' OR lower(v_co.product_type) LIKE '%shadow%' THEN 'preserved'::public.product_line ELSE 'fresh'::public.product_line END,
    v_co.size_preference,
    '/images/hero-abadikala.jpg',
    1, v_co.quoted_price, v_co.quoted_price, v_co.admin_quote_notes
  );

  INSERT INTO public.payments (order_id, method_code, method_label, amount, status)
  VALUES (v_order_id, 'manual_transfer', 'Transfer Manual (Verifikasi Admin)', v_co.quoted_price, 'pending');

  INSERT INTO public.order_status_history (order_id, status, note, changed_by)
  VALUES (v_order_id, 'awaiting_payment', 'Pesanan dibuat dari Custom Request ' || v_co.request_number, auth.uid());

  UPDATE public.custom_orders
  SET linked_order_id = v_order_id, status = 'in_progress'
  WHERE id = v_co.id;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, new_values)
  VALUES (
    auth.uid(), public.get_user_role(auth.uid()),
    'custom_order.converted', 'orders', v_order_id::text,
    jsonb_build_object('order_number', v_order_number, 'request_number', v_co.request_number)
  );

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_convert_custom_order_to_order(UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. Complete Role GRANTs (RLS enforces row-level authorization & HPP isolation)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT SELECT ON
  public.categories, public.product_images, public.product_variants,
  public.inventory, public.shipping_methods, public.coupons,
  public.reviews, public.banners, public.homepage_sections,
  public.galleries, public.testimonials, public.business_settings
TO anon, authenticated;

GRANT INSERT ON
  public.contact_messages, public.newsletter_subscribers,
  public.custom_orders, public.custom_order_attachments
TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.user_roles, public.addresses,
  public.categories, public.products, public.product_images, public.product_variants,
  public.inventory, public.inventory_movements,
  public.carts, public.cart_items, public.wishlists, public.wishlist_items,
  public.orders, public.order_status_history, public.payments,
  public.shipping_methods, public.custom_orders, public.custom_order_attachments,
  public.coupons, public.reviews, public.banners, public.homepage_sections,
  public.galleries, public.testimonials, public.business_settings,
  public.contact_messages, public.newsletter_subscribers, public.audit_logs
TO authenticated;

REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.order_items FROM anon;
REVOKE ALL ON public.order_items FROM authenticated;
GRANT SELECT (
  id, order_id, product_id, variant_id,
  product_name_snapshot, product_slug_snapshot, product_line_snapshot,
  variant_name_snapshot, image_url_snapshot,
  quantity, unit_price, line_total, customization_notes, created_at
) ON public.order_items TO authenticated;

NOTIFY pgrst, 'reload schema';


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

-- 3. Product Images (deterministic UUIDs for 100% idempotent re-runs)
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', '/images/product-buket-kecil.jpg', 'Buket Kecil Plastik Bening Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', '/images/product-buket-korea.jpg', 'Buket Besar Gaya Korea Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333313', '22222222-2222-4222-8222-222222222202', '/images/lini-segar.jpg', 'Detail Wrapping Buket Gaya Korea', FALSE, 2),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222203', '/images/product-bunga-meja.jpg', 'Bunga Meja Langganan Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222204', '/images/product-flower-bar.jpg', 'Flower Bar Abadikala Fresh Flowers', TRUE, 1),
  ('33333333-3333-4333-8333-333333333305', '22222222-2222-4222-8222-222222222205', '/images/product-buket-kering.jpg', 'Buket Bunga Kering Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333306', '22222222-2222-4222-8222-222222222206', '/images/product-pressed-frame.jpg', 'Bingkai Pressed Flower Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333307', '22222222-2222-4222-8222-222222222207', '/images/product-plakat-akrilik.jpg', 'Plakat Akrilik Bunga Pres Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333308', '22222222-2222-4222-8222-222222222208', '/images/product-shadow-box.jpg', 'Shadow-Box Nama dan Gelar Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333309', '22222222-2222-4222-8222-222222222209', '/images/product-mawar-kubah.jpg', 'Mawar Kubah Kaca Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333310', '22222222-2222-4222-8222-222222222210', '/images/product-resin-craft.jpg', 'Gantungan Kunci Resin Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333311', '22222222-2222-4222-8222-222222222211', '/images/product-resin-craft.jpg', 'Pembatas Buku Bunga Pres Abadikala', TRUE, 1),
  ('33333333-3333-4333-8333-333333333312', '22222222-2222-4222-8222-222222222212', '/images/product-jasa-pengawetan.jpg', 'Jasa Pengawetan Buket Abadikala', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- 3b. Product Variants
INSERT INTO public.product_variants (id, product_id, name, sku, price_delta, is_active, sort_order) VALUES
  ('44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', 'Nuansa Blush & Cream', 'ABK-FR-001-BL', 0, TRUE, 1),
  ('44444444-4444-4444-8444-444444444402', '22222222-2222-4222-8222-222222222201', 'Nuansa Burgundy & Putih', 'ABK-FR-001-BG', 0, TRUE, 2),
  ('44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222202', 'Soft Dusty Rose & Ivory', 'ABK-FR-002-DR', 0, TRUE, 1),
  ('44444444-4444-4444-8444-444444444404', '22222222-2222-4222-8222-222222222202', 'Romantic Burgundy', 'ABK-FR-002-BG', 0, TRUE, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Inventory records (configured initial stock, editable via Admin)
INSERT INTO public.inventory (item_type, product_id, unit, stock_quantity, low_stock_threshold, is_stock_configured, notes)
SELECT 'product', p.id, COALESCE(p.price_unit, 'pcs'), 15, 5, TRUE, 'Stok awal studio Banda Sakti, Lhokseumawe.'
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

-- 7. Curated Initial Gallery (deterministic UUIDs)
INSERT INTO public.galleries (id, title, caption, image_url, external_link, category_tag, is_active, sort_order) VALUES
  ('55555555-5555-4555-8555-555555555501', 'Rangkaian Editorial Abadikala', 'Harmoni mawar blush, ranunculus burgundy, dan eucalyptus segar.', '/images/hero-abadikala.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Segar', TRUE, 1),
  ('55555555-5555-4555-8555-555555555502', 'Buket Besar Gaya Korea', 'Lapisan kertas lembut dengan komposisi bunga segar melimpah.', '/images/product-buket-korea.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Segar', TRUE, 2),
  ('55555555-5555-4555-8555-555555555503', 'Bingkai Pressed Flower', 'Kelopak bunga asli yang dipres rapi dalam bingkai kayu & kaca.', '/images/product-pressed-frame.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 3),
  ('55555555-5555-4555-8555-555555555504', 'Mawar Kubah Kaca', 'Keindahan mawar awetan sebagai simbol kenangan abadi.', '/images/product-mawar-kubah.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 4),
  ('55555555-5555-4555-8555-555555555505', 'Shadow-Box Wisuda Personal', 'Mawar kering berdimensi 3D lengkap dengan nama dan gelar kelulusan.', '/images/product-shadow-box.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 5),
  ('55555555-5555-4555-8555-555555555506', 'Flower Bar Studio Banda Sakti', 'Pilih bungamu sendiri—mawar, krisan, aster, gerbera, dan baby breath segar.', '/images/product-flower-bar.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Segar', TRUE, 6),
  ('55555555-5555-4555-8555-555555555507', 'Suvenir Resin & Pembatas Buku', 'Kelopak bunga asli terawetkan dalam resin bening, kado manis untuk sahabat.', '/images/product-resin-craft.jpg', 'https://instagram.com/abadikalaflowers', 'Lini Abadi', TRUE, 7),
  ('55555555-5555-4555-8555-555555555508', 'Meja Kerja Pengawetan Buket', 'Proses teliti mengubah buket hari spesial menjadi bingkai kenangan.', '/images/product-jasa-pengawetan.jpg', 'https://instagram.com/abadikalaflowers', 'Jasa Pengawetan', TRUE, 8)
ON CONFLICT (id) DO NOTHING;

-- 7b. Seed Realistic Customer Testimonials (deterministic UUIDs, Editable via Admin CMS)
INSERT INTO public.testimonials (id, customer_name, occasion, rating, quote, is_published, sort_order) VALUES
  ('66666666-6666-4666-8666-666666666601', 'Cut Nadira Salsabila', 'Wisuda Universitas Malikussaleh', 5, 'Pesan Buket Besar Gaya Korea untuk wisuda adik saya. Bunganya segar banget, wrapping-nya rapi dan elegan, padahal harganya sangat bersahabat. Kartu ucapan tulisan tangannya juga manis sekali!', TRUE, 1),
  ('66666666-6666-4666-8666-666666666602', 'Teuku Farhan Pratama', 'Anniversary di Lhokseumawe', 5, 'Mawar Kubah Kaca dari Abadikala jadi hadiah paling berkesan untuk istri saya. Packing aman, pengantaran kurir studio tepat waktu ke rumah di Muara Dua, dan tampilannya benar-benar premium.', TRUE, 2),
  ('66666666-6666-4666-8666-666666666603', 'Raudhatul Jannah', 'Jasa Pengawetan Buket Pernikahan', 5, 'Senang sekali buket akad nikah saya tidak berakhir layu. Tim Abadikala mengolahnya menjadi bingkai shadow-box yang indah dan sekarang jadi pajangan favorit di ruang tamu kami.', TRUE, 3),
  ('66666666-6666-4666-8666-666666666604', 'Dinda Khairunnisa', 'Sidang Skripsi & Kado Sahabat', 5, 'Buket Kecil Plastik Bening Rp75.000 sudah terlihat sangat manis dan estetik untuk kado sidang teman kampus. Suka banget karena di Lhokseumawe akhirnya ada toko bunga segar yang rapi dan mudah dipesan online.', TRUE, 4)
ON CONFLICT (id) DO NOTHING;

-- 8. Business Settings (Complete Realistic Lhokseumawe Florist Setup + FAQs)
INSERT INTO public.business_settings (setting_key, setting_group, value, is_configured, is_public) VALUES
  ('brand_identity', 'general', '{"business_name": "Abadikala Fresh Flowers", "short_name": "Abadikala", "tagline": "Segar Hari Ini, Abadi Selamanya", "city": "Lhokseumawe, Aceh, Indonesia", "logo_url": ""}'::jsonb, TRUE, TRUE),
  ('contact_info', 'contact', '{"address": "Jl. Merdeka Barat No. 48, Simpang Empat, Kec. Banda Sakti, Kota Lhokseumawe, Aceh 24351", "whatsapp": "+62 822-7410-8820", "email": "halo@abadikalaflowers.id", "operational_hours": "Senin–Minggu, 08.00–21.00 WIB"}'::jsonb, TRUE, TRUE),
  ('social_links', 'social', '{"instagram": "https://instagram.com/abadikalaflowers", "tiktok": "https://tiktok.com/@abadikalaflowers", "facebook": "https://facebook.com/abadikalaflowers"}'::jsonb, TRUE, TRUE),
  ('delivery_policy', 'operations', '{"service_areas": "Kota Lhokseumawe (Banda Sakti, Muara Dua, Muara Satu, Blang Mangat) & ekspedisi seluruh Indonesia khusus Lini Abadi", "courier_info": "Kurir Toko Khusus Abadikala (Rp15.000) & Pick-up di Studio (Rp0)", "min_order_amount": 25000, "preorder_lead_time": "Minimal H-1 buket segar custom & H-3 produk personalisasi Lini Abadi (same-day sebelum pukul 14.00 WIB)", "processing_time": "Buket segar 1–3 jam • Lini Abadi 2–5 hari kerja • Jasa pengawetan 14–21 hari kerja", "pickup_available": true}'::jsonb, TRUE, TRUE),
  ('payment_config', 'payment', '{"manual_transfer_enabled": true, "payment_gateway_enabled": false, "bank_accounts": [{"bank_name": "Bank Syariah Indonesia (BSI)", "account_number": "7189 4025 18", "account_holder": "Abadikala Fresh Flowers (Yulistia Masruri Sitepu)"}, {"bank_name": "Bank Central Asia (BCA)", "account_number": "8240 5192 73", "account_holder": "Abadikala Fresh Flowers (Yulistia Masruri Sitepu)"}], "payment_instructions": "Lakukan transfer sesuai nominal total pesanan ke rekening resmi BSI atau BCA, lalu unggah bukti transfer melalui halaman konfirmasi pesanan. Verifikasi maksimal 1x30 menit pada jam operasional (08.00–21.00 WIB)."}'::jsonb, TRUE, TRUE),
  ('personalized_services', 'services', '{"handwritten_card": true, "custom_bouquet": true, "color_request": true, "bouquet_preservation": true, "gift_arrangement": true}'::jsonb, TRUE, TRUE),
  ('legal_drafts', 'legal', '{"is_final": true, "privacy_policy": "Abadikala Fresh Flowers melindungi seluruh data pribadi pelanggan (nama, email, WhatsApp, alamat pengiriman, serta isi kartu ucapan) dan hanya menggunakannya untuk pemrosesan pesanan serta layanan pelanggan.", "terms_conditions": "Setiap rangkaian bunga dirangkai segar saat dipesan. Ketersediaan jenis bunga musiman dapat menyesuaikan stok harian dengan nuansa warna dan kualitas setara melalui konfirmasi admin.", "shipping_policy": "Pengantaran Kurir Toko area Kota Lhokseumawe Rp15.000, Pick-up di Studio Banda Sakti Rp0, serta pengiriman luar kota khusus Lini Abadi Rp25.000 via ekspedisi aman kotak kraft.", "cancellation_policy": "Pembatalan sebelum pembayaran diverifikasi bebas biaya. Pesanan Lini Segar terbayar dapat dibatalkan maksimal H-1 sebelum dirangkai. Garansi penggantian berlaku maksimal 3 jam setelah paket diterima dengan bukti foto."}'::jsonb, TRUE, TRUE),
  ('faqs', 'cms', '[{"id":"faq-1","category":"Produk & Lini","question":"Apa perbedaan Lini Segar dan Lini Abadi di Abadikala?","answer":"Lini Segar menghadirkan rangkaian bunga segar pilihan untuk dinikmati hari ini (buket kecil, buket Korea, bunga meja langganan, Flower Bar). Lini Abadi menghadirkan produk bunga awetan seperti buket kering, pressed flower, plakat akrilik, shadow-box, mawar kubah kaca, suvenir resin, serta jasa pengawetan buket.","is_active":true},{"id":"faq-2","category":"Pemesanan & Pre-Order","question":"Apakah bisa pesan mendadak (same-day) di area Lhokseumawe?","answer":"Bisa! Untuk buket bunga segar, pesanan same-day dilayani hingga pukul 14.00 WIB sesuai stok harian. Custom bouquet disarankan H-1 dan produk personalisasi Lini Abadi minimal H-3.","is_active":true},{"id":"faq-3","category":"Pengiriman","question":"Berapa ongkos kirim di Lhokseumawe dan apakah bisa kirim ke luar kota?","answer":"Tarif Kurir Toko area Kota Lhokseumawe Rp15.000 flat, atau Pick-up Gratis di studio Jl. Merdeka Barat No. 48, Banda Sakti. Produk Lini Abadi dapat dikirim ke luar kota via ekspedisi Rp25.000.","is_active":true},{"id":"faq-4","category":"Pembayaran","question":"Metode pembayaran apa saja yang tersedia?","answer":"Transfer Bank Syariah Indonesia (BSI) dan BCA. Unggah bukti transfer pada halaman konfirmasi pesanan untuk diverifikasi admin maksimal 1x30 menit (08.00–21.00 WIB).","is_active":true},{"id":"faq-5","category":"Pengawetan Buket","question":"Kapan waktu terbaik menyerahkan buket untuk Jasa Pengawetan Buket?","answer":"Idealnya 1–2 hari setelah acara (wisuda, lamaran, atau pernikahan) saat kelopak masih segar. Proses pengeringan & penyusunan bingkai membutuhkan 14–21 hari kerja.","is_active":true}]'::jsonb, TRUE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
