import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  StatusBar,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { like, unlike } from '../../Store/wishSlice';
import { useAuthStore } from '../../Store/authStore';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '../../Components/SkeletonLoader';
import PaymentDialog from '../../Components/PaymentDialog';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const getLocalizedText = (field, lang = 'en') => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || '';
};

// Memoized Image Component
const ProductImage = React.memo(({ uri, style, resizeMode }) => (
  <Image
    source={{ uri }}
    style={style}
    resizeMode={resizeMode}
    progressiveRenderingEnabled
    fadeDuration={200}
  />
));

// Memoized Related Product Item
const RelatedProductItem = React.memo(({ item, onPress, displayPostalCode }) => (
  <TouchableOpacity style={styles.relatedItem} onPress={onPress}>
    <ProductImage
      uri={`${API_URL}/${item.pictures?.[0]?.replace(/\\/g, '/') || 'uploads/placeholder.jpg'}`}
      style={styles.relatedImage}
      resizeMode="cover"
    />
    <View style={styles.relatedInfo}>
      <Text style={styles.relatedTitle} numberOfLines={2}>
        {getLocalizedText(item.title)}
      </Text>
      <Text style={styles.relatedPrice}>₼ {item.price?.toLocaleString()}</Text>
      <View style={styles.relatedMeta}>
        <Ionicons name="location-outline" size={12} color="#6b7280" />
        <Text style={styles.relatedLocation}>
          {item.postalCode || displayPostalCode}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
));

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { wishlist } = useSelector((state) => state.wishlist);
  const { user, isAuthenticated, updateUser } = useAuthStore();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [error, setError] = useState(null);
  
  const isWishlisted = useMemo(
    () => wishlist.some((item) => item._id === product?._id),
    [wishlist, product?._id]
  );

  // Fetch product with optimization
  useEffect(() => {
    if (id) {
      fetchProductById();
    }
  }, [id]);

  const fetchProductById = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `${API_URL}/api/products/product/${id}?lang=en`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Failed to fetch product: ${res.status}`);
      }

      const result = await res.json();
      
      if (result.success === false || !result.data) {
        throw new Error(result.message || 'Product not found');
      }
      
      setProduct(result.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching product:', error);
      
      if (error.name === 'AbortError') {
        setError('Request timeout. Please check your connection.');
        Alert.alert('Error', 'Request timeout. Please try again.');
      } else {
        setError(error.message || 'Failed to load product');
        Alert.alert('Error', error.message || 'Failed to load product');
      }
      setProduct(null);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProductById(false);
  }, [fetchProductById]);

  // Fetch related products
  const fetchRelatedProducts = useCallback(async (categoryObj) => {
    const categoryName = getLocalizedText(categoryObj);
    if (!categoryName) return;

    try {
      const res = await fetch(
        `${API_URL}/api/products/category/${encodeURIComponent(categoryName)}?lang=en&limit=4`
      );
      const json = await res.json();
      const filtered = json.data?.filter((p) => p._id !== id).slice(0, 4);
      setRelatedProducts(filtered || []);
    } catch (err) {
      console.error('Failed to fetch related products', err);
    }
  }, [id]);

  useEffect(() => {
    if (product?.category) {
      setTimeout(() => fetchRelatedProducts(product.category), 100);
    }
  }, [product?.category, fetchRelatedProducts]);

  const ownerId = useMemo(
    () => product?.owner?._id || product?.owner || null,
    [product?.owner]
  );

  // Check follow status
  useEffect(() => {
    if (user && ownerId && user._id !== ownerId) {
      checkFollowStatus(user._id, ownerId);
    }
  }, [user, ownerId]);

  const checkFollowStatus = useCallback(async (followerId, followingId) => {
    try {
      const res = await fetch(`${API_URL}/check/${followerId}/${followingId}`);
      const data = await res.json();
      setIsFollowing(data?.isFollowing || false);
    } catch (err) {
      console.error('Error checking follow status', err);
    }
  }, []);

  // Refresh user data (wallet balance, etc.)
  const refreshUserData = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      const res = await fetch(`${API_URL}/user/${user._id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          // Update user in store with new wallet balance
          updateUser?.(data.user);
        }
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  }, [user?._id, updateUser]);

  // Memoized handlers
  const handleAddToWatchlist = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required', 
        'Please login to add items to your watchlist',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    if (isWishlisted) {
      dispatch(unlike(product));
      Alert.alert('Success', 'Removed from watchlist');
    } else {
      dispatch(like(product));
      Alert.alert('Success', 'Added to watchlist');
    }
  }, [isAuthenticated, isWishlisted, product, dispatch, router]);

  // Enhanced handleBuyNow with validation
  const handleBuyNow = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required', 
        'Please login to buy this product',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    // Validate product data
    if (!product) {
      Alert.alert('Error', 'Product information is not available');
      return;
    }

    const productOwnerId = product?.owner?._id || product?.owner;
    if (!productOwnerId) {
      Alert.alert('Error', 'Seller information is missing. Please try again later.');
      return;
    }

    // Check if user is trying to buy their own product
    if (user._id === productOwnerId) {
      Alert.alert('Notice', 'You cannot buy your own product');
      return;
    }

    // Validate product price
    if (!product.price || product.price <= 0) {
      Alert.alert('Error', 'Invalid product price');
      return;
    }

    // Open payment dialog
    setShowPaymentDialog(true);
  }, [isAuthenticated, product, user, router]);

  // Enhanced payment success handler
  const handlePaymentSuccess = useCallback(async (amount) => {
    console.log('Payment successful for amount:', amount);
    
    // Show success message
    Alert.alert(
      '🎉 Payment Successful!', 
      `Your payment of ₼${amount.toLocaleString()} has been processed successfully!\n\nYour order is being prepared.`,
      [
        { 
          text: 'OK',
          onPress: () => {
            // Refresh user data to get updated wallet balance
            refreshUserData();
          }
        }
      ]
    );

    // Close payment dialog
    setShowPaymentDialog(false);
    
    // Refresh product data
    setTimeout(() => {
      fetchProductById(false);
    }, 500);
  }, [refreshUserData, fetchProductById]);

  const handleSendMessage = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required', 
        'Please login to send messages',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    const productOwnerId = product?.owner?._id || product?.owner;
    if (!productOwnerId) {
      Alert.alert('Error', 'Owner information is missing');
      return;
    }

    if (user._id === productOwnerId) {
      Alert.alert('Notice', 'You cannot message yourself');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/chat/conversation/get-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user._id,
          receiverId: productOwnerId,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        Alert.alert('Error', data.message || 'Failed to start conversation');
        return;
      }

      const conversationId = data.conversation._id;

      await fetch(`${API_URL}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: user._id,
          text: `Hi! I'm interested in your product: ${getLocalizedText(product.title)}`,
        }),
      });

      router.push({
        pathname: '/chat',
        params: {
          conversationId,
          receiverUsername: product.owner?.username || productOwnerId
        }
      });
    } catch (err) {
      console.error('Error starting chat:', err);
      Alert.alert('Error', 'An error occurred while starting the conversation');
    }
  }, [isAuthenticated, product, user, router]);

  const handleFollowToggle = useCallback(async () => {
    if (!isAuthenticated || !ownerId) {
      Alert.alert(
        'Authentication Required', 
        'Please login to follow users',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    setFollowLoading(true);

    try {
      const endpoint = isFollowing
        ? `${API_URL}/unfollow/${ownerId}`
        : `${API_URL}/follow/${ownerId}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: user._id }),
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        await checkFollowStatus(user._id, ownerId);
        Alert.alert('Success', isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
      } else {
        Alert.alert('Error', result.message || 'Follow/Unfollow failed');
      }
    } catch (err) {
      console.error('Follow/Unfollow error:', err);
      Alert.alert('Error', 'An error occurred');
    } finally {
      setFollowLoading(false);
    }
  }, [isAuthenticated, ownerId, isFollowing, user, checkFollowStatus, router]);

  const handleShare = useCallback(async () => {
    try {
      const productTitle = getLocalizedText(product.title);
      const productUrl = `${API_URL}/products/product/${id}`;
      
      await Share.share({
        message: `Check out this product: ${productTitle}\nPrice: ₼${product.price?.toLocaleString()}\n\n${productUrl}`,
        title: productTitle,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [product, id]);

  const handleRelatedProductPress = useCallback((itemId) => {
    router.push(`/product/${itemId}`);
  }, [router]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>
          {error || 'Product not found'}
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.backButton, styles.retryButton]} 
          onPress={() => fetchProductById()}
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.backButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const ownerRawName = product.owner?.name || product.name;
  const ownerName =
    typeof ownerRawName === 'object'
      ? getLocalizedText(ownerRawName)
      : ownerRawName || 'Unknown Seller';
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const displayPostalCode =
    product.postalCode || product.location?.postalCode || 'Unknown Location';

  const isOwnProduct = user?._id === ownerId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
      >
        {/* Header with Back and Share */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            removeClippedSubviews={true}
          >
            {product.pictures?.length > 0 ? (
              product.pictures.map((pic, index) => (
                <ProductImage
                  key={index}
                  uri={`${API_URL}/${pic.replace(/\\/g, '/')}`}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ))
            ) : (
              <ProductImage
                uri={`${API_URL}/uploads/placeholder.jpg`}
                style={styles.productImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
          
          {product.pictures?.length > 1 && (
            <View style={styles.pagination}>
              {product.pictures.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentImageIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={styles.card}>
          <Text style={styles.title}>
            {getLocalizedText(product.title) || 'Product Title'}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₼ {product.price?.toLocaleString()}</Text>
            <Text style={styles.negotiable}>negotiable</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{displayPostalCode}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>
                {new Date(product.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{product.views || 0}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!isOwnProduct && (
          <View style={styles.card}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSendMessage}>
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Write a message</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.halfButton, isWishlisted && styles.halfButtonActive]}
                onPress={handleAddToWatchlist}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={20}
                  color={isWishlisted ? "#fff" : "#374151"}
                />
                <Text
                  style={[
                    styles.halfButtonText,
                    isWishlisted && styles.halfButtonTextActive,
                  ]}
                >
                  {isWishlisted ? 'Saved' : 'Watchlist'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.halfButton, styles.buyNowButton]} 
                onPress={handleBuyNow}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={[styles.halfButtonText, styles.buyNowButtonText]}>
                  Buy Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isOwnProduct && (
          <View style={styles.ownProductCard}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <Text style={styles.ownProductText}>This is your product</Text>
          </View>
        )}

        {/* Seller Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Information</Text>
          <View style={styles.sellerHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{ownerInitial}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{ownerName}</Text>
              <Text style={styles.sellerType}>Private user</Text>
              <View style={styles.sellerMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                <Text style={styles.sellerMetaText}>
                  Active since {new Date(product.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {!isOwnProduct && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.unfollowButton]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? "#ef4444" : "#16a34a"} />
              ) : (
                <Text
                  style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Specifications */}
        {(product.type || product.brand || product.size || product.color || product.condition) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Specifications</Text>
            <View style={styles.specsGrid}>
              {product.type && <SpecRow label="Type" value={product.type} />}
              {product.brand && <SpecRow label="Brand" value={product.brand} />}
              {product.size && <SpecRow label="Size" value={product.size} />}
              {product.color && <SpecRow label="Color" value={product.color} />}
              {product.condition && <SpecRow label="Condition" value={product.condition} />}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {getLocalizedText(product.description) || 'No description available'}
          </Text>
        </View>

        {/* Map for Native Platforms */}
        {Platform.OS !== 'web' && 
         product.location?.coordinates && 
         product.location.coordinates.length === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            {/* <MapView
              style={styles.map}
              initialRegion={{
                latitude: product.location.coordinates[1],
                longitude: product.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            > */}
              {/* <Marker
                coordinate={{
                  latitude: product.location.coordinates[1],
                  longitude: product.location.coordinates[0],
                }}
                title={getLocalizedText(product.title)}
              /> */}
            {/* </MapView> */}
          </View>
        )}

        {/* Map Placeholder for Web */}
        {Platform.OS === 'web' && 
         product.location?.coordinates && 
         product.location.coordinates.length === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={48} color="#6b7280" />
              <Text style={styles.mapPlaceholderText}>
                Map view available on mobile app
              </Text>
              <Text style={styles.mapCoordinates}>
                {displayPostalCode}
              </Text>
            </View>
          </View>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You might also like</Text>
            {relatedProducts.map((item) => (
              <RelatedProductItem
                key={item._id}
                item={item}
                onPress={() => handleRelatedProductPress(item._id)}
                displayPostalCode={displayPostalCode}
              />
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Payment Dialog Modal */}
      {showPaymentDialog && (
        <PaymentDialog
          isVisible={showPaymentDialog}
          product={product}
          user={user}
          onClose={() => setShowPaymentDialog(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const SpecRow = React.memo(({ label, value }) => (
  <View style={styles.specRow}>
    <Text style={styles.specLabel}>{label}</Text>
    <Text style={styles.specValue}>{value}</Text>
  </View>
));

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  imageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#fff',
    position: 'relative',
  },
  productImage: {
    width: width,
    height: 320,
    backgroundColor: '#f9fafb',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#16a34a',
    width: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#16a34a',
    marginRight: 8,
  },
  negotiable: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  halfButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  buyNowButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  halfButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  halfButtonTextActive: {
    color: '#fff',
  },
  buyNowButtonText: {
    color: '#fff',
  },
  ownProductCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  ownProductText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  sellerType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  sellerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerMetaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  followButton: {
    borderWidth: 1.5,
    borderColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  unfollowButton: {
    borderColor: '#ef4444',
  },
  followButtonText: {
    color: '#16a34a',
    fontSize: 15,
    fontWeight: '600',
  },
  unfollowButtonText: {
    color: '#ef4444',
  },
  specsGrid: {
    gap: 0,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  specValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  descriptionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  locationDisplay: {
    width: '100%',
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
    fontWeight: '500',
  },
  relatedItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  relatedImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  relatedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  relatedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 4,
  },
  relatedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
});