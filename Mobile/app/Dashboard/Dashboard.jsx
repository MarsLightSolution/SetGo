import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../Store/authStore';
import { useUserAds } from '../../hooks/useUserQuery';
import { useTransactions } from '../../hooks/useOrderQuery';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;

  const { data: ads = [], isLoading: adsLoading } = useUserAds(userId);
  const { data: txData, isLoading: txLoading } = useTransactions(userId);

  const walletBalance = txData?.walletBalance || 0;
  const totalCredit = txData?.totalCredit || 0;
  const totalDebit = txData?.totalDebit || 0;

  const activeAds = ads.filter((a) => !a.sold && a.status !== 'sold').length;
  const soldAds = ads.filter((a) => a.sold || a.status === 'sold').length;

  const StatCard = useCallback(({ icon, label, value, color, bg, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  ), []);

  const isAdmin = user?.role === 'admin';

  const quickActions = [
    { icon: 'add-circle-outline',  label: 'Post Ad',        route: '/post',              color: '#008235' },
    { icon: 'storefront-outline',  label: 'My Ads',         route: '/UserInfo/Userinfo', color: '#3B82F6' },
    { icon: 'bag-outline',         label: 'Orders',         route: '/orders',            color: '#F59E0B' },
    { icon: 'chatbubble-outline',  label: 'Messages',       route: '/chat',              color: '#8B5CF6' },
    { icon: 'settings-outline',    label: 'Settings',       route: '/AccountManagement/Accountsetting', color: '#6B7280' },
    { icon: 'person-outline',      label: 'Profile',        route: '/profile',           color: '#EC4899' },
    ...(isAdmin ? [{ icon: 'bug-outline', label: 'Error Logs', route: '/admin/error-logs', color: '#EF4444' }] : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Welcome */}
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.name || user?.userName || 'User'} 👋
          </Text>
          <Text style={styles.welcomeSub}>Here's your activity overview</Text>
        </View>

        {/* Stats */}
        {adsLoading || txLoading ? (
          <ActivityIndicator size="large" color="#008235" style={{ marginTop: 24 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="wallet" label="Wallet" value={`₼ ${walletBalance.toFixed(2)}`} color="#008235" bg="#F0FFF4" onPress={() => router.push('/orders')} />
              <StatCard icon="trending-up" label="Credited" value={`₼ ${totalCredit.toFixed(2)}`} color="#10B981" bg="#ECFDF5" />
              <StatCard icon="pricetag" label="Active Ads" value={activeAds} color="#3B82F6" bg="#EFF6FF" onPress={() => router.push('/UserInfo/Userinfo')} />
              <StatCard icon="checkmark-circle" label="Sold" value={soldAds} color="#F59E0B" bg="#FFFBEB" />
            </View>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route)}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Ads */}
        {ads.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Ads</Text>
              <TouchableOpacity onPress={() => router.push('/UserInfo/Userinfo')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {ads.slice(0, 3).map((ad) => {
              const title = typeof ad.title === 'object' ? ad.title.en : ad.title;
              return (
                <TouchableOpacity
                  key={ad._id}
                  style={styles.adRow}
                  onPress={() => router.push(`/product/${ad._id}`)}
                >
                  <View style={styles.adInfo}>
                    <Text style={styles.adTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.adPrice}>₼ {ad.price?.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.adStatus, { backgroundColor: ad.sold ? '#FEF3C7' : '#DCFCE7' }]}>
                    <Text style={[styles.adStatusText, { color: ad.sold ? '#D97706' : '#16A34A' }]}>
                      {ad.sold ? 'Sold' : 'Active'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
          </>
        )}

      </ScrollView>
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
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  welcomeBox: {
    backgroundColor: '#008235',
    borderRadius: 14,
    padding: 20,
    marginBottom: 8,
  },
  welcomeText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  welcomeSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  viewAll: { fontSize: 13, color: '#008235', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '500', color: '#374151', textAlign: 'center' },
  adRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 6,
  },
  adInfo: { flex: 1 },
  adTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
  adPrice: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  adStatus: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  adStatusText: { fontSize: 12, fontWeight: '600' },
});
