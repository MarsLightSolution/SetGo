import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StatusBar,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { API_ENDPOINTS, IMAGE_BASE_URL } from '../../config/api';
import logger from '../../utils/logger';

const log = logger.create('Shops');

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function AllShopsScreen() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const categories = [
    'All',
    'Electronics',
    'Clothing & Fashion',
    'Home & Garden',
    'Vehicles',
    'Sports & Outdoors',
    'Books & Media',
    'Services',
    'General',
    'Other',
  ];

  // Get localized text helper
  const getLocalizedText = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.en || field.az || field.ru || '';
  };

  // Fetch shops
  const fetchShops = async (page = 1, search = '', category = '') => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      if (search) {
        params.append('search', search);
      }

      if (category && category !== 'All') {
        params.append('category', category);
      }

      const response = await fetch(
        `${API_ENDPOINTS.GET_SHOPS}?${params.toString()}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (data.success) {
        setShops(data.data || []);
        setPagination({
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
          hasNextPage: data.pagination?.hasNextPage || false,
          hasPrevPage: data.pagination?.hasPrevPage || false,
        });
      }
    } catch (error) {
      log.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops(1, searchText, selectedCategory);
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShops(1, searchText, selectedCategory);
  }, [searchText, selectedCategory]);

  const handleSearch = () => {
    fetchShops(1, searchText, selectedCategory);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === 'All' ? '' : category);
  };

  const handlePageChange = (newPage) => {
    fetchShops(newPage, searchText, selectedCategory);
  };

  // Shop Card Component
  const ShopCard = ({ shop }) => {
    const shopName = getLocalizedText(shop.shopName);
    const shopDescription = getLocalizedText(shop.description);

    const getShopLogo = () => {
      if (shop.logo) {
        return `${IMAGE_BASE_URL}${shop.logo}`;
      }
      return null;
    };

    const getShopBanner = () => {
      if (shop.banner) {
        return `${IMAGE_BASE_URL}${shop.banner}`;
      }
      return null;
    };

    return (
      <TouchableOpacity
        style={styles.shopCard}
        onPress={() => router.push(`/shop/${shop._id}`)}
        activeOpacity={0.8}
      >
        {/* Banner */}
        <View style={styles.shopBanner}>
          {getShopBanner() ? (
            <Image
              source={{ uri: getShopBanner() }}
              style={styles.shopBannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.shopBannerPlaceholder} />
          )}

          {/* Verified Badge */}
          {shop.isVerified && (
            <View style={styles.verifiedBadge}>
              <Icon name="check-circle" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.shopContent}>
          {/* Logo */}
          <View style={styles.shopLogoContainer}>
            {getShopLogo() ? (
              <Image
                source={{ uri: getShopLogo() }}
                style={styles.shopLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.shopLogoPlaceholder}>
                <Icon name="shopping-bag" size={24} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Shop Info */}
          <Text style={styles.shopName} numberOfLines={1}>
            {shopName}
          </Text>

          {/* Category Chip */}
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{shop.category || 'General'}</Text>
          </View>

          {/* Description */}
          {shopDescription && (
            <Text style={styles.shopDescription} numberOfLines={2}>
              {shopDescription}
            </Text>
          )}

          {/* Stats Row */}
          <View style={styles.shopStats}>
            <View style={styles.statItem}>
              <Icon name="package" size={12} color="#6B7280" />
              <Text style={styles.statText}>{shop.totalProducts || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="users" size={12} color="#6B7280" />
              <Text style={styles.statText}>{shop.followerCount || 0}</Text>
            </View>
            {shop.address?.city && (
              <View style={styles.statItem}>
                <Icon name="map-pin" size={12} color="#6B7280" />
                <Text style={styles.statText} numberOfLines={1}>
                  {shop.address.city}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Category Chip Component
  const CategoryChip = ({ category, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, isSelected && styles.filterChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  // Empty State Component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="shopping-bag" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Shops Found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Text>
      <TouchableOpacity
        style={styles.clearFiltersButton}
        onPress={() => {
          setSearchText('');
          setSelectedCategory('');
          fetchShops(1, '', '');
        }}
      >
        <Text style={styles.clearFiltersText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  // Header Component
  const ListHeader = () => (
    <View>
      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <CategoryChip
              category={item}
              isSelected={
                (item === 'All' && !selectedCategory) || item === selectedCategory
              }
              onPress={() => handleCategorySelect(item)}
            />
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {shops.length} shop{shops.length !== 1 ? 's' : ''} found
        </Text>
        {(searchText || selectedCategory) && (
          <TouchableOpacity
            onPress={() => {
              setSearchText('');
              setSelectedCategory('');
              fetchShops(1, '', '');
            }}
          >
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Footer Component (Pagination)
  const ListFooter = () => {
    if (shops.length === 0) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          disabled={!pagination.hasPrevPage}
          onPress={() => handlePageChange(pagination.currentPage - 1)}
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
          onPress={() => handlePageChange(pagination.currentPage + 1)}
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
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Shops</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shops..."
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
                fetchShops(1, '', selectedCategory);
              }}
            >
              <Icon name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading && shops.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008235" />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <ShopCard shop={item} />}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 32,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  categoriesSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoriesList: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#008235',
    borderColor: '#008235',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  clearText: {
    fontSize: 14,
    color: '#008235',
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shopCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopBanner: {
    width: '100%',
    height: 80,
    position: 'relative',
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
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    padding: 4,
  },
  shopContent: {
    padding: 12,
    paddingTop: 0,
  },
  shopLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -28,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '500',
  },
  shopDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  shopStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#008235',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
});