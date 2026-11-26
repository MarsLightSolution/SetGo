import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { API_ENDPOINTS, SOCKET_URL } from '../config/api';
import api, { getFreshAuthToken } from '../services/api';
import { captureException } from '../services/errorReporter';
import logger from '../utils/logger';
import io from 'socket.io-client';

const log = logger.create('NotificationSocket');

const notifKeys = {
  list: () => ['notifications', 'list'],
  unread: () => ['notifications', 'unread'],
};

const fetchNotifications = async () => {
  const { data } = await api.get(API_ENDPOINTS.NOTIFICATIONS, { params: { limit: 50 } });
  return data?.data?.notifications || [];
};

const fetchUnreadCount = async () => {
  const { data } = await api.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD);
  return data?.data?.unreadCount || 0;
};

// Listens for real-time `notification` socket events and invalidates the query cache
export function useNotificationSocket(enabled = true) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    let socket;
    let cancelled = false;
    getFreshAuthToken().then(token => {
      if (!token || cancelled) return;
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        auth: (cb) => {
          // Called on every (re)connect, so a reconnect after the token expired still authenticates.
          getFreshAuthToken().then((t) => cb(t ? { token: `Bearer ${t}` } : {}), () => cb({}));
        },
      });
      socket.on('notification', () => {
        qc.invalidateQueries({ queryKey: notifKeys.list() });
        qc.invalidateQueries({ queryKey: notifKeys.unread() });
      });
      socket.on('connect_error', (err) => {
        log.warn('Socket connect_error:', err?.message);
        captureException(err, { type: 'socket', module: 'Notifications', extra: { event: 'connect_error' } });
      });
      socket.on('error', (err) => {
        log.warn('Socket error:', err?.message);
        captureException(err, { type: 'socket', module: 'Notifications', extra: { event: 'error' } });
      });
    });
    return () => {
      cancelled = true;
      socket?.disconnect();
    };
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
      await api.patch(API_ENDPOINTS.NOTIFICATION_READ(id));
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
      await api.patch(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
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
      await api.delete(API_ENDPOINTS.NOTIFICATION_DELETE(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.list() }),
  });
};
