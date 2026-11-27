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
  v_variant_id UUID;
  v_variant_name TEXT;
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
    v_variant_id := NULL;
    v_variant_name := NULL;

    IF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') <> '' THEN
      SELECT * INTO v_variant FROM public.product_variants WHERE id = (v_item->>'variant_id')::UUID;
      IF FOUND THEN
        v_variant_id := v_variant.id;
        v_variant_name := v_variant.name;
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
      v_order_id, v_product.id, v_variant_id,
      v_product.name, v_product.slug, v_product.product_line,
      v_variant_name, v_img,
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
