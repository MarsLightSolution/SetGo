import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState('orders');

  const orders = [
    {
      id: '1',
      title: 'iPhone 14 Pro',
      price: '₼ 85000',
      status: 'Delivered',
      date: '2025-09-28',
      statusColor: '#10B981',
    },
    {
      id: '2',
      title: 'Travel Bag',
      price: '₼ 899',
      status: 'In Transit',
      date: '2025-09-29',
      statusColor: '#3B82F6',
    },
    {
      id: '3',
      title: 'Bike',
      price: '₼ 5600',
      status: 'Processing',
      date: '2025-09-30',
      statusColor: '#F59E0B',
    },
  ];

  const transactions = [
    {
      id: '1',
      type: 'Purchase',
      amount: '₼ 85000',
      description: 'iPhone 14 Pro',
      date: '2025-09-28',
      icon: 'shopping-cart',
      color: '#EF4444',
    },
    {
      id: '2',
      type: 'Refund',
      amount: '₼ 1200',
      description: 'Order #12345 refund',
      date: '2025-09-25',
      icon: 'arrow-left-circle',
      color: '#10B981',
    },
    {
      id: '3',
      type: 'Sale',
      amount: '₼ 3500',
      description: 'Sold: Gaming Console',
      date: '2025-09-20',
      icon: 'dollar-sign',
      color: '#10B981',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders & Transactions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            My Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'orders' ? (
          orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="shopping-bag" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>Your orders will appear here</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderTitle}>{order.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${order.statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: order.statusColor }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderPrice}>{order.price}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Icon name="chevron-right" size={16} color="#4ADE80" />
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="credit-card" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptyText}>Your transaction history will appear here</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={[styles.transactionIcon, { backgroundColor: `${transaction.color}20` }]}>
                  <Icon name={transaction.icon} size={24} color={transaction.color} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: transaction.color }]}>
                  {transaction.amount}
                </Text>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4ADE80',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#4ADE80',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ADE80',
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});