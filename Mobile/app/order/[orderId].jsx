// app/order/[orderId].jsx
// Shows the real payment state of an order: confirming (card payment waiting on the bank — the
// query refetches until it settles), paid, declined, refunded or cancelled.
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOrderDetail, useConfirmDelivery, useAddTracking } from '../../hooks/useOrderQuery';
import { useAuthStore } from '../../Store/authStore';
import { withErrorBoundary } from '../../Components/ErrorBoundary';

const textOf = (v, lang) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.en || v.az || v.ru || Object.values(v)[0] || '';
};

const money = (n) => `₼${(Number(n) || 0).toFixed(2)}`;

// Which header to show for an order.
function headerFor(order) {
  const ps = order?.paymentStatus;
  if (ps === 'processing') return { key: 'processing', icon: 'time-outline', color: '#f59e0b' };
  if (ps === 'failed') return { key: 'failed', icon: 'close-circle', color: '#ef4444' };
  if (ps === 'refunded') return { key: 'refunded', icon: 'return-down-back', color: '#3b82f6' };
  if (order?.status === 'cancelled') return { key: 'cancelled', icon: 'remove-circle', color: '#6b7280' };
  if (ps === 'completed') return { key: 'confirmed', icon: 'checkmark-circle', color: '#16a34a' };
  return { key: 'processing', icon: 'time-outline', color: '#f59e0b' };
}

const STATUS_COLORS = {
  completed: '#16a34a', paid: '#16a34a', delivered: '#16a34a', released: '#16a34a', shipped: '#3b82f6',
  processing: '#f59e0b', pending: '#f59e0b',
  failed: '#ef4444', cancelled: '#6b7280', refunded: '#3b82f6',
};

function OrderDetails() {
  const { orderId } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const { data: order, isLoading, isError, refetch, isRefetching } = useOrderDetail(orderId);
  const me = useAuthStore((s) => String(s.user?._id || s.user?.userId || ''));
  const confirmDelivery = useConfirmDelivery();
  const addTracking = useAddTracking();
  const [trackingInput, setTrackingInput] = useState('');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorText}>{t('orderDetail.loadError')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>{t('orderDetail.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const header = headerFor(order);
  const title = header.key === 'confirmed' ? t('orderDetail.confirmed') : t(`orderDetail.${header.key}Title`);
  const message = header.key === 'confirmed' ? t('orderDetail.successMessage') : t(`orderDetail.${header.key}Message`);
  const productTitle = textOf(order.product?.title, i18n.language);

  const rows = [
    productTitle && { label: t('orderDetail.product'), value: productTitle },
    { label: t('orderDetail.totalAmount'), value: money(order.total) },
    order.walletDeduction > 0 && order.onlineAmount > 0 && { label: t('orderDetail.walletPart'), value: money(order.walletDeduction) },
    order.onlineAmount > 0 && { label: t('orderDetail.cardPart'), value: money(order.onlineAmount) },
    order.transactionId && { label: t('orderDetail.transactionId'), value: order.transactionId },
    order.trackingId && { label: t('orderDetail.trackingId'), value: order.trackingId },
  ].filter(Boolean);

  // What the logged-in user can do next (backend enforces the same rules).
  const paid = order.paymentStatus === 'completed';
  const isBuyer = !!me && String(order.buyerId) === me;
  const isSeller = !!me && String(order.sellerId) === me;
  const canConfirm = isBuyer && paid && ['paid', 'shipped'].includes(order.status);
  const canShip = isSeller && paid && order.status === 'paid';
  const fail = (err) =>
    Alert.alert(t('orderDetail.actionFailed'), err?.response?.data?.message || err?.message || '');

  const onConfirmDelivery = () =>
    Alert.alert(t('orderDetail.confirmDeliveryTitle'), t('orderDetail.confirmDeliveryPrompt'), [
      { text: t('orderDetail.cancel'), style: 'cancel' },
      {
        text: t('orderDetail.confirm'),
        onPress: () =>
          confirmDelivery.mutate(
            { orderId: order.id || orderId, buyerId: me },
            { onSuccess: () => Alert.alert(t('orderDetail.confirmDeliveryDone')), onError: fail },
          ),
      },
    ]);

  const onMarkShipped = () => {
    const trackingId = trackingInput.trim();
    if (!trackingId) {
      Alert.alert(t('orderDetail.trackingRequired'));
      return;
    }
    addTracking.mutate(
      { orderId: order.id || orderId, trackingId },
      {
        onSuccess: () => {
          setTrackingInput('');
          Alert.alert(t('orderDetail.shippedDone'));
        },
        onError: fail,
      },
    );
  };

  const badge = (kind, value) => (
    <Text style={[styles.badge, { color: STATUS_COLORS[value] || '#374151' }]}>
      {t(`orderDetail.${kind}.${value}`, { defaultValue: value })}
    </Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />}
      >
        <View style={styles.headerCard}>
          {header.key === 'processing' ? (
            <ActivityIndicator size="large" color={header.color} style={styles.spinner} />
          ) : (
            <Ionicons name={header.icon} size={80} color={header.color} />
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.orderId}>{t('orderDetail.orderId', { id: orderId })}</Text>
          <Text style={styles.headerMessage}>{message}</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>{t('orderDetail.details')}</Text>
          {rows.map((r) => (
            <View key={r.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{r.label}</Text>
              <Text style={styles.detailValue} numberOfLines={2} selectable>{r.value}</Text>
            </View>
          ))}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('orderDetail.paymentStatus')}</Text>
            {badge('payment', order.paymentStatus)}
          </View>
          <View style={[styles.detailRow, styles.lastRow]}>
            <Text style={styles.detailLabel}>{t('orderDetail.orderStatus')}</Text>
            {badge('orderState', order.status)}
          </View>
        </View>

        {(canConfirm || canShip || (paid && order.status === 'paid' && isBuyer) || (isSeller && order.status === 'shipped')) && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>{t('orderDetail.actions')}</Text>
            {canShip && (
              <>
                <TextInput
                  style={styles.input}
                  value={trackingInput}
                  onChangeText={setTrackingInput}
                  placeholder={t('orderDetail.trackingPlaceholder')}
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={onMarkShipped}
                />
                <TouchableOpacity
                  style={[styles.actionBtn, addTracking.isPending && styles.actionBtnBusy]}
                  onPress={onMarkShipped}
                  disabled={addTracking.isPending}
                >
                  {addTracking.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.actionText}>{t('orderDetail.markShipped')}</Text>}
                </TouchableOpacity>
              </>
            )}
            {isBuyer && order.status === 'paid' && (
              <Text style={styles.hint}>{t('orderDetail.awaitingShipment')}</Text>
            )}
            {isSeller && order.status === 'shipped' && (
              <Text style={styles.hint}>{t('orderDetail.awaitingConfirmation')}</Text>
            )}
            {canConfirm && (
              <TouchableOpacity
                style={[styles.actionBtn, confirmDelivery.isPending && styles.actionBtnBusy]}
                onPress={onConfirmDelivery}
                disabled={confirmDelivery.isPending}
              >
                {confirmDelivery.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.actionText}>{t('orderDetail.confirmDelivery')}</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnBusy: { opacity: 0.7 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { color: '#6b7280', fontSize: 14, marginBottom: 8 },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  spinner: {
    marginVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  orderId: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  headerMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
    textAlign: 'right',
  },
  badge: {
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default withErrorBoundary(OrderDetails);
