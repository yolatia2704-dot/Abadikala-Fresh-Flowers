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
