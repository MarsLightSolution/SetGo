import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';

// ==================== QUERY KEYS ====================

export const shopQueryKeys = {
  profile: (id) => ['shop', 'profile', id],
  products: (id, page) => ['shop', 'products', id, page],
  list: (page, search, category) => ['shops', 'list', page, search, category],
};

// ==================== FETCHERS ====================

const fetchShopProfile = async (id) => {
  const response = await fetch(API_ENDPOINTS.GET_SHOP(id), {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();
  if (!data.success || !data.data) throw new Error(data.message || 'Shop not found');
  return data.data;
};

const fetchShopProducts = async (shopId, page) => {
  const params = new URLSearchParams({ page: page.toString(), limit: '12' });
  const response = await fetch(`${API_ENDPOINTS.SHOP_PRODUCTS(shopId)}?${params}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch products');
  return {
    products: data.data || [],
    pagination: {
      currentPage: data.pagination?.currentPage || 1,
      totalPages: data.pagination?.totalPages || 1,
      hasNextPage: data.pagination?.hasNextPage || false,
    },
  };
};

const fetchShopsList = async (page, search, category) => {
  const params = new URLSearchParams({ page: page.toString(), limit: '12' });
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);
  const response = await fetch(`${API_ENDPOINTS.GET_SHOPS}?${params.toString()}`);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch shops');
  return {
    shops: data.data || [],
    pagination: {
      currentPage: data.pagination?.currentPage || 1,
      totalPages: data.pagination?.totalPages || 1,
      hasNextPage: data.pagination?.hasNextPage || false,
      hasPrevPage: data.pagination?.hasPrevPage || false,
    },
  };
};

// ==================== HOOKS ====================

/**
 * Fetches full shop profile including initial products.
 * Stale for 5 min.
 */
export const useShopProfile = (id) =>
  useQuery({
    queryKey: shopQueryKeys.profile(id),
    queryFn: () => fetchShopProfile(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Fetches paginated products for a shop.
 * Keeps previous page data visible while next page loads.
 * Stale for 5 min.
 */
export const useShopProducts = (shopId, page = 1) =>
  useQuery({
    queryKey: shopQueryKeys.products(shopId, page),
    queryFn: () => fetchShopProducts(shopId, page),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

/**
 * Fetches paginated + searchable shops list.
 * Keeps previous page data visible while loading.
 * Stale for 5 min.
 */
export const useShopsList = (page = 1, search = '', category = '') =>
  useQuery({
    queryKey: shopQueryKeys.list(page, search, category),
    queryFn: () => fetchShopsList(page, search, category),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

/**
 * Helper — invalidate a shop profile after follow/unfollow mutations.
 */
export const useInvalidateShopProfile = () => {
  const queryClient = useQueryClient();
  return (id) =>
    queryClient.invalidateQueries({ queryKey: shopQueryKeys.profile(id) });
};
