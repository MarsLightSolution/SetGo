import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';
import api from '../services/api';

// ==================== QUERY KEYS ====================

export const userQueryKeys = {
  ads: (userId) => ['user', 'ads', userId],
};

// ==================== FETCHERS ====================

const fetchUserAds = async (userId) => {
  try {
    const { data } = await api.get(API_ENDPOINTS.USER_ADS(userId));
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    const status = err.response?.status;
    throw Object.assign(new Error(status === 401 ? 'Unauthorized' : 'Failed to fetch ads'), { status });
  }
};

// ==================== HOOKS ====================

/**
 * Fetches ads posted by a user.
 * Requires a resolved userId — pass null while loading to keep disabled.
 * Stale for 3 min.
 */
export const useUserAds = (userId) =>
  useQuery({
    queryKey: userQueryKeys.ads(userId),
    queryFn: () => fetchUserAds(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
  });

/**
 * Helper — invalidate user ads after create/delete/update mutations.
 */
export const useInvalidateUserAds = () => {
  const queryClient = useQueryClient();
  return (userId) =>
    queryClient.invalidateQueries({ queryKey: userQueryKeys.ads(userId) });
};
