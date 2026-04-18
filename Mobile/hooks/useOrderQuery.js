import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';

// ==================== QUERY KEYS ====================

export const orderKeys = {
  transactions: (userId) => ['orders', 'transactions', userId],
  detail: (orderId) => ['orders', 'detail', orderId],
};

// ==================== FETCHERS ====================

const fetchTransactions = async (userId) => {
  const response = await fetch(API_ENDPOINTS.USER_TRANSACTIONS(userId), {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await response.json();
  return json.data || { transactions: [], walletBalance: 0, totalCredit: 0, totalDebit: 0 };
};

const fetchOrderDetail = async (orderId) => {
  const res = await fetch(API_ENDPOINTS.ORDER_DETAIL(orderId));
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Order not found');
  return data.data;
};

// ==================== HOOKS ====================

/**
 * Fetches wallet transactions for a user.
 * Enabled only when authenticated and on the transactions tab.
 * Stale for 2 min — balance can change frequently.
 */
export const useTransactions = (userId, enabled = true) =>
  useQuery({
    queryKey: orderKeys.transactions(userId),
    queryFn: () => fetchTransactions(userId),
    enabled: !!userId && enabled,
    staleTime: 2 * 60 * 1000,
  });

/**
 * Fetches a single order by ID.
 * Stale for 10 min — order state rarely changes after placement.
 */
export const useOrderDetail = (orderId) =>
  useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 10 * 60 * 1000,
  });

/**
 * Helper — invalidate transactions cache after wallet mutations.
 */
export const useInvalidateTransactions = () => {
  const queryClient = useQueryClient();
  return (userId) =>
    queryClient.invalidateQueries({ queryKey: orderKeys.transactions(userId) });
};
