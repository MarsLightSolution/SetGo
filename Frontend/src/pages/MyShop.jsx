import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  Divider,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import {
  Store as StoreIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  RemoveRedEye as ViewsIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Language as WebsiteIcon,
  Telegram as TelegramIcon,
  WhatsApp as WhatsAppIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import { useTranslation } from "react-i18next";

const MyShop = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);
  const [hasShop, setHasShop] = useState(false);

  // Get text based on current language
  const getLocalizedText = (field) => {
    if (!field) return "";
    const lang = i18n.language || "en";
    return field[lang] || field.en || "";
  };

  // Fetch shop data
  useEffect(() => {
    const fetchMyShop = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER}/api/shops/my-shop`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        // If 401 (not logged in), redirect to login
        if (res.status === 401) {
          showErrorToast(t("common.pleaseLogin") || "Please login first");
          navigate("/login");
          return;
        }

        const data = await res.json();

        if (data.hasShop && data.data) {
          setShop(data.data);
          setHasShop(true);
        } else {
          setHasShop(false);
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
        showErrorToast("Failed to fetch shop data");
      } finally {
        setLoading(false);
      }
    };

    fetchMyShop();
  }, [navigate, t]);

  // Loading state
  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <CircularProgress color="success" />
      </Box>
    );
  }

  // No shop - show create prompt
  if (!hasShop) {
    return (
      <>
        <ToastifyContainer />
        <Box className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-4">
          <Paper className="max-w-md w-full p-8 text-center" elevation={2}>
            <StoreIcon sx={{ fontSize: 80, color: "#16a34a", mb: 2 }} />
            <Typography variant="h5" className="font-bold mb-2">
              You don't have a shop yet
            </Typography>
            <Typography variant="body1" className="text-gray-500 mb-6">
              Create your shop and start selling your products to thousands of customers.
            </Typography>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate("/create-shop")}
              fullWidth
            >
              Create Shop
            </Button>
          </Paper>
        </Box>
      </>
    );
  }

  // Shop dashboard
  return (
    <>
      <ToastifyContainer />
      <Box className="min-h-screen bg-gray-50 pb-6">
        {/* Banner Section */}
        <Box className="relative">
          {/* Banner Image */}
          <Box
            className="w-full h-40 sm:h-56 bg-gradient-to-r from-green-600 to-green-400"
            sx={{
              backgroundImage: shop.banner
                ? `url(${import.meta.env.VITE_SERVER}${shop.banner})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Shop Info Overlay */}
          <Box className="max-w-5xl mx-auto px-4">
            <Box className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Logo */}
              <Avatar
                src={shop.logo ? `${import.meta.env.VITE_SERVER}${shop.logo}` : undefined}
                sx={{
                  width: { xs: 100, sm: 130 },
                  height: { xs: 100, sm: 130 },
                  border: "4px solid white",
                  boxShadow: 2,
                  bgcolor: "#16a34a",
                }}
              >
                <StoreIcon sx={{ fontSize: 50 }} />
              </Avatar>

              {/* Name and Status */}
              <Box className="flex-1 text-center sm:text-left pb-2">
                <Box className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <Typography variant="h5" className="font-bold text-gray-800">
                    {getLocalizedText(shop.shopName)}
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
                <Typography variant="body2" className="text-gray-500">
                  {shop.category} • Member since{" "}
                  {new Date(shop.createdAt).toLocaleDateString()}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box className="flex gap-2">
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate(`/shop/${shop.slug}`)}
                  size="small"
                >
                  View
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/edit-shop/${shop._id}`)}
                  size="small"
                >
                  Edit
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box className="max-w-5xl mx-auto px-4 mt-6">
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent className="text-center">
                  <InventoryIcon sx={{ color: "#16a34a", fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" className="font-bold">
                    {shop.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent className="text-center">
                  <PeopleIcon sx={{ color: "#2563eb", fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" className="font-bold">
                    {shop.followerCount || 0}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Followers
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent className="text-center">
                  <ViewsIcon sx={{ color: "#9333ea", fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" className="font-bold">
                    {shop.totalViews || 0}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Views
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={1}>
                <CardContent className="text-center">
                  <StoreIcon sx={{ color: "#ea580c", fontSize: 32, mb: 1 }} />
                  <Typography variant="h5" className="font-bold">
                    {shop.totalSales || 0}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Sales
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Paper className="p-4" elevation={1}>
                <Typography variant="subtitle1" className="font-medium mb-3">
                  Quick Actions
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/form")}
                  >
                    Add Product
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<InventoryIcon />}
                    onClick={() => navigate("/myproducts")}
                  >
                    My Products
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Shop Details */}
            <Grid item xs={12} md={7}>
              <Paper className="p-4" elevation={1}>
                <Typography variant="subtitle1" className="font-medium mb-3">
                  About Shop
                </Typography>
                
                {/* Description */}
                {getLocalizedText(shop.description) && (
                  <Typography variant="body2" className="text-gray-600 mb-4">
                    {getLocalizedText(shop.description)}
                  </Typography>
                )}

                <Divider className="my-3" />

                {/* Contact Info */}
                <Box className="space-y-2">
                  {shop.contactEmail && (
                    <Box className="flex items-center gap-2 text-gray-600">
                      <EmailIcon fontSize="small" />
                      <Typography variant="body2">{shop.contactEmail}</Typography>
                    </Box>
                  )}
                  {shop.contactPhone && (
                    <Box className="flex items-center gap-2 text-gray-600">
                      <PhoneIcon fontSize="small" />
                      <Typography variant="body2">{shop.contactPhone}</Typography>
                    </Box>
                  )}
                  {(shop.address?.city || shop.address?.street) && (
                    <Box className="flex items-center gap-2 text-gray-600">
                      <LocationIcon fontSize="small" />
                      <Typography variant="body2">
                        {[shop.address?.street, shop.address?.city, shop.address?.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </Typography>
                    </Box>
                  )}
                  {shop.settings?.workingHours && (
                    <Box className="flex items-center gap-2 text-gray-600">
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="body2">{shop.settings.workingHours}</Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Social Links */}
            <Grid item xs={12} md={5}>
              <Paper className="p-4" elevation={1}>
                <Typography variant="subtitle1" className="font-medium mb-3">
                  Social Links
                </Typography>
                
                <Box className="space-y-2">
                  {shop.socialLinks?.instagram && (
                    <Box className="flex items-center gap-2">
                      <InstagramIcon sx={{ color: "#E1306C" }} />
                      <Typography variant="body2" className="text-gray-600">
                        {shop.socialLinks.instagram}
                      </Typography>
                    </Box>
                  )}
                  {shop.socialLinks?.facebook && (
                    <Box className="flex items-center gap-2">
                      <FacebookIcon sx={{ color: "#1877F2" }} />
                      <Typography variant="body2" className="text-gray-600">
                        {shop.socialLinks.facebook}
                      </Typography>
                    </Box>
                  )}
                  {shop.socialLinks?.telegram && (
                    <Box className="flex items-center gap-2">
                      <TelegramIcon sx={{ color: "#0088CC" }} />
                      <Typography variant="body2" className="text-gray-600">
                        {shop.socialLinks.telegram}
                      </Typography>
                    </Box>
                  )}
                  {shop.socialLinks?.whatsapp && (
                    <Box className="flex items-center gap-2">
                      <WhatsAppIcon sx={{ color: "#25D366" }} />
                      <Typography variant="body2" className="text-gray-600">
                        {shop.socialLinks.whatsapp}
                      </Typography>
                    </Box>
                  )}
                  {shop.socialLinks?.website && (
                    <Box className="flex items-center gap-2">
                      <WebsiteIcon sx={{ color: "#666" }} />
                      <Typography variant="body2" className="text-gray-600">
                        {shop.socialLinks.website}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* No social links message */}
                  {!shop.socialLinks?.instagram &&
                    !shop.socialLinks?.facebook &&
                    !shop.socialLinks?.telegram &&
                    !shop.socialLinks?.whatsapp &&
                    !shop.socialLinks?.website && (
                      <Typography variant="body2" className="text-gray-400">
                        No social links added yet
                      </Typography>
                    )}
                </Box>
              </Paper>

              {/* Settings */}
              <Paper className="p-4 mt-3" elevation={1}>
                <Typography variant="subtitle1" className="font-medium mb-3">
                  Settings
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  <Chip
                    label="Pickup"
                    color={shop.settings?.pickupAvailable ? "success" : "default"}
                    variant={shop.settings?.pickupAvailable ? "filled" : "outlined"}
                    size="small"
                  />
                  <Chip
                    label="Delivery"
                    color={shop.settings?.deliveryAvailable ? "success" : "default"}
                    variant={shop.settings?.deliveryAvailable ? "filled" : "outlined"}
                    size="small"
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default MyShop;