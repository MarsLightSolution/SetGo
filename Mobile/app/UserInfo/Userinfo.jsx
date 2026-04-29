import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getAuthToken, getUserId, getUserData } from '../../services/secureAuthService';
import { useUserAds } from '../../hooks/useUserQuery';
import { API_ENDPOINTS, IMAGE_BASE_URL } from '../../config/api';

const { width } = Dimensions.get('window');

const getImageUrl = (path) => {
  if (!path) return '';
  const normalizedPath = path.replace(/\\/g, '/');
  return `${IMAGE_BASE_URL}/${normalizedPath}`;
};

// ==================== API SERVICE ====================
const ApiService = {
  getHeaders: async () => {
    const token = await getAuthToken();
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  },

  toggleAdStatus: async (id) => {
    const headers = await ApiService.getHeaders();
    const res = await fetch(API_ENDPOINTS.MARK_SOLD(id), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) throw Object.assign(new Error('Failed'), { status: res.status });
  },

  boostAd: async (id) => {
    const headers = await ApiService.getHeaders();
    const res = await fetch(API_ENDPOINTS.UPDATE_PRIORITY(id), {
      method: 'PUT',
      headers,
      body: JSON.stringify({}),
    });
    if (!res.ok) throw Object.assign(new Error('Failed'), { status: res.status });
  },

  deleteAd: async (id) => {
    const headers = await ApiService.getHeaders();
    const res = await fetch(API_ENDPOINTS.DELETE_PRODUCT(id), {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw Object.assign(new Error('Failed'), { status: res.status });
  },
};

// ==================== UTILITY FUNCTIONS ====================
const getLocalizedText = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || field.az || field.ru || '';
};

const getInitials = (name) => {
  if (!name) return 'NA';
  const words = name.split(' ');
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

// ==================== CUSTOM HEADER COMPONENT ====================
const CustomHeader = ({ userName, onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Icon name="arrow-left" size={20} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>{userName}</Text>
      </View>
      <View style={styles.headerRight} />
    </View>
  );
};

// ==================== CONFIRMATION DIALOG ====================
const ConfirmDialog = ({ visible, onConfirm, onCancel, action, adIsSellStatus }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const config = {
    boost: {
      title: 'Boost Your Ad',
      message: 'Boost this ad for better visibility and reach more potential buyers.',
      confirmText: 'Boost Now',
      icon: 'rocket',
      color: '#2563eb',
    },
    pause: adIsSellStatus
      ? {
          title: 'Resume Listing',
          message: 'Your ad will be visible again and buyers can contact you.',
          confirmText: 'Resume',
          icon: 'play',
          color: '#16a34a',
        }
      : {
          title: 'Pause Listing',
          message: 'Your ad will be hidden temporarily. You can resume it anytime.',
          confirmText: 'Pause',
          icon: 'pause',
          color: '#ca8a04',
        },
    delete: {
      title: 'Delete Ad',
      message: 'This action is permanent. Are you sure you want to delete this ad?',
      confirmText: 'Delete',
      icon: 'trash',
      color: '#dc2626',
    },
  }[action];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={[styles.modalIconContainer, { backgroundColor: `${config.color}15` }]}>
            <Icon name={config.icon} size={32} color={config.color} />
          </View>
          <Text style={styles.modalTitle}>{config.title}</Text>
          <Text style={styles.modalMessage}>{config.message}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: config.color }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{config.confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ==================== PROFILE CARD ====================
const ProfileCard = ({ userName, adsCount, userCreatedAt }) => {
  return (
    <View style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Icon name="check" size={10} color="#fff" />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileAdsCount}>
            {adsCount} {adsCount === 1 ? 'ad' : 'ads'} available
          </Text>
        </View>
      </View>

      <View style={styles.profileStats}>
        <View style={styles.statItem}>
          <Icon name="calendar" size={16} color="#6b7280" />
          <Text style={styles.statText}>Member since {formatDate(userCreatedAt)}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="shield" size={16} color="#16a34a" />
          <Text style={styles.statTextGreen}>Verified Account</Text>
        </View>
      </View>
    </View>
  );
};

// ==================== AD CARD ====================
const AdCard = ({
  ad,
  onEdit,
  onPause,
  onBoost,
  onDelete,
  onPreview,
  expandedAdId,
  onToggleExpand,
}) => {
  const displayTitle = getLocalizedText(ad.title) || 'Untitled Product';
  const displayDescription = getLocalizedText(ad.description) || 'No description';
  const isExpanded = expandedAdId === ad._id;

  return (
    <TouchableOpacity
      style={styles.adCard}
      onPress={() => onPreview(ad._id)}
      activeOpacity={0.9}
    >
      {ad.priority && (
        <View style={styles.priorityBadge}>
          <Icon name="star" size={12} color="#fff" />
          <Text style={styles.priorityText}>Boosted</Text>
        </View>
      )}

      <View style={styles.imageContainer}>
        {ad.pictures?.[0] ? (
          <Image
            source={{ uri: getImageUrl(ad.pictures[0]) }}
            style={styles.adImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Icon name="image" size={40} color="#d1d5db" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        
        {/* Overlay only on image, not the whole card */}
        {ad.isSell && (
          <View style={styles.pausedImageOverlay}>
            <View style={styles.pausedBadge}>
              <Icon name="pause" size={12} color="#fff" />
              <Text style={styles.pausedText}>Paused</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.adContent}>
        <Text style={styles.adTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        <Text style={styles.adDescription} numberOfLines={isExpanded ? undefined : 2}>
          {displayDescription}
        </Text>
        {displayDescription.length > 60 && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleExpand(ad._id);
            }}
          >
            <Text style={styles.showMoreText}>
              {isExpanded ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.adPrice}>{ad.price} ₼</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit(ad._id);
            }}
          >
            <Icon name="edit" size={16} color="#16a34a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton, 
              ad.isSell && styles.actionButtonHighlight
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onPause(ad._id);
            }}
          >
            <Icon
              name={ad.isSell ? 'play' : 'pause'}
              size={16}
              color={ad.isSell ? '#16a34a' : '#ca8a04'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, ad.priority && styles.actionButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              if (!ad.priority) onBoost(ad._id);
            }}
            disabled={ad.priority}
          >
            <Icon name="rocket" size={16} color={ad.priority ? '#d1d5db' : '#2563eb'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(ad._id);
            }}
          >
            <Icon name="trash" size={16} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ==================== EMPTY STATE ====================
const EmptyState = ({ onPlaceAd }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Icon name="inbox" size={64} color="#d1d5db" />
    </View>
    <Text style={styles.emptyTitle}>No Ads Yet</Text>
    <Text style={styles.emptyText}>Start selling by creating your first ad</Text>
    <TouchableOpacity style={styles.placeAdButton} onPress={onPlaceAd}>
      <Icon name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.placeAdButtonText}>Create New Ad</Text>
    </TouchableOpacity>
  </View>
);

// ==================== MAIN COMPONENT ====================
export default function UserProfile() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [expandedAdId, setExpandedAdId] = useState(null);
  const [confirmAdId, setConfirmAdId] = useState(null);
  const [confirmAction, setConfirmAction] = useState('pause');
  const [userName, setUserName] = useState('');
  const [userCreatedAt, setUserCreatedAt] = useState('');
  const scrollViewRef = useRef(null);

  const {
    data: ads = [],
    isLoading: loading,
    refetch: refetchAds,
    error: adsError,
  } = useUserAds(userId);

  useEffect(() => {
    const init = async () => {
      try {
        const [id, userData] = await Promise.all([getUserId(), getUserData()]);
        setUserId(id || null);
        setUserName(userData?.userName || userData?.name || 'User');
        setUserCreatedAt(userData?.createdAt || new Date().toISOString());
        if (!id) {
          Alert.alert('Authentication Required', 'Please log in to view your ads.');
        }
      } catch {
        // silent
      }
    };
    init();
  }, []);

  // Show auth error from hook
  useEffect(() => {
    if (adsError) {
      if (adsError.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: () => router.replace('/auth') },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load ads. Please try again.');
      }
    }
  }, [adsError]);

  const handleAction = async (id, action, actionFn, successMessage) => {
    try {
      await actionFn(id);
      await refetchAds();
      Alert.alert('Success', successMessage);
    } catch (err) {
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: () => router.replace('/auth') },
        ]);
      } else {
        Alert.alert('Error', `Failed to ${action}. Please try again.`);
      }
    } finally {
      setConfirmAdId(null);
    }
  };

  const pauseAd = (id) => {
    const ad = ads.find((a) => a._id === id);
    const message = ad?.isSell ? 'Ad resumed!' : 'Ad paused!';
    handleAction(id, 'update status', ApiService.toggleAdStatus, message);
  };

  const boostAd = (id) => 
    handleAction(id, 'boost', ApiService.boostAd, 'Ad boosted successfully!');

  const deleteAd = (id) => 
    handleAction(id, 'delete', ApiService.deleteAd, 'Ad deleted successfully!');

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <CustomHeader userName={userName} onBack={() => router.back()} />

      <ConfirmDialog
        visible={confirmAdId !== null}
        onConfirm={() => {
          if (confirmAction === 'boost') boostAd(confirmAdId);
          else if (confirmAction === 'pause') pauseAd(confirmAdId);
          else deleteAd(confirmAdId);
        }}
        onCancel={() => setConfirmAdId(null)}
        action={confirmAction}
        adIsSellStatus={ads.find((ad) => ad._id === confirmAdId)?.isSell || false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileCard
          userName={userName}
          adsCount={ads.length}
          userCreatedAt={userCreatedAt}
        />

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/wishlist')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
              <Icon name="heart" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.quickActionLabel}>Favourites</Text>
            <Icon name="angle-right" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.quickActionDivider} />

          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => router.push('/Chat/chat')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
              <Icon name="comments" size={20} color="#16a34a" />
            </View>
            <Text style={styles.quickActionLabel}>Messages</Text>
            <Icon name="angle-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.adsSection}>
          <View style={styles.adsSectionHeader}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            {ads.length > 0 && (
              <Text style={styles.sectionSubtitle}>{ads.length} active</Text>
            )}
          </View>

          {ads.length === 0 ? (
            <EmptyState onPlaceAd={() => router.push('/post')} />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.adsScrollContent}
            >
              {ads.map((ad) => (
                <AdCard
                  key={ad._id}
                  ad={ad}
                  onEdit={(id) => router.push(`/UserInfo/EditForm?id=${id}`)}
                  onPause={(id) => {
                    setConfirmAction('pause');
                    setConfirmAdId(id);
                  }}
                  onBoost={(id) => {
                    setConfirmAction('boost');
                    setConfirmAdId(id);
                  }}
                  onDelete={(id) => {
                    setConfirmAction('delete');
                    setConfirmAdId(id);
                  }}
                  onPreview={(id) => router.push(`/product/${id}`)}
                  expandedAdId={expandedAdId}
                  onToggleExpand={(id) => setExpandedAdId(expandedAdId === id ? null : id)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },

  // Profile Card Styles
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4b5563',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileAdsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  profileStats: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statTextGreen: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },

  // Quick Actions
  quickActions: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  quickActionDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
  },

  // Ads Section
  adsSection: {
    marginTop: 24,
  },
  adsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  adsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Ad Card Styles
  adCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    opacity: 1, // Always fully visible
  },
  priorityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    gap: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none', // CRITICAL: Allow clicks to pass through
  },
  pausedImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ca8a04',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pausedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    height: 180,
    backgroundColor: '#f3f4f6',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    color: '#9ca3af',
    fontSize: 13,
  },
  adContent: {
    padding: 16,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  adDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  showMoreText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 4,
  },
  adPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  actionButtonHighlight: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  actionButtonDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.5,
  },

  // Empty State Styles
  emptyState: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  placeAdButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  placeAdButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: width - 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});