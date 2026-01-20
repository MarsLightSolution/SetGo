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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { like, unlike } from '../../Store/wishSlice';
import { useAuthStore } from '../../Store/authStore';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '../../Components/SkeletonLoader';
import PaymentDialog from '../../Components/PaymentDialog';
import logger from '../../utils/logger';

// New Components
import { ReviewSection } from '../../Components/reviews';
import { ShopBanner } from '../../Components/shop';
import { StockBadge } from '../../Components/product';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

const getLocalizedText = (field, lang = 'en') => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.en || '';
};

// Memoized Image Component
const ProductImage = React.memo(function ProductImage({ uri, style, resizeMode }) {
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      progressiveRenderingEnabled
      fadeDuration={200}
    />
  );
});

// Memoized Related Product Item
const RelatedProductItem = React.memo(function RelatedProductItem({ item, onPress, displayPostalCode }) {
  return (
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
  );
});

// Thumbnail Gallery Component
const ThumbnailGallery = React.memo(function ThumbnailGallery({ pictures, currentIndex, onSelect }) {
  if (!pictures || pictures.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.thumbnailContainer}
    >
      {pictures.map((pic, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={() => onSelect(idx)}
          style={[
            styles.thumbnail,
            currentIndex === idx && styles.thumbnailActive,
          ]}
        >
          <Image
            source={{ uri: `${API_URL}/${pic.replace(/\\/g, '/')}` }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

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
      logger.error('Error fetching product:', error);

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
      logger.error('Failed to fetch related products', err);
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
      logger.error('Error checking follow status', err);
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
          updateUser?.(data.user);
        }
      }
    } catch (err) {
      logger.error('Failed to refresh user data:', err);
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

    if (!product) {
      Alert.alert('Error', 'Product information is not available');
      return;
    }

    const productOwnerId = product?.owner?._id || product?.owner;
    if (!productOwnerId) {
      Alert.alert('Error', 'Seller information is missing. Please try again later.');
      return;
    }

    if (user._id === productOwnerId) {
      Alert.alert('Notice', 'You cannot buy your own product');
      return;
    }

    if (!product.price || product.price <= 0) {
      Alert.alert('Error', 'Invalid product price');
      return;
    }

    // Check stock
    if (product.quantity !== undefined && product.quantity <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    setShowPaymentDialog(true);
  }, [isAuthenticated, product, user, router]);

  // Enhanced payment success handler
  const handlePaymentSuccess = useCallback(async (amount) => {
    logger.log('Payment successful for amount:', amount);

    Alert.alert(
      '🎉 Payment Successful!',
      `Your payment of ₼${amount.toLocaleString()} has been processed successfully!\n\nYour order is being prepared.`,
      [
        {
          text: 'OK',
          onPress: () => {
            refreshUserData();
          }
        }
      ]
    );

    setShowPaymentDialog(false);

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
      logger.error('Error starting chat:', err);
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
      logger.error('Follow/Unfollow error:', err);
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
      logger.error('Error sharing:', error);
    }
  }, [product, id]);

  // Open location in maps
  const handleOpenMap = useCallback(() => {
    if (!product?.location?.coordinates || product.location.coordinates.length !== 2) {
      return;
    }

    const [longitude, latitude] = product.location.coordinates;
    const label = getLocalizedText(product.title) || 'Product Location';

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      }
    });
  }, [product]);

  const handleRelatedProductPress = useCallback((itemId) => {
    router.push(`/product/${itemId}`);
  }, [router]);

  const handleThumbnailSelect = useCallback((index) => {
    setCurrentImageIndex(index);
  }, []);

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
  const isShopProduct = product.listingType === 'shop' && product.shop;

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

        {/* Thumbnail Gallery */}
        <ThumbnailGallery
          pictures={product.pictures}
          currentIndex={currentImageIndex}
          onSelect={handleThumbnailSelect}
        />

        {/* Shop Banner - NEW */}
        {isShopProduct && (
          <View style={styles.shopBannerWrapper}>
            <ShopBanner shop={product.shop} listingType={product.listingType} />
          </View>
        )}

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
            {/* Shop Listing Badge */}
            {isShopProduct && (
              <View style={styles.metaItem}>
                <Ionicons name="storefront-outline" size={16} color="#16a34a" />
                <Text style={[styles.metaText, styles.shopBadgeText]}>Shop</Text>
              </View>
            )}
          </View>

          {/* Stock Badge - NEW */}
          {product.quantity !== undefined && (
            <StockBadge quantity={product.quantity} />
          )}
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
                style={[
                  styles.halfButton,
                  styles.buyNowButton,
                  product.quantity === 0 && styles.disabledButton,
                ]}
                onPress={handleBuyNow}
                disabled={product.quantity === 0}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={[styles.halfButtonText, styles.buyNowButtonText]}>
                  {product.quantity === 0 ? 'Out of Stock' : 'Buy Now'}
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
          <Text style={styles.cardTitle}>
            {isShopProduct ? 'Shop Information' : 'Seller Information'}
          </Text>
          <View style={styles.sellerHeader}>
            <View style={[styles.avatar, isShopProduct && styles.shopAvatar]}>
              {isShopProduct && product.shop?.logo ? (
                <Image
                  source={{ uri: `${API_URL}${product.shop.logo}` }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {isShopProduct ? <Ionicons name="storefront" size={22} color="#fff" /> : ownerInitial}
                </Text>
              )}
            </View>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>
                  {isShopProduct ? getLocalizedText(product.shop?.shopName) : ownerName}
                </Text>
                {isShopProduct && product.shop?.isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color="#1976d2" style={styles.verifiedIcon} />
                )}
              </View>
              <Text style={styles.sellerType}>
                {isShopProduct ? 'Verified Shop' : 'Private user'}
              </Text>
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

        {/* Location Section - Enhanced */}
        {product.location?.coordinates &&
         product.location.coordinates.length === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationDisplay}
              onPress={handleOpenMap}
              activeOpacity={0.8}
            >
              <View style={styles.locationIconContainer}>
                <Ionicons name="location" size={32} color="#16a34a" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{displayPostalCode}</Text>
                <Text style={styles.locationHint}>Tap to open in Maps</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Customer Reviews Section - NEW */}
        <ReviewSection
          productId={id}
          currentUserId={user?._id}
        />

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

const SpecRow = React.memo(function SpecRow({ label, value }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
});

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
  // Thumbnail Gallery
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#16a34a',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  // Shop Banner
  shopBannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginBottom: 12,
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
  shopBadgeText: {
    color: '#16a34a',
    fontWeight: '600',
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
  disabledButton: {
    backgroundColor: '#9ca3af',
    borderColor: '#9ca3af',
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
    overflow: 'hidden',
  },
  shopAvatar: {
    backgroundColor: '#16a34a',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedIcon: {
    marginLeft: 6,
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
  // Enhanced Location
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationHint: {
    fontSize: 13,
    color: '#6b7280',
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
