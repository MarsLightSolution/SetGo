// HomeScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Configure your API base here (example: "http://51.20.123.49")
const API_BASE = "http://51.20.123.49/api"; // <-- change to your server URL (no trailing slash)

const PLACEHOLDER = "https://via.placeholder.com/400x300?text=No+Image";

/**
 * Simple helper to build image URL coming from your backend pictures array
 */
const buildImageUrl = (product) => {
  if (!product) return PLACEHOLDER;
  if (product.image) return product.image;
  if (product.pictures && product.pictures.length > 0) {
    // adapt any backslash fix as needed
    return `${API_BASE}/${product.pictures[0].replace(/\\/g, "/")}`;
  }
  return PLACEHOLDER;
};

const ProductCard = ({ item, onToggleLike, liked }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      <View style={styles.cardImageWrap}>
        <Image
          source={{ uri: buildImageUrl(item) }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={() => onToggleLike(item._id)}
          style={styles.heartButton}
        >
          <Text style={{ color: liked ? "#e74c3c" : "#666", fontSize: 18 }}>
            {liked ? "♥" : "♡"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {typeof item.title === "object" ? item.title.en || "Untitled" : item.title || "Untitled"}
        </Text>
        <Text numberOfLines={2} style={styles.cardDesc}>
          {item.description || ""}
        </Text>

        <View style={styles.cardRow}>
          <Text style={styles.price}>₼ {item.price ?? "-"}</Text>
          <Text style={styles.date}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.smallText}>{item.condition ?? "—"}</Text>
          <Text style={styles.smallText}>👤 {item.name ?? "Unknown"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [products, setProducts] = useState([]); // all products fetched (we'll show as a list)
  const [gallery, setGallery] = useState([]); // priority / featured for horizontal gallery
  const [loading, setLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [likedMap, setLikedMap] = useState({}); // { productId: true }
  const [refreshing, setRefreshing] = useState(false);

  const PAGE_LIMIT = 12;

  useEffect(() => {
    loadLikesFromStorage();
    fetchProducts(page);
    fetchGallery();
  }, []);

  // fetch products (simple endpoint used as in your original code)
  const fetchProducts = async (pageToFetch = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: pageToFetch, limit: PAGE_LIMIT });
      const res = await fetch(`${API_BASE}/api/products/getProducts?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        console.warn("Failed to fetch products, using fallback");
        setProducts([]);
        return;
      }
      const json = await res.json();
      const fetched = json?.data?.products ?? [];
      // map to consistent fields if needed
      const mapped = fetched.map((p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        price: p.price,
        pictures: p.pictures,
        image: p.pictures?.[0] ? `${API_BASE}/${p.pictures[0].replace(/\\/g, "/")}` : undefined,
        condition: p.condition,
        name: p.name,
        createdAt: p.createdAt,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/priority`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        setGallery([]);
        return;
      }
      const json = await res.json();
      const fetched = json?.data?.products ?? [];
      const mapped = fetched.map((p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        price: p.price,
        pictures: p.pictures,
        image: p.pictures?.[0] ? `${API_BASE}/${p.pictures[0].replace(/\\/g, "/")}` : undefined,
        condition: p.condition,
        name: p.name,
        createdAt: p.createdAt,
      }));
      setGallery(mapped);
    } catch (err) {
      console.error("fetchGallery error:", err);
      setGallery([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  // Likes persisted locally
  const loadLikesFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem("likes_map");
      if (raw) setLikedMap(JSON.parse(raw));
    } catch (err) {
      console.error("loadLikesFromStorage", err);
    }
  };

  const saveLikesToStorage = async (map) => {
    try {
      await AsyncStorage.setItem("likes_map", JSON.stringify(map));
    } catch (err) {
      console.error("saveLikesToStorage", err);
    }
  };

  const toggleLike = (productId) => {
    setLikedMap((prev) => {
      const next = { ...prev, [productId]: !prev[productId] };
      saveLikesToStorage(next);
      return next;
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(1), fetchGallery()]);
    setRefreshing(false);
  };

  const renderProduct = ({ item }) => (
    <ProductCard item={item} onToggleLike={toggleLike} liked={!!likedMap[item._id]} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner */}
        <View style={styles.bannerWrap}>
          <Image
            source={{ uri: `${API_BASE}/images/banner1.png` }}
            style={styles.banner}
            resizeMode="cover"
            defaultSource={{ uri: PLACEHOLDER }}
          />
        </View>

        {/* Gallery + Controls */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.refreshBtn} onPress={fetchGallery}>
                <Text style={styles.refreshText}>{galleryLoading ? "…" : "Refresh"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 220 }}>
            {galleryLoading ? (
              <View style={styles.galleryLoading}>
                <ActivityIndicator size="small" />
              </View>
            ) : gallery.length === 0 ? (
              <View style={styles.galleryEmpty}>
                <Text style={styles.emptyText}>No gallery items</Text>
              </View>
            ) : (
              <FlatList
                data={gallery}
                keyExtractor={(i) => i._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                renderItem={({ item }) => (
                  <TouchableOpacity activeOpacity={0.9} style={styles.galleryCard}>
                    <Image
                      source={{ uri: buildImageUrl(item) }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.galleryInfo}>
                      <Text numberOfLines={1} style={styles.galleryTitle}>
                        {typeof item.title === "object" ? item.title.en || "Untitled" : item.title || "Untitled"}
                      </Text>
                      <Text style={styles.galleryPrice}>₼ {item.price ?? "-"}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>

        {/* Products list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(i) => i._id}
              renderItem={renderProduct}
              numColumns={2}
              columnWrapperStyle={styles.colWrap}
              contentContainerStyle={{ paddingBottom: 80 }}
              ListFooterComponent={() => (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page <= 1 && styles.disabledBtn]}
                    disabled={page <= 1}
                    onPress={() => {
                      const next = Math.max(1, page - 1);
                      setPage(next);
                      fetchProducts(next);
                    }}
                  >
                    <Text style={styles.pageBtnText}>Prev</Text>
                  </TouchableOpacity>

                  <Text style={{ marginHorizontal: 12 }}>Page {page}</Text>

                  <TouchableOpacity
                    style={styles.pageBtn}
                    onPress={() => {
                      const next = page + 1;
                      setPage(next);
                      fetchProducts(next);
                    }}
                  >
                    <Text style={styles.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: { flex: 1 },
  bannerWrap: { padding: 12 },
  banner: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  section: { marginTop: 10, paddingHorizontal: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerButtons: { flexDirection: "row", gap: 8 },
  refreshBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#10b981", borderRadius: 8 },
  refreshText: { color: "#fff", fontWeight: "600" },

  galleryCard: {
    width: width * 0.6,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  galleryImage: { width: "100%", height: 140 },
  galleryInfo: { padding: 8 },
  galleryTitle: { fontWeight: "600", fontSize: 14, color: "#111827" },
  galleryPrice: { marginTop: 4, color: "#16a34a", fontWeight: "700" },
  galleryLoading: { height: 180, justifyContent: "center", alignItems: "center" },
  galleryEmpty: { height: 180, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6b7280" },

  center: { padding: 20, alignItems: "center", justifyContent: "center" },

  // Product card
  colWrap: { justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 },
  card: {
    width: (width - 40) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardImageWrap: { height: 120, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center" },
  cardImage: { width: "100%", height: "100%" },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 20,
    elevation: 2,
  },
  cardBody: { padding: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  cardDesc: { fontSize: 11, color: "#6b7280", marginTop: 4, minHeight: 30 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  price: { color: "#16a34a", fontWeight: "800" },
  date: { color: "#9ca3af", fontSize: 11 },
  smallText: { color: "#6b7280", fontSize: 11 },

  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16 },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#e5e7eb" },
  disabledBtn: { opacity: 0.5 },
  pageBtnText: { color: "#111827", fontWeight: "600" },
});
