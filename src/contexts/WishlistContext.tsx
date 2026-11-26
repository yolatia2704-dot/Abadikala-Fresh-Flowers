import React, { createContext, useContext, useEffect, useState } from 'react';

const WISHLIST_STORAGE_KEY = 'abadikala_wishlist_v1';

interface WishlistContextValue {
  productIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
  removeWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [productIds, setProductIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds));
    } catch {
      // ignore
    }
  }, [productIds]);

  const isWishlisted = (productId: string) => productIds.includes(productId);

  const toggleWishlist = (productId: string): boolean => {
    const exists = productIds.includes(productId);
    setProductIds((prev) =>
      exists ? prev.filter((id) => id !== productId) : [productId, ...prev]
    );
    return !exists;
  };

  const removeWishlist = (productId: string) => {
    setProductIds((prev) => prev.filter((id) => id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{ productIds, isWishlisted, toggleWishlist, removeWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
