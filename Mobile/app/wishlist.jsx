import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../Store/authStore';
import { API_BASE_URL } from '../config/api';

export default function WishlistScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadWishlist = async () => {
    try {
      const wishlist = await AsyncStorage.getItem('wishlist');
      if (wishlist) {
        setWishlistItems(JSON.parse(wishlist));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const updatedWishlist = wishlistItems.filter(item => item._id !== productId);
      await AsyncStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      setWishlistItems(updatedWishlist);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setLoading(true);
    loadWishlist();
    setLoading(false);
  };

  const getImageUrl = (product) => {
    if (product.image) return product.image;
    if (product.pictures && product.pictures.length > 0) {
      const picturePath = product.pictures[0].replace(/\\/g, '/');
      return `${API_BASE_URL}/${picturePath}`;
    }
    return 'https://via.placeholder.com/150';
  };

  // IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>

        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color="#D1D5DB" />
          <Text style={styles.authRequiredTitle}>Login Required</Text>
          <Text style={styles.authRequiredText}>
            Please login to view and manage your wishlist
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('../(auth)')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // REST OF YOUR EXISTING WISHLIST CODE
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>{wishlistItems.length} items saved</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        {wishlistItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No items in wishlist</Text>
            <Text style={styles.emptyText}>
              Start adding items to your wishlist to see them here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          wishlistItems.map((item) => (
            <View key={item._id} style={styles.wishlistCard}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push(`/product/${item._id}`)}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: getImageUrl(item) }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {typeof item.title === 'object' ? item.title.en : item.title}
                  </Text>
                  <Text style={styles.productDescription} numberOfLines={2}>
                    {typeof item.description === 'object'
                      ? item.description.en
                      : item.description}
                  </Text>
                  <Text style={styles.productPrice}>₼ {item.price}</Text>
                  <Text style={styles.productCondition}>{item.condition || 'Used'}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item._id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Add these styles to your existing StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4ADE80',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#DCFCE7',
    fontSize: 14,
    marginTop: 4,
  },
  authRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  authRequiredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  authRequiredText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  browseButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  wishlistCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 112,
    height: 112,
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ADE80',
    marginBottom: 4,
  },
  productCondition: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
  },
});