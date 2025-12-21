import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import { useTranslation } from "react-i18next";
import Footer from "../components/common/Footer";

const EditShop = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetchingShop, setFetchingShop] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
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
  const [existingLogo, setExistingLogo] = useState("");
  const [existingBanner, setExistingBanner] = useState("");
  const [errors, setErrors] = useState({});

  // Shop categories
  const categories = [
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

  // Fetch existing shop data
  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER}/api/shops/my-shop`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (res.status === 401) {
          showErrorToast(t("common.pleaseLogin") || "Please login first");
          navigate("/login");
          return;
        }

        const data = await res.json();

        if (!data.hasShop || !data.data) {
          showErrorToast(t("shop.noShopFound") || "Shop not found");
          navigate("/create-shop");
          return;
        }

        const shop = data.data;

        // Check if the shop ID matches (if ID is provided in URL)
        if (id && shop._id !== id) {
          showErrorToast(t("shop.unauthorized") || "You can only edit your own shop");
          navigate("/my-shop");
          return;
        }

        // Populate form with existing data
        setFormData({
          shopName: shop.shopName?.en || shop.shopName?.[i18n.language] || "",
          description: shop.description?.en || shop.description?.[i18n.language] || "",
          category: shop.category || "General",
          contactEmail: shop.contactEmail || "",
          contactPhone: shop.contactPhone || "",
          address: {
            street: shop.address?.street || "",
            city: shop.address?.city || "",
            postalCode: shop.address?.postalCode || "",
            country: shop.address?.country || "Azerbaijan",
          },
          settings: {
            deliveryAvailable: shop.settings?.deliveryAvailable || false,
            pickupAvailable: shop.settings?.pickupAvailable ?? true,
            workingHours: shop.settings?.workingHours || "",
          },
          socialLinks: {
            instagram: shop.socialLinks?.instagram || "",
            facebook: shop.socialLinks?.facebook || "",
            website: shop.socialLinks?.website || "",
            telegram: shop.socialLinks?.telegram || "",
            whatsapp: shop.socialLinks?.whatsapp || "",
          },
        });

        // Set existing images
        if (shop.logo) {
          setExistingLogo(shop.logo);
          setLogoPreview(`${import.meta.env.VITE_SERVER}${shop.logo}`);
        }
        if (shop.banner) {
          setExistingBanner(shop.banner);
          setBannerPreview(`${import.meta.env.VITE_SERVER}${shop.banner}`);
        }
      } catch (error) {
        logger.error("Error fetching shop:", error);
        showErrorToast(t("shop.fetchError") || "Failed to load shop data");
        navigate("/my-shop");
      } finally {
        setFetchingShop(false);
      }
    };

    fetchShop();
  }, [id, navigate, t, i18n.language]);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle logo upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast(t("shop.logoSizeError") || "Logo must be less than 5MB");
        return;
      }
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      setExistingLogo(""); // Clear existing logo reference
    }
  };

  // Handle banner upload
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast(t("shop.bannerSizeError") || "Banner must be less than 5MB");
        return;
      }
      setBanner(file);
      setBannerPreview(URL.createObjectURL(file));
      setExistingBanner(""); // Clear existing banner reference
    }
  };

  // Remove logo
  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    setExistingLogo("");
    if (logoInputRef.current) logoInputRef.current.value = null;
  };

  // Remove banner
  const removeBanner = () => {
    setBanner(null);
    setBannerPreview(null);
    setExistingBanner("");
    if (bannerInputRef.current) bannerInputRef.current.value = null;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.shopName.trim()) {
      newErrors.shopName = t("shop.shopNameRequired") || "Shop name is required";
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = t("shop.emailRequired") || "Contact email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = t("shop.invalidEmail") || "Invalid email format";
    }

    if (!formData.address.city.trim()) {
      newErrors["address.city"] = t("shop.cityRequired") || "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorToast(t("shop.fixFormErrors") || "Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      const currentLang = i18n.language || "en";

      // Create multilingual objects
      const shopNameObj = { en: "", az: "", ru: "" };
      shopNameObj[currentLang] = formData.shopName;
      shopNameObj.en = formData.shopName;

      const descriptionObj = { en: "", az: "", ru: "" };
      descriptionObj[currentLang] = formData.description;
      descriptionObj.en = formData.description;

      // Append JSON fields
      formDataToSend.append("shopName", JSON.stringify(shopNameObj));
      formDataToSend.append("description", JSON.stringify(descriptionObj));
      formDataToSend.append("category", formData.category);
      formDataToSend.append("contactEmail", formData.contactEmail);
      formDataToSend.append("contactPhone", formData.contactPhone);
      formDataToSend.append("address", JSON.stringify(formData.address));
      formDataToSend.append("settings", JSON.stringify(formData.settings));
      formDataToSend.append("socialLinks", JSON.stringify(formData.socialLinks));

      // Append files only if new ones selected
      if (logo) {
        formDataToSend.append("logo", logo);
      }
      if (banner) {
        formDataToSend.append("banner", banner);
      }

      const res = await fetch(`${import.meta.env.VITE_SERVER}/api/shops/${id}`, {
        method: "PUT",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showSuccessToast(t("shop.updateSuccess") || "Shop updated successfully!");
        setTimeout(() => {
          navigate("/my-shop");
        }, 1500);
      } else {
        showErrorToast(data.message || t("shop.updateFailed") || "Failed to update shop");
      }
    } catch (error) {
      logger.error("Error updating shop:", error);
      showErrorToast(t("shop.updateFailed") || "Failed to update shop");
    } finally {
      setLoading(false);
    }
  };

  // Delete shop
  const handleDeleteShop = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/api/shops/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showSuccessToast(t("shop.deleteSuccess") || "Shop closed successfully");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        showErrorToast(data.message || t("shop.deleteFailed") || "Failed to delete shop");
      }
    } catch (error) {
      logger.error("Error deleting shop:", error);
      showErrorToast(t("shop.deleteFailed") || "Failed to delete shop");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Loading state
  if (fetchingShop) {
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
          <Box className="flex items-center justify-between gap-3 mb-6 pb-4 border-b">
            <Box className="flex items-center gap-3">
              <StoreIcon className="text-green-600" fontSize="large" />
              <Box>
                <Typography variant="h5" className="font-bold text-gray-800">
                  {t("shop.editShop") || "Edit Shop"}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {t("shop.editShopSubtitle") || "Update your shop information"}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              size="small"
            >
              {t("shop.closeShop") || "Close Shop"}
            </Button>
          </Box>

          {/* Banner Upload */}
          <Box className="mb-6">
            <Typography variant="subtitle1" className="font-medium mb-2">
              {t("shop.shopBanner") || "Shop Banner"}
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
                    {t("shop.uploadBanner") || "Upload banner image (1200x300 recommended)"}
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
              {t("shop.shopLogo") || "Shop Logo"}
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
                    {t("shop.logo") || "Logo"}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" className="text-gray-600">
                  {t("shop.uploadLogo") || "Upload a square logo (200x200 recommended)"}
                </Typography>
                <Typography variant="caption" className="text-gray-400">
                  {t("shop.maxSize") || "Max size: 5MB"}
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
              label={t("shop.shopName") || "Shop Name"}
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
              label={t("shop.description") || "Description"}
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              placeholder={t("shop.descriptionPlaceholder") || "Describe your shop..."}
            />
          </Box>

          {/* Category */}
          <Box className="mb-4">
            <TextField
              select
              label={t("shop.category") || "Category"}
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
            {t("shop.contactInfo") || "Contact Information"}
          </Typography>
          <Grid container spacing={2} className="mb-4">
            <Grid item xs={12} sm={6}>
              <TextField
                label={t("shop.contactEmail") || "Contact Email"}
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
                label={t("shop.contactPhone") || "Contact Phone"}
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
            {t("shop.location") || "Location"}
          </Typography>
          <Grid container spacing={2} className="mb-4">
            <Grid item xs={12} sm={6}>
              <TextField
                label={t("shop.city") || "City"}
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
                label={t("shop.postalCode") || "Postal Code"}
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t("shop.streetAddress") || "Street Address"}
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Settings */}
          <Typography variant="subtitle1" className="font-medium mb-3 mt-6">
            {t("shop.settings") || "Settings"}
          </Typography>
          <Box className="mb-4 space-y-2">
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.pickupAvailable}
                  onChange={handleChange}
                  name="settings.pickupAvailable"
                  color="success"
                />
              }
              label={t("shop.pickupAvailable") || "Pickup Available"}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.settings.deliveryAvailable}
                  onChange={handleChange}
                  name="settings.deliveryAvailable"
                  color="success"
                />
              }
              label={t("shop.deliveryAvailable") || "Delivery Available"}
            />
          </Box>

          {/* Working Hours */}
          <Box className="mb-4">
            <TextField
              label={t("shop.workingHours") || "Working Hours"}
              name="settings.workingHours"
              value={formData.settings.workingHours}
              onChange={handleChange}
              fullWidth
              placeholder={t("shop.workingHoursPlaceholder") || "e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"}
            />
          </Box>

          {/* Social Links */}
          <Typography variant="subtitle1" className="font-medium mb-3 mt-6">
            {t("shop.socialLinks") || "Social Links"} ({t("shop.optional") || "Optional"})
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
                label={t("shop.website") || "Website"}
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

          {/* Submit Buttons */}
          <Box className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/my-shop")}
              disabled={loading}
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {loading ? t("common.saving") || "Saving..." : t("shop.saveChanges") || "Save Changes"}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t("shop.closeShopTitle") || "Close Shop?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("shop.closeShopWarning") ||
              "Are you sure you want to close your shop? Your products will be converted to individual listings. This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleDeleteShop}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? t("common.closing") || "Closing..." : t("shop.closeShop") || "Close Shop"}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  );
};

export default EditShop;