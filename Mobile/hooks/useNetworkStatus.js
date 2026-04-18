import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Subscribes to network state changes.
 * Returns { isOnline, isOffline, wasOffline }
 *
 * wasOffline — true for one render cycle when the connection is restored,
 * so callers can trigger a sync/refetch exactly once on reconnect.
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const prevOnline = useRef(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);

      if (!prevOnline.current && online) {
        // Just came back online
        setWasOffline(true);
        setTimeout(() => setWasOffline(false), 100); // one-shot signal
      }

      prevOnline.current = online;
      setIsOnline(online);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      prevOnline.current = online;
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isOffline: !isOnline, wasOffline };
};
