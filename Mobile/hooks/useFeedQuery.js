import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';
import { productService } from '../services/productService';

// ==================== QUERY KEYS ====================

export const feedKeys = {
  products: (filters) => ['feed', 'products', filters],
  gallery: () => ['feed', 'gallery'],
  shops: () => ['feed', 'shops'],
};

// ==================== FETCHERS ====================

const fetchFeedProducts = async (filters) => {
  const params = { page: 1, limit: 12, ...filters };
  // Strip empty values
  Object.keys(params).forEach((k) => {
    if (params[k] === '' || params[k] == null) delete params[k];
  });
  return productService.getProducts(params);
};

const fetchGalleryProducts = async () => {
  return productService.getPriorityProducts();
};

const fetchShops = async () => {
  const res = await fetch(`${API_ENDPOINTS.GET_SHOPS}?limit=10`);
  if (!res.ok) throw new Error('Failed to fetch shops');
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch shops');
  return data.data || [];
};

// ==================== HOOKS ====================

/**
 * Home feed products — refetches when filters change.
 * Stale for 5 min.
 */
export const useFeedProducts = (filters = {}) =>
  useQuery({
    queryKey: feedKeys.products(filters),
    queryFn: () => fetchFeedProducts(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // keep old data visible while new page loads
  });

/**
 * Priority/gallery products shown in the hero section.
 * Stale for 10 min — changes infrequently.
 */
export const useGalleryProducts = () =>
  useQuery({
    queryKey: feedKeys.gallery(),
    queryFn: fetchGalleryProducts,
    staleTime: 10 * 60 * 1000,
  });

/**
 * Shops strip on the home screen.
 * Stale for 15 min — shop list changes rarely.
 */
export const useShops = () =>
  useQuery({
    queryKey: feedKeys.shops(),
    queryFn: fetchShops,
    staleTime: 15 * 60 * 1000,
  });
