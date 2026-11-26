import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CartItem, PublicProduct, ProductVariant } from '@/types/database';

const CART_STORAGE_KEY = 'abadikala_cart_v1';

interface CartContextValue {
  items: CartItem[];
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  addItem: (
    product: PublicProduct,
    quantity?: number,
    variant?: ProductVariant | null,
    customizationNotes?: string | null
  ) => { ok: boolean; message?: string };
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const addItem = (
    product: PublicProduct,
    quantity = 1,
    variant: ProductVariant | null = null,
    customizationNotes: string | null = null
  ): { ok: boolean; message?: string } => {
    if (product.is_price_on_request || product.selling_price === null) {
      return {
        ok: false,
        message: 'Produk ini menggunakan harga menyesuaikan. Silakan ajukan melalui halaman Custom Order.',
      };
    }

    if (product.is_stock_configured && !product.allow_backorder && product.stock_quantity < quantity) {
      return {
        ok: false,
        message: `Stok tersisa hanya ${product.stock_quantity}.`,
      };
    }

    const unitPrice = product.selling_price + (variant?.price_delta || 0);
    const normalizedNotes = customizationNotes?.trim() || null;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.product_id === product.id &&
          i.variant_id === (variant?.id || null) &&
          i.customization_notes === normalizedNotes
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        const nextQty = next[existingIndex].quantity + quantity;
        const maxQty =
          product.is_stock_configured && !product.allow_backorder
            ? Math.min(nextQty, product.stock_quantity)
            : nextQty;
        next[existingIndex] = { ...next[existingIndex], quantity: maxQty };
        return next;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          product,
          variant_id: variant?.id || null,
          variant_name: variant?.name || null,
          unit_price: unitPrice,
          quantity,
          customization_notes: normalizedNotes,
        },
      ];
    });

    setDrawerOpen(true);
    return { ok: true };
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const maxAllowed =
          item.product.is_stock_configured && !item.product.allow_backorder
            ? Math.max(1, item.product.stock_quantity)
            : 99;
        return { ...item, quantity: Math.min(quantity, maxAllowed) };
      })
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        setDrawerOpen,
        totalItems,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
