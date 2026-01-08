import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Chip,
  Avatar,
  Pagination,
  IconButton,
} from "@mui/material";
import {
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  Inventory as InventoryIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Language as WebsiteIcon,
  Telegram as TelegramIcon,
  WhatsApp as WhatsAppIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import Footer from "../components/common/Footer";

const ShopProfile = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get localized text - handles multilingual objects
  const getLocalizedText = (field) => {
    if (!field) return "";
    if (typeof field === "string") return field;
    const lang = i18n.language || "en";
    return field[lang] || field.en || "";
  };

  // Fetch shop details
  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER}/api/shops/${id}`,
          { method: "GET", credentials: "include" }
        );

        console.log("ShopProfile fetch response status:", res.status);

        if (!res.ok) {
          console.log("Shop not found, redirecting...");
          navigate("/shops");
          return;
        }

        const data = await res.json();
        console.log("ShopProfile data:", data);

        if (data.success && data.data) {
          setShop(data.data);
          setProducts(data.data.products || []);
          setFollowerCount(data.data.followerCount || 0);

          // Check if current user is following
          const userId = localStorage.getItem("userId");
          if (userId && data.data.followers?.includes(userId)) {
            setIsFollowing(true);
          }
        } else {
          navigate("/shops");
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
        navigate("/shops");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShop();
    }
  }, [id, navigate]);

  // Fetch shop products with pagination
  const fetchProducts = async (pageNum = 1) => {
    if (!shop?._id) return;

    setProductsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 12,
        lang: i18n.language || "en",
      });

      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/shops/${shop._id}/products?${params}`,
        { method: "GET" }
      );
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch products when shop is loaded
  useEffect(() => {
    if (shop?._id) {
      fetchProducts(page);
    }
  }, [shop?._id, page]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/shops/${shop._id}/follow`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (res.status === 401) {
        showErrorToast(t("common.pleaseLogin") || "Please login first");
        navigate("/login");
        return;
      }

      const data = await res.json();

      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
        showSuccessToast(data.message);
      } else {
        showErrorToast(data.message);
      }
    } catch (error) {
      console.error("Error following shop:", error);
      showErrorToast(t("common.error") || "Something went wrong");
    }
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: getLocalizedText(shop?.shopName),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccessToast(t("common.linkCopied") || "Link copied to clipboard");
    }
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    fetchProducts(value);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  // Loading state
  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <Typography>Shop not found</Typography>
      </Box>
    );
  }

  // Get display values
  const shopName = getLocalizedText(shop.shopName);
  const shopDescription = getLocalizedText(shop.description);

  return (
    <>
      <ToastifyContainer />
      <Box className="min-h-screen bg-gray-50">
        {/* Banner Section */}
        <Box className="relative">
          <Box
            className="w-full h-48 sm:h-64 bg-gradient-to-r from-green-600 to-green-400"
            sx={{
              backgroundImage: shop.banner
                ? `url(${import.meta.env.VITE_SERVER}${shop.banner})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Shop Info Card */}
          <Box className="max-w-5xl mx-auto px-4">
            <Box className="relative -mt-16 sm:-mt-20 bg-white rounded-xl shadow-md p-4 sm:p-6">
              <Box className="flex flex-col sm:flex-row gap-4">
                {/* Logo */}
                <Avatar
                  src={
                    shop.logo
                      ? `${import.meta.env.VITE_SERVER}${shop.logo}`
                      : undefined
                  }
                  sx={{
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    border: "4px solid white",
                    boxShadow: 2,
                    bgcolor: "#16a34a",
                  }}
                >
                  <StoreIcon sx={{ fontSize: 40 }} />
                </Avatar>

                {/* Info */}
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 flex-wrap">
                    <Typography variant="h5" className="font-bold text-gray-800">
                      {shopName}
                    </Typography>
                    {shop.isVerified && (
                      <VerifiedIcon sx={{ color: "#1976d2", fontSize: 24 }} />
                    )}
                    <Chip
                      label={shop.status}
                      size="small"
                      color={shop.status === "active" ? "success" : "default"}
                    />
                  </Box>

                  <Typography variant="body2" className="text-gray-500 mt-1">
                    {shop.category} •{" "}
                    Member since{" "}
                    {new Date(shop.createdAt).toLocaleDateString()}
                  </Typography>

                  {/* Stats */}
                  <Box className="flex items-center gap-6 mt-3">
                    <Box className="text-center">
                      <Typography variant="h6" className="font-bold">
                        {shop.totalProducts || 0}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Products
                      </Typography>
                    </Box>
                    <Box className="text-center">
                      <Typography variant="h6" className="font-bold">
                        {followerCount}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Followers
                      </Typography>
                    </Box>
                    <Box className="text-center">
                      <Typography variant="h6" className="font-bold">
                        {shop.totalViews || 0}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Views
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Actions */}
                <Box className="flex items-start gap-2">
                  <Button
                    variant={isFollowing ? "outlined" : "contained"}
                    color="success"
                    startIcon={
                      isFollowing ? <FavoriteIcon /> : <FavoriteBorderIcon />
                    }
                    onClick={handleFollow}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <IconButton onClick={handleShare}>
                    <ShareIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Description */}
              {shopDescription && (
                <Typography variant="body2" className="text-gray-600 mt-4">
                  {shopDescription}
                </Typography>
              )}

              {/* Contact & Social */}
              <Box className="flex flex-wrap items-center gap-4 mt-4 text-gray-500">
                {shop.address?.city && (
                  <Box className="flex items-center gap-1">
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">
                      {[shop.address.street, shop.address.city]
                        .filter(Boolean)
                        .join(", ")}
                    </Typography>
                  </Box>
                )}
                {shop.contactPhone && (
                  <Box className="flex items-center gap-1">
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2">{shop.contactPhone}</Typography>
                  </Box>
                )}
                {shop.settings?.workingHours && (
                  <Box className="flex items-center gap-1">
                    <ScheduleIcon fontSize="small" />
                    <Typography variant="body2">
                      {shop.settings.workingHours}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Social Links */}
              <Box className="flex items-center gap-2 mt-3">
                {shop.socialLinks?.instagram && (
                  <IconButton
                    size="small"
                    href={`https://instagram.com/${shop.socialLinks.instagram.replace(
                      "@",
                      ""
                    )}`}
                    target="_blank"
                  >
                    <InstagramIcon sx={{ color: "#E1306C" }} />
                  </IconButton>
                )}
                {shop.socialLinks?.facebook && (
                  <IconButton
                    size="small"
                    href={
                      shop.socialLinks.facebook.startsWith("http")
                        ? shop.socialLinks.facebook
                        : `https://facebook.com/${shop.socialLinks.facebook}`
                    }
                    target="_blank"
                  >
                    <FacebookIcon sx={{ color: "#1877F2" }} />
                  </IconButton>
                )}
                {shop.socialLinks?.telegram && (
                  <IconButton
                    size="small"
                    href={`https://t.me/${shop.socialLinks.telegram.replace(
                      "@",
                      ""
                    )}`}
                    target="_blank"
                  >
                    <TelegramIcon sx={{ color: "#0088CC" }} />
                  </IconButton>
                )}
                {shop.socialLinks?.whatsapp && (
                  <IconButton
                    size="small"
                    href={`https://wa.me/${shop.socialLinks.whatsapp.replace(
                      /[^0-9]/g,
                      ""
                    )}`}
                    target="_blank"
                  >
                    <WhatsAppIcon sx={{ color: "#25D366" }} />
                  </IconButton>
                )}
                {shop.socialLinks?.website && (
                  <IconButton
                    size="small"
                    href={
                      shop.socialLinks.website.startsWith("http")
                        ? shop.socialLinks.website
                        : `https://${shop.socialLinks.website}`
                    }
                    target="_blank"
                  >
                    <WebsiteIcon sx={{ color: "#666" }} />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Products Section */}
        <Box className="max-w-5xl mx-auto px-4 py-8">
          <Typography variant="h6" className="font-semibold mb-4">
            Products ({shop.totalProducts || 0})
          </Typography>

          {productsLoading ? (
            <Box className="flex justify-center py-10">
              <CircularProgress color="success" />
            </Box>
          ) : products.length === 0 ? (
            <Box className="text-center py-10 bg-white rounded-lg">
              <InventoryIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
              <Typography variant="body1" className="text-gray-500">
                No products yet
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid item xs={6} sm={4} md={3} key={product._id}>
                    <Card
                      className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/products/product/${product._id}`)}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={
                          product.pictures?.[0]
                            ? `${import.meta.env.VITE_SERVER}/${product.pictures[0]}`
                            : "/placeholder.png"
                        }
                        alt={getLocalizedText(product.title)}
                        className="h-40 object-cover"
                      />
                      <CardContent className="p-3">
                        <Typography
                          variant="body2"
                          className="font-medium text-gray-800 line-clamp-2"
                        >
                          {getLocalizedText(product.title)}
                        </Typography>
                        <Typography
                          variant="h6"
                          className="text-green-600 font-bold mt-1"
                        >
                          {product.price} ₼
                        </Typography>
                        {product.condition && (
                          <Chip
                            label={product.condition}
                            size="small"
                            variant="outlined"
                            className="mt-1"
                          />
                        )}
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

export default ShopProfile;