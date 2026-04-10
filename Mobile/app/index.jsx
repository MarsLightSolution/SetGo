import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { IMAGE_BASE_URL } from '../config/api';
import { useFilters } from '../context/FilterContext';
import { useAuthStore } from '../Store/authStore';
import { useDispatch, useSelector } from 'react-redux';
import { like, unlike } from '../Store/wishSlice';
import logger from '../utils/logger';
import { useFeedProducts, useGalleryProducts, useShops } from '../hooks/useFeedQuery';
import { useQueryClient } from '@tanstack/react-query';
import { feedKeys } from '../hooks/useFeedQuery';

export default function HomeScreen() {
  const router = useRouter();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { filters, updateFilters } = useFilters();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Query hooks — cached, auto-refresh in background
  const {
    data: feedData,
    isPending: loading,
  } = useFeedProducts(filters);

  const { data: galleryData } = useGalleryProducts();
  const { data: shops = [], isPending: shopsLoading, isError: shopsError } = useShops();

  const latestAds = feedData?.products || [];
  const galleryAds = galleryData?.products || [];
  const pagination = {
    currentPage: feedData?.currentPage || 1,
    totalPages: feedData?.totalPages || 1,
    hasNextPage: feedData?.hasNextPage || false,
    hasPrevPage: feedData?.hasPrevPage || false,
  };

  // Chatbot animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkAuth();
  }, []);

  // Pull-to-refresh: invalidate all feed caches so queries re-fetch
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    setRefreshing(false);
  }, [queryClient]);

  // Chatbot button animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  const quickActions = [
    { icon: '🚗', label: 'Vehicles', category: 'Cars & Motorcycles' },
    { icon: '🏠', label: 'Property', category: 'Real Estate' },
    { icon: '📱', label: 'Electronics', category: 'Electronics' },
    { icon: '🛋️', label: 'Furniture', category: 'Household & Furniture' },
  ];

  // Get localized text helper
  const getLocalizedText = useCallback((field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.en || field.az || field.ru || '';
  }, []);


  const handleSearch = useCallback(() => {
    updateFilters({ searchQuery: searchText });
  }, [searchText, updateFilters]);

  const handleQuickAction = useCallback((category) => {
    updateFilters({ category });
  }, [updateFilters]);

  const getImageUrl = useCallback((product) => {
    if (product.image) return product.image;
    if (product.pictures && product.pictures.length > 0) {
      const picturePath = product.pictures[0].replace(/\\/g, '/');
      return `${IMAGE_BASE_URL}/${picturePath}`;
    }
    return 'https://via.placeholder.com/150';
  }, []);

  const handleChatbotPress = useCallback(() => {
    router.push('Chat/chatbot');
  }, [router]);

  // Ad Card Component
  const AdCard = ({ ad }) => {
    const imageUrl = getImageUrl(ad);
    const title = typeof ad.title === 'object' ? ad.title.en : ad.title;
    const description = typeof ad.description === 'object' ? ad.description.en : ad.description;

    const { wishlist } = useSelector((state) => state.wishlist);
    const isWishlisted = wishlist.some((item) => item._id === ad._id);
    const dispatch = useDispatch();

    const toggleWishlist = () => {
      if (!isAuthenticated) {
        Alert.alert(
          'Login Required',
          'Please login to add items to your wishlist',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/auth') },
          ]
        );
        return;
      }

      if (isWishlisted) {
        dispatch(unlike({ _id: ad._id }));
      } else {
        dispatch(like(ad));
      }
    };

    return (
      <TouchableOpacity
        style={styles.adCard}
        onPress={() => router.push(`/product/${ad._id}`)}
      >
        <TouchableOpacity style={styles.likeButton} onPress={toggleWishlist}>
          <Icon
            name="heart"
            size={20}
            color={isWishlisted ? '#EF4444' : '#D1D5DB'}
          />
        </TouchableOpacity>
        <View style={styles.adImage}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.adImageContent}
            resizeMode="cover"
          />
        </View>
        <View style={styles.adContent}>
          <Text style={styles.adTitle} numberOfLines={1}>
            {title || 'No title'}
          </Text>
          <Text style={styles.adDescription} numberOfLines={2}>
            {description || 'No description'}
          </Text>
          <View style={styles.adFooter}>
            <Text style={styles.adPrice}>₼ {ad.price || 0}</Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{ad.condition || 'Used'}</Text>
            </View>
          </View>
          <View style={styles.adMeta}>
            <View style={styles.seller}>
              <Icon name="user" size={12} color="#9CA3AF" />
              <Text style={styles.sellerText}>{ad.name || 'Unknown'}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(ad.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Shop Card Component
  const ShopCard = ({ shop }) => {
    const shopName = getLocalizedText(shop.shopName);
    const logoUri = shop.logo ? `${IMAGE_BASE_URL}${shop.logo}` : null;
    const bannerUri = shop.banner ? `${IMAGE_BASE_URL}${shop.banner}` : null;

    return (
      <TouchableOpacity
        style={styles.shopCard}
        onPress={() => router.push(`/shop/${shop.slug || shop._id}`)}
      >
        <View style={styles.shopBanner}>
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              style={styles.shopBannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.shopBannerPlaceholder} />
          )}
        </View>
        <View style={styles.shopContent}>
          <View style={styles.shopLogoContainer}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.shopLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.shopLogoPlaceholder}>
                <Icon name="shopping-bag" size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName}
          </Text>
          <Text style={styles.shopCategory} numberOfLines={1}>
            {shop.category || 'General'}
          </Text>
          <View style={styles.shopStats}>
            <View style={styles.shopStatItem}>
              <Icon name="package" size={12} color="#6B7280" />
              <Text style={styles.shopStatText}>
                {shop.totalProducts || 0} products
              </Text>
            </View>
            {shop.address?.city && (
              <Text style={styles.shopCity} numberOfLines={1}>
                {shop.address.city}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Shops Section Component - ALWAYS VISIBLE FOR DEBUGGING
  const ShopsSection = () => {
    // Debug info
    logger.log('ShopsSection render - loading:', shopsLoading, 'shops:', shops.length, 'error:', shopsError);

    return (
      <View style={styles.shopsSection}>
        {/* Header - Always show */}
        <View style={styles.shopsSectionHeader}>
          <View style={styles.shopsTitleRow}>
            <Icon name="shopping-bag" size={20} color="#008235" />
            <Text style={styles.shopsSectionTitle}>Featured Shops</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/shops')}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={16} color="#008235" />
          </TouchableOpacity>
        </View>

        {/* Content based on state */}
        {shopsLoading ? (
          <View style={styles.shopsLoading}>
            <ActivityIndicator size="small" color="#008235" />
            <Text style={styles.loadingText}>Loading shops...</Text>
          </View>
        ) : shopsError ? (
          <View style={styles.shopsError}>
            <Icon name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.errorText}>Failed to load shops</Text>
            <TouchableOpacity onPress={() => queryClient.invalidateQueries({ queryKey: feedKeys.shops() })} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : shops.length === 0 ? (
          <View style={styles.shopsEmpty}>
            <Icon name="shopping-bag" size={32} color="#D1D5DB" />
            <Text style={styles.emptyShopsText}>No shops available</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopsScrollContent}
          >
            {shops.map((shop) => (
              <ShopCard key={shop._id} shop={shop} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logo}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>S</Text>
              </View>
              <Text style={styles.logoName}>SETGO</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Icon name="bell" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/filters')}
              >
                <Icon name="filter" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for products, services..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText('');
                  updateFilters({ searchQuery: '' });
                }}
              >
                <Icon name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionItem}
              onPress={() => handleQuickAction(action.category)}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gallery Section */}
        {galleryAds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {galleryAds.map((ad) => (
                <TouchableOpacity
                  key={ad._id}
                  style={styles.galleryCard}
                  onPress={() => router.push(`/product/${ad._id}`)}
                >
                  <Image
                    source={{ uri: getImageUrl(ad) }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.galleryTitle} numberOfLines={1}>
                    {typeof ad.title === 'object' ? ad.title.en : ad.title}
                  </Text>
                  <Text style={styles.galleryPrice}>₼ {ad.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========== FEATURED SHOPS SECTION ========== */}
        <ShopsSection />
        {/* ========== END SHOPS SECTION ========== */}

        {/* Active Filters */}
        {(filters.category || filters.searchQuery || filters.condition) && (
          <View style={styles.filtersActive}>
            <Text style={styles.filtersTitle}>Active Filters:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.category && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{filters.category}</Text>
                  <TouchableOpacity onPress={() => updateFilters({ category: '' })}>
                    <Icon name="x" size={14} color="#008235" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.searchQuery && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>&quot;{filters.searchQuery}&quot;</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText('');
                      updateFilters({ searchQuery: '' });
                    }}
                  >
                    <Icon name="x" size={14} color="#008235" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* Latest Ads */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Ads</Text>
            <Text style={styles.sectionCount}>({latestAds.length} items)</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#008235" style={styles.loader} />
          ) : latestAds.length > 0 ? (
            <>
              <View style={styles.adsGrid}>
                {latestAds.map((ad) => (
                  <AdCard key={ad._id} ad={ad} />
                ))}
              </View>

              {/* Pagination */}
              <View style={styles.pagination}>
                <TouchableOpacity
                  disabled={!pagination.hasPrevPage}
                  onPress={() => fetchProducts(pagination.currentPage - 1)}
                  style={[
                    styles.paginationButton,
                    !pagination.hasPrevPage && styles.paginationButtonDisabled,
                  ]}
                >
                  <Icon
                    name="chevron-left"
                    size={20}
                    color={pagination.hasPrevPage ? '#008235' : '#D1D5DB'}
                  />
                  <Text
                    style={[
                      styles.paginationText,
                      !pagination.hasPrevPage && styles.paginationTextDisabled,
                    ]}
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text style={styles.paginationInfo}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </Text>

                <TouchableOpacity
                  disabled={!pagination.hasNextPage}
                  onPress={() => fetchProducts(pagination.currentPage + 1)}
                  style={[
                    styles.paginationButton,
                    !pagination.hasNextPage && styles.paginationButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.paginationText,
                      !pagination.hasNextPage && styles.paginationTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={pagination.hasNextPage ? '#008235' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Chatbot Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={handleChatbotPress}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.chatButtonGradient}>
            <Icon name="message-circle" size={28} color="#FFFFFF" />
            <View style={styles.chatBadge}>
              <View style={styles.chatBadgeDot} />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#008235',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#008235',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 28,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  galleryCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
  },
  galleryImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  galleryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  galleryPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#008235',
  },

  // Shops Section Styles
  shopsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  shopsScrollContent: {
    paddingRight: 16,
  },
  shopsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  shopsError: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#008235',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shopsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyShopsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#008235',
  },
  shopCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shopBanner: {
    width: '100%',
    height: 60,
  },
  shopBannerImage: {
    width: '100%',
    height: '100%',
  },
  shopBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#008235',
  },
  shopContent: {
    padding: 12,
    paddingTop: 0,
  },
  shopLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: -22,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#008235',
  },
  shopLogo: {
    width: '100%',
    height: '100%',
  },
  shopLogoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#008235',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  shopCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  shopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopStatText: {
    fontSize: 11,
    color: '#6B7280',
  },
  shopCity: {
    fontSize: 11,
    color: '#6B7280',
    maxWidth: 70,
  },

  // Filter styles
  filtersActive: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#DBEAFE',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: '#008235',
    fontWeight: '500',
  },

  // Ad card styles
  adsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  adCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  likeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
  },
  adImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  adImageContent: {
    width: '100%',
    height: '100%',
  },
  adContent: {
    padding: 12,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  adFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008235',
  },
  conditionBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
  },
  adMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  dateText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  paginationText: {
    fontSize: 14,
    color: '#008235',
    fontWeight: '500',
  },
  paginationTextDisabled: {
    color: '#D1D5DB',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Chatbot button styles
  floatingChatButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    zIndex: 999,
  },
  chatButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#008235',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#008235',
  },
  chatBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
});