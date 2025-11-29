import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Pagination,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Verified as VerifiedIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import Footer from "../components/common/Footer";

const AllShops = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: "all", label: t("shop.allCategories") || "All Categories" },
    { value: "Electronics", label: t("home.category.electronics") || "Electronics" },
    { value: "Clothing & Fashion", label: t("home.category.clothingFashion") || "Clothing & Fashion" },
    { value: "Home & Garden", label: t("home.category.householdFurniture") || "Home & Garden" },
    { value: "Vehicles", label: t("home.category.carsMotorcycles") || "Vehicles" },
    { value: "Sports & Outdoors", label: t("home.category.leisureHobbyNeighborhood") || "Sports & Outdoors" },
    { value: "Books & Media", label: t("shop.booksMedia") || "Books & Media" },
    { value: "Services", label: t("home.category.service") || "Services" },
    { value: "General", label: t("shop.general") || "General" },
    { value: "Other", label: t("home.category.other") || "Other" },
  ];

  // Get localized text
  const getLocalizedText = (field) => {
    if (!field) return "";
    const lang = i18n.language || "en";
    return field[lang] || field.en || "";
  };

  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 12,
        });

        if (category !== "all") {
          params.append("category", category);
        }
        if (search.trim()) {
          params.append("search", search.trim());
        }

        const res = await fetch(
          `${import.meta.env.VITE_SERVER}/api/shops?${params}`,
          { method: "GET" }
        );
        const data = await res.json();

        if (data.success) {
          setShops(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [page, category, search]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setPage(1);
      }, 500)
    );
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Box className="min-h-screen bg-gray-50">
        {/* Header */}
        <Box className="bg-gradient-to-r from-green-600 to-green-500 py-8 px-4">
          <Box className="max-w-6xl mx-auto">
            <Typography variant="h4" className="text-white font-bold mb-2">
              {t("shop.browseShops") || "Browse Shops"}
            </Typography>
            <Typography variant="body1" className="text-green-100">
              {t("shop.discoverShops") || "Discover shops and find great products"}
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Box className="max-w-6xl mx-auto px-4 py-6">
          <Box className="flex flex-col sm:flex-row gap-4 mb-6">
            <TextField
              placeholder={t("shop.searchShops") || "Search shops..."}
              value={search}
              onChange={handleSearchChange}
              size="small"
              className="flex-1"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: "white" }}
            />
            <TextField
              select
              value={category}
              onChange={handleCategoryChange}
              size="small"
              sx={{ minWidth: 180, bgcolor: "white" }}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Loading */}
          {loading ? (
            <Box className="flex justify-center py-20">
              <CircularProgress color="success" />
            </Box>
          ) : shops.length === 0 ? (
            /* No shops */
            <Box className="text-center py-20">
              <StoreIcon sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
              <Typography variant="h6" className="text-gray-500">
                {t("shop.noShopsFound") || "No shops found"}
              </Typography>
              <Typography variant="body2" className="text-gray-400">
                {t("shop.tryDifferentSearch") || "Try different search or category"}
              </Typography>
            </Box>
          ) : (
            /* Shops Grid */
            <>
              <Grid container spacing={3}>
                {shops.map((shop) => (
                  <Grid item xs={12} sm={6} md={4} key={shop._id}>
                    <Card
                      className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/shop/${shop.slug}`)}
                    >
                      {/* Banner */}
                      <Box
                        className="h-28 bg-gradient-to-r from-green-500 to-green-400"
                        sx={{
                          backgroundImage: shop.banner
                            ? `url(${import.meta.env.VITE_SERVER}${shop.banner})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />

                      <CardContent className="relative pt-8">
                        {/* Logo */}
                        <Avatar
                          src={shop.logo ? `${import.meta.env.VITE_SERVER}${shop.logo}` : undefined}
                          sx={{
                            width: 64,
                            height: 64,
                            position: "absolute",
                            top: -32,
                            left: 16,
                            border: "3px solid white",
                            boxShadow: 1,
                            bgcolor: "#16a34a",
                          }}
                        >
                          <StoreIcon />
                        </Avatar>

                        {/* Shop Info */}
                        <Box className="ml-0 mt-4">
                          <Box className="flex items-center gap-1 flex-wrap">
                            <Typography variant="h6" className="font-semibold text-gray-800">
                              {getLocalizedText(shop.shopName)}
                            </Typography>
                            {shop.isVerified && (
                              <VerifiedIcon sx={{ color: "#1976d2", fontSize: 18 }} />
                            )}
                          </Box>

                          <Chip
                            label={shop.category}
                            size="small"
                            variant="outlined"
                            className="mt-1"
                          />

                          {/* Stats */}
                          <Box className="flex items-center gap-4 mt-3 text-gray-500">
                            <Box className="flex items-center gap-1">
                              <InventoryIcon fontSize="small" />
                              <Typography variant="body2">
                                {shop.totalProducts || 0} {t("shop.products") || "products"}
                              </Typography>
                            </Box>
                            {shop.address?.city && (
                              <Box className="flex items-center gap-1">
                                <LocationIcon fontSize="small" />
                                <Typography variant="body2">{shop.address.city}</Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Description */}
                          {getLocalizedText(shop.description) && (
                            <Typography
                              variant="body2"
                              className="text-gray-500 mt-2 line-clamp-2"
                            >
                              {getLocalizedText(shop.description)}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box className="flex justify-center mt-8">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default AllShops;