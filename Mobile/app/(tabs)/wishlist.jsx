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
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';

export default function WishlistScreen() {
  const router = useRouter();
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
    loadWishlist();
  }, []);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.headerSubtitle}>{wishlistItems.length} items saved</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {wishlistItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="heart" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No items in wishlist</Text>
            <Text style={styles.emptyText}>
              Start adding items to your wishlist to see them here
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/')}
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
                    {typeof item.description === 'object' ? item.description.en : item.description}
                  </Text>
                  <Text style={styles.productPrice}>₼ {item.price}</Text>
                  <Text style={styles.productCondition}>{item.condition || 'Used'}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item._id)}
              >
                <Icon name="trash-2" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
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