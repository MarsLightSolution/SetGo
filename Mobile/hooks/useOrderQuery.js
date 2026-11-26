import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../config/api';
import api from '../services/api';

// ==================== QUERY KEYS ====================

export const orderKeys = {
  transactions: (userId) => ['orders', 'transactions', userId],
  detail: (orderId) => ['orders', 'detail', orderId],
  userOrders: (userId) => ['orders', 'user', userId],
};

// ==================== FETCHERS ====================

// Both routes require login and only return the logged-in user's own data, so they go through
// the shared api client (Bearer token + refresh).
const fetchTransactions = async (userId) => {
  const { data: json } = await api.get(API_ENDPOINTS.USER_TRANSACTIONS(userId));
  return json?.data || { transactions: [], walletBalance: 0, totalCredit: 0, totalDebit: 0 };
};

const fetchUserOrders = async (userId) => {
  const { data } = await api.get(API_ENDPOINTS.USER_ORDERS(userId));
  return Array.isArray(data?.data) ? data.data : (data?.orders || []);
};

// /payments/order/:id: authenticated, buyer/seller only, and includes paymentStatus.
const fetchOrderDetail = async (orderId) => {
  const { data } = await api.get(API_ENDPOINTS.PAYMENT_ORDER(orderId));
  if (!data?.success || !data?.data?.order) throw new Error(data?.message || 'Order not found');
  return data.data.order;
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
 * While the bank is still confirming a card payment (paymentStatus "processing") it refetches
 * every 5s; otherwise stale for 1 min.
 */
export const useOrderDetail = (orderId) =>
  useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 60 * 1000,
    refetchInterval: (query) => (query.state.data?.paymentStatus === 'processing' ? 5000 : false),
  });

/**
 * Fetches orders placed by a user. Stale for 3 min.
 */
export const useUserOrders = (userId, enabled = true) =>
  useQuery({
    queryKey: orderKeys.userOrders(userId),
    queryFn: () => fetchUserOrders(userId),
    enabled: !!userId && enabled,
    staleTime: 3 * 60 * 1000,
  });

/**
 * Helper — invalidate transactions cache after wallet mutations.
 */
export const useInvalidateTransactions = () => {
  const queryClient = useQueryClient();
  return (userId) =>
    queryClient.invalidateQueries({ queryKey: orderKeys.transactions(userId) });
};
