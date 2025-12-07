import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide tab bar on these routes
  const hiddenRoutes = ['/auth', '/filters'];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const isActive = (path) => pathname === path;

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/')}
      >
        <Ionicons
          name={isActive('/') ? 'home' : 'home-outline'}
          size={24}
          color={isActive('/') ? '#4ADE80' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Wishlist */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/wishlist')}
      >
        <Ionicons
          name={isActive('/wishlist') ? 'heart' : 'heart-outline'}
          size={24}
          color={isActive('/wishlist') ? '#4ADE80' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Post (Center) */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => router.push('/post')}
      >
        <View style={styles.centerButtonInner}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Orders */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/Chat/chat')}
      >
        <Ionicons
          name={isActive('/orders') ? 'receipt' : 'receipt-outline'}
          size={24}
          color={isActive('/orders') ? '#4ADE80' : '#9CA3AF'}
        />
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/profile')}
      >
        <Ionicons
          name={isActive('/profile') ? 'person' : 'person-outline'}
          size={24}
          color={isActive('/profile') ? '#4ADE80' : '#9CA3AF'}
        />
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