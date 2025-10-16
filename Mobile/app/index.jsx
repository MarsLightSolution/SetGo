import { useEffect, useState } from "react";
import { Animated } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Feather";
import { productService } from "../services/productService";
import { useFilters } from "../context/FilterContext";
import { API_BASE_URL } from "../config/api";
import { useAuthStore } from "../Store/authStore";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../Store/wishSlice";
// import { Platform, SafeAreaView, View, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function HomeScreen() {
  const router = useRouter();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const { filters, updateFilters } = useFilters();
  const [latestAds, setLatestAds] = useState([]);
  const [galleryAds, setGalleryAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAuth();
    fetchProducts();
    fetchGalleryProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { limit: 12, ...filters };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const data = await productService.getProducts(params);
      setLatestAds(data.products || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchGalleryProducts = async () => {
    try {
      const data = await productService.getPriorityProducts();
      setGalleryAds(data.products || []);
    } catch (err) {
      console.error("Gallery error:", err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    fetchGalleryProducts();
  };

  const handleSearch = () => {
    updateFilters({ searchQuery: searchText });
  };

  const getImageUrl = (product) => {
    if (product.image) return product.image;
    if (product.pictures && product.pictures.length > 0) {
      const picturePath = product.pictures[0].replace(/\\/g, "/");
      return `${API_BASE_URL}/${picturePath}`;
    }
    return "https://via.placeholder.com/150";
  };

  const AdCard = ({ ad }) => {
    const dispatch = useDispatch();
    const { wishlist } = useSelector((state) => state.wishlist);
    const isWishlisted = wishlist.some((item) => item._id === ad._id);

    const toggleWishlist = () => {
      if (isWishlisted) dispatch(unlike(ad._id));
      else dispatch(like(ad));
    };

    const title = typeof ad.title === "object" ? ad.title.en : ad.title;
    const description =
      typeof ad.description === "object" ? ad.description.en : ad.description;

    return (
      <TouchableOpacity
        style={styles.adCard}
        onPress={() => router.push(`/product/${ad._id}`)}
        activeOpacity={0.9}
      >
        <TouchableOpacity style={styles.likeButton} onPress={toggleWishlist}>
          <Icon
            name="heart"
            size={20}
            color={isWishlisted ? "#EF4444" : "#D1D5DB"}
          />
        </TouchableOpacity>

        <View style={styles.adImage}>
          <Image source={{ uri: getImageUrl(ad) }} style={styles.adImageContent} />
        </View>

        <View style={styles.adContent}>
          <Text style={styles.adTitle} numberOfLines={1}>
            {title || "No title"}
          </Text>
          <Text style={styles.adDescription} numberOfLines={2}>
            {description || "No description"}
          </Text>

          <View style={styles.adFooter}>
            <Text style={styles.adPrice}>₼ {ad.price || 0}</Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{ad.condition || "Used"}</Text>
            </View>
          </View>

          <View style={styles.adMeta}>
            <View style={styles.seller}>
              <Icon name="user" size={12} color="#9CA3AF" />
              <Text style={styles.sellerText}>{ad.name || "Unknown"}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(ad.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
      <SafeAreaView
      style={[
        styles.container,
        {
        paddingBottom:
  Platform.OS === "android"
    ? insets.bottom + (StatusBar.currentHeight || 0) + 30
    : insets.bottom + 10,

          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#008235"
        translucent={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
         contentContainerStyle={{
  paddingBottom:
    Platform.OS === "android"
      ? (insets.bottom || 20) + 120 // Enough space above Android system nav
      : insets.bottom + 80,
}}

          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            
          }
          stickyHeaderIndices={[0]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.logoRow}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoLetter}>S</Text>
                </View>
                <Text style={styles.logoText}>SATGOO</Text>
              </View>

              <TouchableOpacity style={styles.locationButton}>
                <Icon name="map-pin" size={14} color="#fff" />
                <Text style={styles.locationText}>Mumbai</Text>
                <Icon name="chevron-down" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for anything..."
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText("");
                      updateFilters({ searchQuery: "" });
                    }}
                  >
                    <Icon name="x" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Icon name="bell" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push("/filters")}
                >
                  <Icon name="sliders" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

{/* Quick Actions (Modern Look) */}
<View style={styles.quickActionsContainer}>
  {[
    { icon: "🚗", label: "Vehicles", color: "#00BFA5" },
    { icon: "🏠", label: "Property", color: "#FFB300" },
    { icon: "📱", label: "Mobiles", color: "#42A5F5" },
    { icon: "🛋️", label: "Furniture", color: "#8E24AA" },
    { icon: "👗", label: "Fashion", color: "#EC407A" },
    { icon: "🎮", label: "Gaming", color: "#7E57C2" },
    { icon: "🐶", label: "Pets", color: "#FF7043" },
    { icon: "➕", label: "More", color: "#9E9E9E" },
].map((item, index) => {
  const scale = new Animated.Value(1);
  const shadowOpacity = new Animated.Value(0.1);
  const bgColor = new Animated.Value(0);

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.95, friction: 3, tension: 80, useNativeDriver: true }),
      Animated.timing(shadowOpacity, { toValue: 0.25, duration: 100, useNativeDriver: false }),
      Animated.timing(bgColor, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
      Animated.timing(shadowOpacity, { toValue: 0.1, duration: 100, useNativeDriver: false }),
      Animated.timing(bgColor, { toValue: 0, duration: 100, useNativeDriver: false }),
    ]).start();
  };

   const interpolatedBg = bgColor.interpolate({
    inputRange: [0, 1],
    outputRange: ["#fff", "#F0FDF4"], // light green highlight
  });

    return (
      <Animated.View
      key={index}
      style={[
        styles.categoryCard,
        { transform: [{ scale }], shadowOpacity: shadowOpacity, backgroundColor: interpolatedBg },
      ]}
    >
        <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => updateFilters({ category: item.label })}
      >
             <View style={[styles.iconWrapper, { backgroundColor: item.color + "22" }]}>
          <Text style={[styles.categoryIcon, { color: item.color }]}>{item.icon}</Text>
        </View>
          <Text style={styles.categoryText}>{item.label}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  })}
</View>



          {/* Gallery */}
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
                  />
                  <Text style={styles.galleryTitle} numberOfLines={1}>
                    {typeof ad.title === "object" ? ad.title.en : ad.title}
                  </Text>
                  <Text style={styles.galleryPrice}>₼ {ad.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Latest Ads */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Ads</Text>
              <Text style={styles.sectionCount}>({latestAds.length})</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#008235" style={{ marginTop: 40 }} />
            ) : latestAds.length > 0 ? (
              <View style={styles.adsGrid}>
                {latestAds.map((ad) => (
                  <AdCard key={ad._id} ad={ad} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="inbox" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#008235",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#008235",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  logoLetter: { color: "#008235", fontWeight: "bold", fontSize: 20 },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "bold", letterSpacing: 0.5 },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  locationText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    justifyContent: "space-between",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    flex: 1,
    marginRight: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111", marginLeft: 8 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 8,
    borderRadius: 10,
  },
  quickActionsContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  paddingHorizontal: 18,
  marginTop: 18,
},
   
categoryCard: {
  width: "22%", // keep grid layout
  aspectRatio: 1, // make square
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#fff",
  borderRadius: 12, // slightly rounded corners
  marginBottom: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 5,
},
   iconWrapper: {
  width: "60%", // smaller than card to fit inside square nicely
  aspectRatio: 1, // square
  borderRadius: 8, // small rounding
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 6,
  backgroundColor: "#E5E7EB",
},
  categoryIcon: {
  fontSize: 28,
},

  categoryText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "500",
    textAlign: "center",
  },

quickActionItem: {
  width: "22%",
  alignItems: "center",
  marginBottom: 18,
  backgroundColor: "#fff",
  borderRadius: 16,
  paddingVertical: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},

quickActionIcon: {
  width: 60,
  height: 60,
  borderRadius: 30,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},

quickActionEmoji: {
  fontSize: 28,
},

quickActionLabel: {
  fontSize: 13,
  color: "#111827",
  textAlign: "center",
  fontWeight: "500",
},
  section: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  sectionCount: { fontSize: 14, color: "#6B7280" },
  galleryCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
  },
  galleryImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  galleryTitle: { fontSize: 12, fontWeight: "600", color: "#1F2937", marginBottom: 4 },
  galleryPrice: { fontSize: 14, fontWeight: "bold", color: "#008235" },
  adsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  adCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  likeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 6,
  },
  adImage: { width: "100%", height: 120, backgroundColor: "#F3F4F6" },
  adImageContent: { width: "100%", height: "100%" },
  adContent: { padding: 10 },
  adTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  adDescription: { fontSize: 11, color: "#6B7280", marginBottom: 8 },
  adFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  adPrice: { fontSize: 16, fontWeight: "bold", color: "#008235" },
  conditionBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  conditionText: { fontSize: 10, color: "#16A34A", fontWeight: "600" },
  adMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seller: { flexDirection: "row", alignItems: "center", gap: 4 },
  sellerText: { fontSize: 10, color: "#9CA3AF" },
  dateText: { fontSize: 10, color: "#9CA3AF" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});
