import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';
import { getAuthToken, getUserId } from '../services/secureAuthService';

// ==================== QUERY KEYS ====================

export const userQueryKeys = {
  ads: (userId) => ['user', 'ads', userId],
};

// ==================== FETCHERS ====================

const fetchUserAds = async (userId) => {
  const token = await getAuthToken();
  const response = await fetch(API_ENDPOINTS.USER_ADS(userId), {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
  if (response.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (!response.ok) throw new Error('Failed to fetch ads');
  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
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
