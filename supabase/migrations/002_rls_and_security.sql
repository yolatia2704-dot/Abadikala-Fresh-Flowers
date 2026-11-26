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
