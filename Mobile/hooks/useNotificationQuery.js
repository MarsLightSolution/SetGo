import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { API_ENDPOINTS, SOCKET_URL } from '../config/api';
import { getAuthToken } from '../services/secureAuthService';
import io from 'socket.io-client';

const notifKeys = {
  list: () => ['notifications', 'list'],
  unread: () => ['notifications', 'unread'],
};

const authHeaders = async () => {
  const token = await getAuthToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const fetchNotifications = async () => {
  const headers = await authHeaders();
  const res = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}?limit=50`, { headers });
  const data = await res.json();
  return data.data?.notifications || [];
};

const fetchUnreadCount = async () => {
  const headers = await authHeaders();
  const res = await fetch(API_ENDPOINTS.NOTIFICATIONS_UNREAD, { headers });
  const data = await res.json();
  return data.data?.unreadCount || 0;
};

// Listens for real-time `notification` socket events and invalidates the query cache
export function useNotificationSocket(enabled = true) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
    });
    socket.on('notification', () => {
      qc.invalidateQueries({ queryKey: notifKeys.list() });
      qc.invalidateQueries({ queryKey: notifKeys.unread() });
    });
    return () => socket.disconnect();
  }, [enabled, qc]);
}

export const useNotifications = (enabled = true) =>
  useQuery({
    queryKey: notifKeys.list(),
    queryFn: fetchNotifications,
    enabled,
    staleTime: 30 * 1000,
  });

export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: notifKeys.unread(),
    queryFn: fetchUnreadCount,
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const headers = await authHeaders();
      await fetch(API_ENDPOINTS.NOTIFICATION_READ(id), { method: 'PATCH', headers });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.list() });
      qc.invalidateQueries({ queryKey: notifKeys.unread() });
    },
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const headers = await authHeaders();
      await fetch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL, { method: 'PATCH', headers });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.list() });
      qc.invalidateQueries({ queryKey: notifKeys.unread() });
    },
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const headers = await authHeaders();
      await fetch(API_ENDPOINTS.NOTIFICATION_DELETE(id), { method: 'DELETE', headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.list() }),
  });
};
