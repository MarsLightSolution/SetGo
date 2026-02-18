import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { IMAGE_BASE_URL } from '../../config/api';

/**
 * ShopBanner - Displays shop information banner on product detail
 * @param {object} shop - Shop data
 * @param {string} listingType - 'shop' or 'individual'
 */
const ShopBanner = React.memo(function ShopBanner({ shop, listingType }) {
  const router = useRouter();

  if (!shop || listingType !== 'shop') {
    return null;
  }

  const getLocalizedText = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.en || field.az || field.ru || '';
  };

  const handleShopPress = () => {
    router.push(`/shop/${shop.slug || shop._id}`);
  };

  const shopName = getLocalizedText(shop.shopName) || 'Shop';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleShopPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Shop Logo */}
        <View style={styles.logoContainer}>
          {shop.logo ? (
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${shop.logo}` }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="storefront" size={24} color="#fff" />
            </View>
          )}
        </View>

        {/* Shop Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shopName}
            </Text>
            {shop.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#1976d2" />
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.soldByText}>Sold by this shop</Text>
            {shop.category && (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.categoryText}>{shop.category}</Text>
              </>
            )}
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Text style={styles.visitText}>Visit Shop</Text>
          <Ionicons name="chevron-forward" size={18} color="#16a34a" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soldByText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '500',
  },
  dot: {
    fontSize: 13,
    color: '#9ca3af',
    marginHorizontal: 6,
  },
  categoryText: {
    fontSize: 13,
    color: '#6b7280',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
    marginRight: 4,
  },
});

export default ShopBanner;
