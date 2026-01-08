import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  MenuItem,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  Paper,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Store as StoreIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Language as WebsiteIcon,
  Telegram as TelegramIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import { useTranslation } from "react-i18next";
import Footer from "../components/common/Footer";

const CreateShop = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);

  // Form state (simplified - single language, i18n handles display)
  const [formData, setFormData] = useState({
    shopName: "",
    description: "",
    category: "General",
    contactEmail: "",
    contactPhone: "",
    address: {
      street: "",
      city: "",
      postalCode: "",
      country: "Azerbaijan",
    },
    settings: {
      deliveryAvailable: false,
      pickupAvailable: true,
      workingHours: "",
    },
    socialLinks: {
      instagram: "",
      facebook: "",
      website: "",
      telegram: "",
      whatsapp: "",
    },
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Shop categories
  const categories = [
    { value: "Electronics", label: t("home.category.electronics") || "Electronics" },
    { value: "Clothing & Fashion", label: t("home.category.clothingFashion") || "Clothing & Fashion" },
    { value: "Home & Garden", label: t("home.category.householdFurniture") || "Home & Garden" },
    { value: "Vehicles", label: t("home.category.carsMotorcycles") || "Vehicles" },
    { value: "Sports & Outdoors", label: t("home.category.leisureHobbyNeighborhood") || "Sports & Outdoors" },
    { value: "Books & Media", label: t("home.category.booksMedia") || "Books & Media" },
    { value: "Services", label: t("home.category.service") || "Services" },
    { value: "General", label: t("home.category.other") || "General" },
    { value: "Other", label: t("home.category.other") || "Other" },
  ];

  // Check if user already has a shop
  useEffect(() => {
    const checkExistingShop = async () => {
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
          showErrorToast(t("common.pleaseLogin") || "Please login to create a shop");
          navigate("/login");
          return;
        }

        const data = await res.json();

        if (data.hasShop) {
          showErrorToast("You already have a shop!");
          navigate("/my-shop");
        }
      } catch (error) {
        console.error("Error checking shop:", error);
        // Network error - might not be logged in
        showErrorToast(t("common.pleaseLogin") || "Please login to create a shop");
        navigate("/login");
      } finally {
        setCheckingShop(false);
      }
    };

    checkExistingShop();
  }, [navigate, t]);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast("Logo must be less than 5MB");
        return;
      }
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle banner upload
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast("Banner must be less than 5MB");
        return;
      }
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // Remove logo
  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = null;
  };

  // Remove banner
  const removeBanner = () => {
    setBanner(null);
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = null;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.shopName.trim()) {
      newErrors.shopName = "Shop name is required";
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }

    if (!formData.address.city.trim()) {
      newErrors["address.city"] = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Get current language
      const currentLang = i18n.language || "en";

      // Create multilingual object with current input as primary language
      const shopNameObj = { en: "", az: "", ru: "" };
      shopNameObj[currentLang] = formData.shopName;
      shopNameObj.en = formData.shopName; // Always set English as fallback

      const descriptionObj = { en: "", az: "", ru: "" };
      descriptionObj[currentLang] = formData.description;
      descriptionObj.en = formData.description; // Always set English as fallback

      // Append JSON fields as strings
      formDataToSend.append("shopName", JSON.stringify(shopNameObj));
      formDataToSend.append("description", JSON.stringify(descriptionObj));
      formDataToSend.append("category", formData.category);
      formDataToSend.append("contactEmail", formData.contactEmail);
      formDataToSend.append("contactPhone", formData.contactPhone);
      formDataToSend.append("address", JSON.stringify(formData.address));
      formDataToSend.append("settings", JSON.stringify(formData.settings));
      formDataToSend.append("socialLinks", JSON.stringify(formData.socialLinks));

      // Append files
      if (logo) {
        formDataToSend.append("logo", logo);
      }
      if (banner) {
        formDataToSend.append("banner", banner);
      }

      const res = await fetch(`${import.meta.env.VITE_SERVER}/api/shops`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showSuccessToast("Shop created successfully!");
        setTimeout(() => {
          navigate("/my-shop");
        }, 1500);
      } else {
        showErrorToast(data.message || "Failed to create shop");
      }
    } catch (error) {
      console.error("Error creating shop:", error);
      showErrorToast("Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingShop) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <>
      <ToastifyContainer />
      <Box className="min-h-screen bg-gray-50 py-6 px-2 sm:px-4">
        <Paper
          component="form"
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8"
          elevation={2}
        >
          {/* Header */}
          <Box className="flex items-center gap-3 mb-6 pb-4 border-b">
            <StoreIcon className="text-green-600" fontSize="large" />
            <Box>
              <Typography variant="h5" className="font-bold text-gray-800">
                Create Your Shop
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                Set up your shop and start selling
              </Typography>
            </Box>
          </Box>

          {/* Banner Upload */}
          <Box className="mb-6">
            <Typography variant="subtitle1" className="font-medium mb-2">
              Shop Banner
            </Typography>
            <Box className="relative">
              {bannerPreview ? (
                <Box className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <IconButton
                    size="small"
                    onClick={removeBanner}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  className="w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <CloudUploadIcon className="text-gray-400" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2" className="text-gray-500 text-center px-4">
                    Upload banner image (1200x300 recommended)
                  </Typography>
                </Box>
              )}
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerChange}
                accept="image/*"
                className="hidden"
              />
            </Box>
          </Box>

          {/* Logo Upload */}
          <Box className="mb-6">
            <Typography variant="subtitle1" className="font-medium mb-2">
              Shop Logo
            </Typography>
            <Box className="flex items-center gap-4">
              {logoPreview ? (
                <Box className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                  <IconButton
                    size="small"
                    onClick={removeLogo}
                    sx={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <CloudUploadIcon className="text-gray-400" />
                  <Typography variant="caption" className="text-gray-500">
                    Logo
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" className="text-gray-600">
                  Upload a square logo (200x200 recommended)
                </Typography>
                <Typography variant="caption" className="text-gray-400">
                  Max size: 5MB
                </Typography>
              </Box>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
            </Box>
          </Box>

          {/* Shop Name */}
          <Box className="mb-4">
            <TextField
              label="Shop Name"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              error={!!errors.shopName}
              helperText={errors.shopName}
              fullWidth
              required
            />
          </Box>

          {/* Description */}
          <Box className="mb-4">
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              placeholder="Describe your shop..."
            />
          </Box>

          {/* Category */}
          <Box className="mb-4">
            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Contact Info */}
          <Typography variant="subtitle1" className="font-medium mb-3 mt-6">
            Contact Information
          </Typography>
          <Grid container spacing={2} className="mb-4">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                fullWidth
                placeholder="+994 XX XXX XX XX"
              />
            </Grid>
          </Grid>

          {/* Address */}
          <Typography variant="subtitle1" className="font-medium mb-3 mt-6">
            Location
          </Typography>
          <Grid container spacing={2} className="mb-4">
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                error={!!errors["address.city"]}
                helperText={errors["address.city"]}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Postal Code"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Working Hours */}
          <Box className="mb-4">
            <TextField
              label="Working Hours"
              name="settings.workingHours"
              value={formData.settings.workingHours}
              onChange={handleChange}
              fullWidth
              placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
            />
          </Box>

          {/* Social Links */}
          <Typography variant="subtitle1" className="font-medium mb-3 mt-6">
            Social Links (Optional)
          </Typography>
          <Grid container spacing={2} className="mb-6">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Instagram"
                name="socialLinks.instagram"
                value={formData.socialLinks.instagram}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InstagramIcon fontSize="small" sx={{ color: "#E1306C" }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="@username"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Facebook"
                name="socialLinks.facebook"
                value={formData.socialLinks.facebook}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FacebookIcon fontSize="small" sx={{ color: "#1877F2" }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="facebook.com/..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telegram"
                name="socialLinks.telegram"
                value={formData.socialLinks.telegram}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TelegramIcon fontSize="small" sx={{ color: "#0088CC" }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="@username"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="WhatsApp"
                name="socialLinks.whatsapp"
                value={formData.socialLinks.whatsapp}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="+994..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Website"
                name="socialLinks.website"
                value={formData.socialLinks.website}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WebsiteIcon fontSize="small" sx={{ color: "#666" }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="https://..."
              />
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Box className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate(-1)}
              disabled={loading}
              fullWidth
              sx={{ order: { xs: 2, sm: 1 } }}
              className="sm:w-auto"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
              fullWidth
              sx={{ order: { xs: 1, sm: 2 } }}
              className="sm:w-auto"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <StoreIcon />}
            >
              {loading ? "Creating..." : "Create Shop"}
            </Button>
          </Box>
        </Paper>
      </Box>
      <Footer />
    </>
  );
};

export default CreateShop;