import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../Store/authStore';
import { getAuthToken } from '../services/secureAuthService';
import { API_ENDPOINTS } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('Checkout');

export default function CheckoutScreen() {
  const router = useRouter();
  const { productId, productTitle, price, sellerId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleConfirmOrder = async () => {
    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the terms before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          buyerId: user?._id,
          sellerId,
          amount: Number(price),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.replace(`/order/${data.data?._id || data.orderId}`);
      } else {
        Alert.alert('Error', data.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      log.error('Order error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Item</Text>
            <Text style={styles.value} numberOfLines={1}>{productTitle || 'Product'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.priceValue}>₼ {Number(price || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Buyer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || user?.userName || 'Guest'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '—'}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.paymentOption}>
            <Ionicons name="wallet-outline" size={22} color="#008235" />
            <Text style={styles.paymentText}>Wallet Balance</Text>
            <Ionicons name="checkmark-circle" size={20} color="#008235" style={styles.check} />
          </View>
        </View>

        {/* Terms */}
        <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed((v) => !v)}>
          <Ionicons
            name={agreed ? 'checkbox' : 'square-outline'}
            size={22}
            color={agreed ? '#008235' : '#9CA3AF'}
          />
          <Text style={styles.termsText}>
            I agree to the terms and conditions of this purchase
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₼ {Number(price || 0).toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, (!agreed || loading) && styles.confirmBtnDisabled]}
          onPress={handleConfirmOrder}
          disabled={!agreed || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.confirmText}>Confirm Order</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, color: '#6B7280' },
  value: { fontSize: 14, fontWeight: '500', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#008235' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  check: { marginLeft: 'auto' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },
  termsText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, color: '#6B7280' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  confirmBtn: {
    backgroundColor: '#008235',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#9CA3AF' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
