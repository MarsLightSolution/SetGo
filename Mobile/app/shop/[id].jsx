import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
    Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Feather';
import { API_ENDPOINTS, IMAGE_BASE_URL } from '../../config/api';
import { useAuthStore } from '../../Store/authStore';
import logger from '../../utils/logger';

const log = logger.create('ShopProfile');

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 48) / 2;

export default function ShopProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
  });

  // Get localized text helper
  const getLocalizedText = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.en || field.az || field.ru || '';
  };

  // Fetch shop details
  const fetchShop = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.GET_SHOP(id), {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.data) {
        setShop(data.data);
        setProducts(data.data.products || []);
        setFollowerCount(data.data.followerCount || 0);

        // Check if current user is following
        const userId = user?._id;
        if (userId && data.data.followers?.includes(userId)) {
          setIsFollowing(true);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Shop not found',
        });
        router.back();
      }
    } catch (error) {
      log.error('Error fetching shop:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load shop',
      });
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch shop products
  const fetchProducts = async (page = 1) => {
    if (!shop?._id) return;

    try {
      setProductsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      const response = await fetch(
        `${API_ENDPOINTS.SHOP_PRODUCTS(shop._id)}?${params}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setPagination({
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
        });
      }
    } catch (error) {
      log.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchShop();
    }
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShop();
  }, [id]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user) {
      Toast.show({
        type: 'info',
        text1: 'Please login first',
      });
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(
        API_ENDPOINTS.FOLLOW_SHOP(shop._id),
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Please login first',
        });
        router.push('/login');
        return;
      }

      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
        Toast.show({
          type: 'success',
          text1: data.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: data.message || 'Something went wrong',
        });
      }
    } catch (error) {
      log.error('Error following shop:', error);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      const shopName = getLocalizedText(shop?.shopName);
      await Share.share({
        message: `Check out ${shopName} on SetGo!`,
        url: API_ENDPOINTS.GET_SHOP(shop?.slug || shop?._id),
        title: shopName,
      });
    } catch (error) {
      log.error('Error sharing:', error);
    }
  };

  // Open social link
  const openSocialLink = (type, value) => {
    if (!value) return;

    let url = '';
    switch (type) {
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`;
        break;
      case 'facebook':
        url = value.startsWith('http') ? value : `https://facebook.com/${value}`;
        break;
      case 'telegram':
        url = `https://t.me/${value.replace('@', '')}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/${value.replace(/[^0-9]/g, '')}`;
        break;
      case 'website':
        url = value.startsWith('http') ? value : `https://${value}`;
        break;
      default:
        return;
    }

    Linking.openURL(url).catch((err) =>
      log.error('Error opening link:', err)
    );
  };

  // Product Card Component
  const ProductCard = ({ product }) => {
    const title = getLocalizedText(product.title);

    const getImageUrl = () => {
      if (product.pictures && product.pictures.length > 0) {
        const picturePath = product.pictures[0].replace(/\\/g, '/');
        return `${IMAGE_BASE_URL}/${picturePath}`;
      }
      return 'https://via.placeholder.com/150';
    };

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${product._id}`)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: getImageUrl() }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productContent}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {title || 'No title'}
          </Text>
          <Text style={styles.productPrice}>₼ {product.price || 0}</Text>
          {product.condition && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{product.condition}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008235" />
        <Text style={styles.loadingText}>Loading shop...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Shop not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shopName = getLocalizedText(shop.shopName);
  const shopDescription = getLocalizedText(shop.description);

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerSection}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.headerShareButton}
            onPress={handleShare}
          >
            <Icon name="share-2" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Banner Image */}
          {shop.banner ? (
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${shop.banner}` }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerPlaceholder} />
          )}
        </View>

        {/* Shop Info Card */}
        <View style={styles.shopInfoCard}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            {shop.logo ? (
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${shop.logo}` }}
                style={styles.logo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Icon name="shopping-bag" size={40} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Shop Name & Status */}
          <View style={styles.shopHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.shopName}>{shopName}</Text>
              {shop.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="check-circle" size={16} color="#1976D2" />
                </View>
              )}
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  shop.status === 'active'
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>{shop.status}</Text>
              </View>
              <Text style={styles.categoryText}>{shop.category}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{shop.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{shop.totalViews || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleFollow}
            >
              <Icon
                name={isFollowing ? 'heart' : 'heart'}
                size={18}
                color={isFollowing ? '#FFFFFF' : '#008235'}
              />
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Icon name="share-2" size={18} color="#6B7280" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {shopDescription && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{shopDescription}</Text>
            </View>
          )}

          {/* Contact Info */}
          <View style={styles.contactSection}>
            {shop.address?.city && (
              <View style={styles.contactItem}>
                <Icon name="map-pin" size={16} color="#6B7280" />
                <Text style={styles.contactText}>
                  {[shop.address.street, shop.address.city, shop.address.country]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            )}
            {shop.contactPhone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL(`tel:${shop.contactPhone}`)}
              >
                <Icon name="phone" size={16} color="#6B7280" />
                <Text style={[styles.contactText, styles.contactLink]}>
                  {shop.contactPhone}
                </Text>
              </TouchableOpacity>
            )}
            {shop.contactEmail && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL(`mailto:${shop.contactEmail}`)}
              >
                <Icon name="mail" size={16} color="#6B7280" />
                <Text style={[styles.contactText, styles.contactLink]}>
                  {shop.contactEmail}
                </Text>
              </TouchableOpacity>
            )}
            {shop.settings?.workingHours && (
              <View style={styles.contactItem}>
                <Icon name="clock" size={16} color="#6B7280" />
                <Text style={styles.contactText}>
                  {shop.settings.workingHours}
                </Text>
              </View>
            )}
          </View>

          {/* Social Links */}
          {(shop.socialLinks?.instagram ||
            shop.socialLinks?.facebook ||
            shop.socialLinks?.telegram ||
            shop.socialLinks?.whatsapp ||
            shop.socialLinks?.website) && (
            <View style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Social Links</Text>
              <View style={styles.socialButtons}>
                {shop.socialLinks?.instagram && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.instagramButton]}
                    onPress={() =>
                      openSocialLink('instagram', shop.socialLinks.instagram)
                    }
                  >
                    <Icon name="instagram" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {shop.socialLinks?.facebook && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.facebookButton]}
                    onPress={() =>
                      openSocialLink('facebook', shop.socialLinks.facebook)
                    }
                  >
                    <Icon name="facebook" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {shop.socialLinks?.telegram && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.telegramButton]}
                    onPress={() =>
                      openSocialLink('telegram', shop.socialLinks.telegram)
                    }
                  >
                    <Icon name="send" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {shop.socialLinks?.whatsapp && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.whatsappButton]}
                    onPress={() =>
                      openSocialLink('whatsapp', shop.socialLinks.whatsapp)
                    }
                  >
                    <Icon name="message-circle" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {shop.socialLinks?.website && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.websiteButton]}
                    onPress={() =>
                      openSocialLink('website', shop.socialLinks.website)
                    }
                  >
                    <Icon name="globe" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <Text style={styles.sectionTitle}>
              Products ({shop.totalProducts || 0})
            </Text>
          </View>

          {productsLoading ? (
            <ActivityIndicator
              size="small"
              color="#008235"
              style={styles.productsLoader}
            />
          ) : products.length > 0 ? (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyProducts}>
              <Icon name="package" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No products yet</Text>
            </View>
          )}

          {/* Load More */}
          {pagination.hasNextPage && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => fetchProducts(pagination.currentPage + 1)}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
              <Icon name="chevron-down" size={16} color="#008235" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#008235',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Banner Section
  bannerSection: {
    position: 'relative',
    height: 200,
  },
  headerBackButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  headerShareButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#008235',
  },

  // Shop Info Card
  shopInfoCard: {
    marginHorizontal: 16,
    marginTop: -40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -56,
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#008235',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopHeader: {
    alignItems: 'center',
    marginTop: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  verifiedBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    textTransform: 'capitalize',
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#008235',
  },
  followingButton: {
    backgroundColor: '#008235',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008235',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Description
  descriptionSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Contact
  contactSection: {
    marginTop: 20,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  contactLink: {
    color: '#008235',
  },

  // Social
  socialSection: {
    marginTop: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramButton: {
    backgroundColor: '#E1306C',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  telegramButton: {
    backgroundColor: '#0088CC',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  websiteButton: {
    backgroundColor: '#6B7280',
  },

  // Products Section
  productsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsLoader: {
    marginVertical: 40,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  productContent: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008235',
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  conditionText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '500',
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#008235',
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008235',
  },
});