import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../Store/authStore';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '../hooks/useNotificationQuery';

const TYPE_ICON = {
  message:  { name: 'chatbubble',       color: '#3B82F6' },
  like:     { name: 'heart',            color: '#EC4899' },
  product:  { name: 'pricetag',         color: '#008235' },
  system:   { name: 'information-circle', color: '#6B7280' },
  comment:  { name: 'chatbox',          color: '#F59E0B' },
  follow:   { name: 'person-add',       color: '#8B5CF6' },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications(isAuthenticated);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const deleteNotif = useDeleteNotification();

  const handlePress = (item) => {
    if (!item.isRead) markRead.mutate(item._id);
    if (item.metadata?.productId) router.push(`/product/${item.metadata.productId}`);
    else if (item.metadata?.conversationId) router.push('/chat');
  };

  const renderItem = ({ item }) => {
    const iconCfg = TYPE_ICON[item.type] || TYPE_ICON.system;
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${iconCfg.color}15` }]}>
          <Ionicons name={iconCfg.name} size={22} color={iconCfg.color} />
          {!item.isRead && <View style={styles.dot} />}
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.message ? <Text style={styles.msg} numberOfLines={2}>{item.message}</Text> : null}
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteNotif.mutate(item._id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some((n) => !n.isRead) ? (
          <TouchableOpacity onPress={() => markAll.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#008235" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#008235" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMsg}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  markAllBtn: { paddingHorizontal: 4 },
  markAllText: { fontSize: 13, color: '#008235', fontWeight: '600' },
  list: { padding: 12, gap: 8 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  itemUnread: { backgroundColor: '#F0FFF4', borderLeftWidth: 3, borderLeftColor: '#008235' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dot: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#008235',
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  msg: { fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  deleteBtn: { justifyContent: 'center', paddingLeft: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyMsg: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});
