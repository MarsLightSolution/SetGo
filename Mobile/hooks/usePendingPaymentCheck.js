// If the app was closed while a card payment was open or being confirmed, PaymentDialog leaves a
// "pendingPayment" marker in AsyncStorage. On the next launch (once logged in) we look up that
// order once and tell the buyer how it ended, so nobody is left wondering whether they paid.
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('PendingPayment');

export const PENDING_PAYMENT_KEY = 'pendingPayment';
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // stale markers are just dropped

export function usePendingPaymentCheck({ enabled, router }) {
  const { t } = useTranslation();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!enabled || checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      let pending;
      try {
        pending = JSON.parse((await AsyncStorage.getItem(PENDING_PAYMENT_KEY)) || 'null');
      } catch {
        pending = null;
      }
      if (!pending?.orderId) return;
      if (!pending.timestamp || Date.now() - pending.timestamp > MAX_AGE_MS) {
        await AsyncStorage.removeItem(PENDING_PAYMENT_KEY).catch(() => {});
        return;
      }

      try {
        const { data } = await api.get(API_ENDPOINTS.PAYMENT_ORDER(pending.orderId));
        const ps = data?.data?.order?.paymentStatus;
        // Still waiting on the bank: keep the marker so we check again next launch.
        if (ps !== 'processing') await AsyncStorage.removeItem(PENDING_PAYMENT_KEY).catch(() => {});

        const key = { completed: 'confirmed', failed: 'failedTitle', refunded: 'refundedTitle', processing: 'processingTitle' }[ps];
        if (!key) return;
        const title = t(`orderDetail.${key}`);
        const message = ps === 'completed' ? t('orderDetail.successMessage') : t(`orderDetail.${key.replace('Title', 'Message')}`);
        Alert.alert(title, message, [
          { text: 'OK', style: 'cancel' },
          { text: t('orderDetail.details'), onPress: () => router.push({ pathname: `/order/${pending.orderId}` }) },
        ]);
      } catch (err) {
        // 403/404: not this user's order (e.g. different account) — drop it.
        if ([403, 404].includes(err?.response?.status)) {
          await AsyncStorage.removeItem(PENDING_PAYMENT_KEY).catch(() => {});
        }
        log.warn('Pending payment check failed:', err?.message);
      }
    })();
  }, [enabled, router, t]);
}
