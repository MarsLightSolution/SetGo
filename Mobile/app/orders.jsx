import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../Store/authStore';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useOrderQuery';

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders');

  const userId = user?.id || user?._id;
  const {
    data: txData,
    isFetching,
    isRefetching,
    refetch,
  } = useTransactions(userId, isAuthenticated && activeTab === 'transactions');

  const transactions = txData?.transactions || [];
  const walletBalance = txData?.walletBalance || 0;
  const totalCredit = txData?.totalCredit || 0;
  const totalDebit = txData?.totalDebit || 0;

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

  const onRefresh = () => {
    if (activeTab === 'transactions') refetch();
  };

  // IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('orders.title')}</Text>
        </View>

        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color="#D1D5DB" />
          <Text style={styles.authRequiredTitle}>{t('orders.loginRequired')}</Text>
          <Text style={styles.authRequiredText}>{t('orders.loginMessage')}</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginButtonText}>{t('common.goToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // IF AUTHENTICATED
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('orders.title')}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            {t('orders.tabOrders')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            {t('orders.tabTransactions')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'orders' ? (
          // ORDERS TAB
          orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t('orders.noOrders')}</Text>
              <Text style={styles.emptyText}>{t('orders.noOrdersSubtitle')}</Text>
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
                  <Text style={styles.viewButtonText}>{t('orders.viewDetails')}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#008235" />
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          // TRANSACTIONS TAB
          <>
            {isFetching && transactions.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#008235" />
                <Text style={styles.loadingText}>{t('orders.loadingTransactions')}</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>{t('orders.noTransactions')}</Text>
                <Text style={styles.emptyText}>{t('orders.noTransactionsSubtitle')}</Text>
              </View>
            ) : (
              <>
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                  <View style={[styles.statCard, styles.walletCard]}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statLabel}>{t('orders.walletBalance')}</Text>
                      <Ionicons name="wallet" size={20} color="#008235" />
                    </View>
                    <Text style={styles.statValue}>₼ {walletBalance.toFixed(2)}</Text>
                  </View>

                  <View style={[styles.statCard, styles.creditCard]}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statLabel}>{t('orders.totalCredited')}</Text>
                      <Ionicons name="trending-up" size={20} color="#10B981" />
                    </View>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                      ₼ {totalCredit.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.statCard, styles.debitCard]}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statLabel}>{t('orders.totalDebited')}</Text>
                      <Ionicons name="trending-down" size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>
                      ₼ {totalDebit.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.addMoneyButton}>
                    <Text style={styles.addMoneyButtonText}>{t('orders.addMoney')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.withdrawButton}>
                    <Text style={styles.withdrawButtonText}>{t('orders.withdraw')}</Text>
                  </TouchableOpacity>
                </View>

                {/* Transactions List */}
                <Text style={styles.sectionTitle}>{t('orders.recentTransactions')}</Text>
                {transactions.map((txn, index) => (
                  <View key={txn.transactionId} style={styles.transactionCard}>
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIndex}>
                        <Text style={styles.transactionIndexText}>{index + 1}</Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionAmount}>
                          ₼ {txn.amount.toFixed(2)}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(txn.createdAt).toLocaleDateString('en-GB')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transactionRight}>
                      <View
                        style={[
                          styles.directionBadge,
                          txn.direction.toLowerCase() === 'credit'
                            ? styles.creditBadge
                            : styles.debitBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.directionText,
                            txn.direction.toLowerCase() === 'credit'
                              ? styles.creditText
                              : styles.debitText,
                          ]}
                        >
                          {txn.direction.toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.txnStatusBadge}>
                        <Text style={styles.txnStatusText}>{txn.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
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
    backgroundColor: '#008235',
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
  authRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  authRequiredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  authRequiredText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#008235',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#008235',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
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
    textAlign: 'center',
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
    color: '#008235',
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
    color: '#008235',
  },
  statsContainer: {
    marginBottom: 16,
  },
  statCard: {
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
  walletCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#008235',
  },
  creditCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  debitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008235',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addMoneyButton: {
    flex: 1,
    backgroundColor: '#84CC16',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addMoneyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIndex: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIndexText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  transactionInfo: {
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  directionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditBadge: {
    backgroundColor: '#DCFCE7',
  },
  debitBadge: {
    backgroundColor: '#FEE2E2',
  },
  directionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  creditText: {
    color: '#16A34A',
  },
  debitText: {
    color: '#DC2626',
  },
  txnStatusBadge: {
    backgroundColor: '#008235',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  txnStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});