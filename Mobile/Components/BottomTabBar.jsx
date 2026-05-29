import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../Store/authStore';
import { useUnreadCount } from '../hooks/useNotificationQuery';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: unreadCount = 0 } = useUnreadCount(isAuthenticated);

  const hiddenRoutes = ['/auth', '/filters'];
  if (hiddenRoutes.includes(pathname)) return null;

  const isActive = (path) => pathname === path;

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity style={styles.tab} onPress={() => router.push('/')}>
        <Ionicons
          name={isActive('/') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('/') ? '#4ADE80' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Wishlist */}
      <TouchableOpacity style={styles.tab} onPress={() => router.push('/wishlist')}>
        <Ionicons
          name={isActive('/wishlist') ? 'heart' : 'heart-outline'}
          size={24}
          color={isActive('/wishlist') ? '#4ADE80' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Post (Center) */}
      <TouchableOpacity style={styles.centerButton} onPress={() => router.push('/post')}>
        <View style={styles.centerButtonInner}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity style={styles.tab} onPress={() => router.push('/Chat/chat')}>
        <Ionicons
          name={isActive('/Chat/chat') ? 'chatbubble' : 'chatbubble-outline'}
          size={24}
          color={isActive('/Chat/chat') ? '#4ADE80' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Profile — with unread notification dot */}
      <TouchableOpacity style={styles.tab} onPress={() => router.push('/profile')}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isActive('/profile') ? 'person' : 'person-outline'}
            size={24}
            color={isActive('/profile') ? '#4ADE80' : '#9CA3AF'}
          />
          {unreadCount > 0 && <View style={styles.badge} />}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 85 : 65,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  centerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
