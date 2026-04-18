import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';

// ==================== QUERY KEYS ====================
// Centralised so invalidations are consistent across the app.

export const productKeys = {
  detail: (id) => ['product', 'detail', id],
  related: (category, excludeId) => ['product', 'related', category, excludeId],
  shop: (shopId) => ['shop', 'detail', shopId],
};

// ==================== FETCHERS ====================

const fetchProduct = async (id) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_ENDPOINTS.GET_PRODUCT(id)}?lang=en`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);

    const result = await res.json();
    if (result.success === false || !result.data) {
      throw new Error(result.message || 'Product not found');
    }
    return result.data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const fetchRelatedProducts = async ({ category, excludeId }) => {
  if (!category) return [];
  const res = await fetch(
    `${API_ENDPOINTS.PRODUCTS_BY_CATEGORY(category)}?lang=en&limit=4`
  );
  const json = await res.json();
  return json.data?.filter((p) => p._id !== excludeId).slice(0, 4) || [];
};

const fetchShop = async (shopId) => {
  const res = await fetch(API_ENDPOINTS.GET_SHOP(shopId));
  if (!res.ok) throw new Error('Failed to fetch shop');
  const data = await res.json();
  return data?.shop || data;
};

// ==================== HOOKS ====================

/**
 * Fetches and caches a product by ID.
 * Stale for 5 min — revisiting a product page is instant.
 */
export const useProductDetail = (id) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Fetches related products by category, excluding the current product.
 * Lower priority — enabled only after the product is loaded.
 */
export const useRelatedProducts = (category, excludeId) =>
  useQuery({
    queryKey: productKeys.related(category, excludeId),
    queryFn: () => fetchRelatedProducts({ category, excludeId }),
    enabled: !!category && !!excludeId,
    staleTime: 10 * 60 * 1000,
  });

/**
 * Fetches shop details (used for follow status check).
 * Cached for 1 hour — shop metadata changes rarely.
 */
export const useShopDetail = (shopId) =>
  useQuery({
    queryKey: productKeys.shop(shopId),
    queryFn: () => fetchShop(shopId),
    enabled: !!shopId,
    staleTime: 60 * 60 * 1000,
  });

/**
 * Helper — call after a follow/unfollow to update the cached shop followers
 * without a full refetch.
 */
export const useInvalidateShop = () => {
  const queryClient = useQueryClient();
  return (shopId) => queryClient.invalidateQueries({ queryKey: productKeys.shop(shopId) });
};
