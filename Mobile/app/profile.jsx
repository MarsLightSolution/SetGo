import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../Store/authStore';
import { useTranslation } from 'react-i18next';
import { useUnreadCount } from '../hooks/useNotificationQuery';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { data: unreadCount = 0 } = useUnreadCount(isAuthenticated);

const handleLogout = () => {
  Alert.alert(
    t('profile.logoutConfirmTitle'),
    t('profile.logoutConfirmMessage'),
    [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logoutConfirmYes'),
        style: 'destructive',
        onPress: async () => {
          await logout(); // ✅ Clears tokens from secure storage on BOTH platforms
          router.replace('../auth');
        },
      },
    ],
    { cancelable: true }
  );
};

  const menuItems = [
    { icon: 'document-text-outline', label: t('profile.myAds'), color: '#DCFCE7', route: '/UserInfo/Userinfo' },
    { icon: 'heart-outline', label: t('profile.favorites'), color: '#FECACA', route: '/wishlist' },
    { icon: 'chatbubble-outline', label: t('profile.messages'), color: '#DBEAFE', route: '/Chat/chat' },
    { icon: 'settings-outline', label: t('profile.settings'), color: '#E9D5FF', route: '/AccountManagement/Accountsetting' },
    { icon: 'help-circle-outline', label: t('profile.helpSupport'), color: '#FED7AA', route: '/help' },
  ];

  // IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        <View style={styles.authRequired}>
          <Ionicons name="person-circle-outline" size={80} color="#D1D5DB" />
          <Text style={styles.authRequiredTitle}>{t('profile.welcomeTitle')}</Text>
          <Text style={styles.authRequiredText}>{t('profile.welcomeSubtitle')}</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('../auth')}
          >
            <Text style={styles.authButtonText}>{t('profile.loginSignup')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // IF AUTHENTICATED
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#008235" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.userName || user?.name || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'tiwariraj1202@gmail.com'}</Text>
            <Text style={styles.profileMember}>{t('profile.memberSince', { year: 2024 })}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => item.route && router.push(item.route)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={22} color="#1F2937" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('common.version')}</Text>
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
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bellBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#EF4444', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  authRequiredText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  authButton: {
    backgroundColor: '#008235',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#DCFCE7',
    fontSize: 14,
    marginBottom: 2,
  },
  profileMember: {
    color: '#DCFCE7',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 20,
  },
});