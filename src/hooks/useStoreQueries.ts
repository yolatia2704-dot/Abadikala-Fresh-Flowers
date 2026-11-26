import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchBusinessSettings,
  fetchCategories,
  fetchGallery,
  fetchHomepageSections,
  fetchProductReviews,
  fetchPublicProductBySlug,
  fetchPublicProducts,
  fetchShippingMethods,
  fetchTestimonials,
  type ProductFilterParams,
} from '@/services/api';

export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: ['categories', includeInactive],
    queryFn: () => fetchCategories(includeInactive),
  });
}

export function usePublicProducts(filters: ProductFilterParams = {}) {
  return useQuery({
    queryKey: ['public-products', filters],
    queryFn: () => fetchPublicProducts(filters),
  });
}

export function usePublicProduct(slug: string) {
  return useQuery({
    queryKey: ['public-product', slug],
    queryFn: () => fetchPublicProductBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => fetchProductReviews(productId!),
    enabled: Boolean(productId),
  });
}

export function useHomepageSections() {
  return useQuery({
    queryKey: ['homepage-sections'],
    queryFn: fetchHomepageSections,
  });
}

export function useGallery(includeInactive = false) {
  return useQuery({
    queryKey: ['gallery', includeInactive],
    queryFn: () => fetchGallery(includeInactive),
  });
}

export function useTestimonials(includeUnpublished = false) {
  return useQuery({
    queryKey: ['testimonials', includeUnpublished],
    queryFn: () => fetchTestimonials(includeUnpublished),
  });
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: fetchBusinessSettings,
  });
}

export function useShippingMethods(includeUnconfigured = false) {
  return useQuery({
    queryKey: ['shipping-methods', includeUnconfigured],
    queryFn: () => fetchShippingMethods(includeUnconfigured),
  });
}

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} | Abadikala Fresh Flowers`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
  }, [title, description]);
}
