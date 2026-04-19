// app/order/[orderId].js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOrderDetail } from '../../hooks/useOrderQuery';

export default function OrderDetails() {
  const { orderId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { data: order, isLoading } = useOrderDetail(orderId);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
          <Text style={styles.successTitle}>{t('orderDetail.confirmed')}</Text>
          <Text style={styles.orderId}>{t('orderDetail.orderId', { id: orderId })}</Text>
          <Text style={styles.successMessage}>{t('orderDetail.successMessage')}</Text>
        </View>
        
        {order && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>{t('orderDetail.details')}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('orderDetail.totalAmount')}</Text>
              <Text style={styles.detailValue}>₼{order.total}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('orderDetail.transactionId')}</Text>
              <Text style={styles.detailValue}>{order.transactionId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('orderDetail.status')}</Text>
              <Text style={styles.statusPaid}>{t('orderDetail.paid')}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  successCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  orderId: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  successMessage: {
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusPaid: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
});