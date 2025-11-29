import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  MenuItem,
  IconButton,
  Switch,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Store as StoreIcon,
} from "@mui/icons-material";
import Footer from "../components/common/Footer";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import imageCompression from "browser-image-compression";
import heic2any from "heic2any";

const Form = () => {
  const { t } = useTranslation();

  const maxDescriptionLength = 1000;
  const fileInputRef = useRef(null);

  const username = localStorage.getItem("userName");

  // Shop state
  const [userShop, setUserShop] = useState(null);
  const [hasShop, setHasShop] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);
  const [postToShop, setPostToShop] = useState(true); // Default to posting to shop if user has one

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    condition: "",
    price: "",
    description: "",
    postalCode: "",
    location: "",
    streetNo: "",
    showFullAddress: false,
    name: username,
    termsAccepted: false,
    subscribe: false,
    pictures: [],
    latitude: "",
    longitude: "",
    inputLanguage: i18n.language || "en",
  });

  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's shop data on component mount
  useEffect(() => {
    const fetchUserShop = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER}/api/shops/my-shop`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        // If not logged in, just continue without shop
        if (res.status === 401) {
          setHasShop(false);
          setPostToShop(false);
          setLoadingShop(false);
          return;
        }

        const data = await res.json();

        if (data.hasShop && data.data) {
          setUserShop(data.data);
          setHasShop(true);

          // Auto-fill form with shop data
          setFormData((prev) => ({
            ...prev,
            postalCode: data.data.address?.postalCode || prev.postalCode,
            location: data.data.address?.city || prev.location,
            streetNo: data.data.address?.street || prev.streetNo,
            name: username,
            latitude: data.data.location?.coordinates?.[1] || prev.latitude,
            longitude: data.data.location?.coordinates?.[0] || prev.longitude,
          }));
        } else {
          setHasShop(false);
          setPostToShop(false);
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
        setHasShop(false);
        setPostToShop(false);
      } finally {
        setLoadingShop(false);
      }
    };

    fetchUserShop();
  }, [username]);

  // Get geolocation on load (only if not filled from shop)
  useEffect(() => {
    if (formData.latitude && formData.longitude) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: prev.latitude || position.coords.latitude,
            longitude: prev.longitude || position.coords.longitude,
          }));
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  }, [formData.latitude, formData.longitude]);

  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;
    const updatedValue =
      type === "checkbox" ? checked : type === "file" ? files : value;
    let newErrors = { ...errors };

    if (name === "pictures" && files) {
      const filesArray = Array.from(files);

      if (filesArray.length + formData.pictures.length > 8) {
        showErrorToast(t("form.maxPicturesError"));
        return;
      }

      setLoading(true);
      const compressedFiles = [];
      const previews = [];

      for (let file of filesArray) {
        if (file.size / 1024 / 1024 > 2) {
          showErrorToast(`${file.name} exceeds 2 MB`);
          continue;
        }

        try {
          let processedFile = file;

          const isHeic =
            file.type === "image/heic" ||
            file.type === "image/heif" ||
            file.name.match(/\.(heic|heif)$/i);

          if (isHeic) {
            const blob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.8,
            });
            const jpegBlob = blob instanceof Blob ? blob : blob[0];
            processedFile = new File(
              [jpegBlob],
              file.name.replace(/\.(heic|heif)$/i, ".jpg"),
              { type: "image/jpeg" }
            );
          }

          const img = new Image();
          img.src = URL.createObjectURL(processedFile);
          await new Promise((resolve, reject) => {
            img.onload = () => {
              if (img.width > 5000 || img.height > 5000) {
                showErrorToast(`${file.name} exceeds max dimensions 5000x5000`);
                reject();
              } else {
                resolve();
              }
            };
            img.onerror = reject;
          });

          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: "image/jpeg",
          };
          const compressedFile = await imageCompression(processedFile, options);

          compressedFiles.push(compressedFile);
          previews.push(URL.createObjectURL(compressedFile));
        } catch (err) {
          console.warn(`Skipping file ${file.name}:`, err);
          if (err !== undefined) showErrorToast(`${t("Dimension exceeded")}`);
        }
      }

      if (compressedFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          pictures: [...prev.pictures, ...compressedFiles],
        }));
        setImagePreviews((prev) => [...prev, ...previews]);
      }
      if (fileInputRef.current) fileInputRef.current.value = null;

      setLoading(false);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: updatedValue,
      }));
    }

    setErrors(newErrors);
  };

  const removeImage = (indexToRemove) => {
    const updatedPictures = formData.pictures.filter(
      (_, idx) => idx !== indexToRemove
    );
    const updatedPreviews = imagePreviews.filter(
      (_, idx) => idx !== indexToRemove
    );

    setFormData((prev) => ({ ...prev, pictures: updatedPictures }));
    setImagePreviews(updatedPreviews);

    if (updatedPictures.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const currentErrors = {};
    if (!formData.title.trim()) currentErrors.title = t("form.titleRequired");
    if (formData.title.length > 24)
      currentErrors.title = t("form.titleLengthError");
    if (!formData.category.trim())
      currentErrors.category = t("form.categoryRequired");
    if (!formData.price.trim()) currentErrors.price = t("form.priceRequired");
    else if (!/^\d+$/.test(formData.price))
      currentErrors.price = t("form.priceNumbersOnly");
    if (!formData.description.trim())
      currentErrors.description = t("form.descriptionRequired");
    if (!formData.postalCode.trim())
      currentErrors.postalCode = t("form.postalCodeRequired");
    else if (!/^\d{6}$/.test(formData.postalCode))
      currentErrors.postalCode = t("form.postalCodeFormatError");
    if (formData.location.length > 50)
      currentErrors.location = t("form.locationLengthError");
    if (!/^[A-Za-z\s]+$/.test(formData.name))
      currentErrors.name = t("form.nameAlphabetOnly");

    setErrors(currentErrors);
    if (Object.keys(currentErrors).length > 0) {
      showErrorToast(t("form.fixFormErrors"));
      return;
    }

    if (!formData.termsAccepted) {
      showErrorToast(t("form.termsRequired"));
      return;
    }

    if (formData.pictures.length === 0) {
      showErrorToast(t("form.picturesRequired"));
      return;
    }

    // Prepare form data
    const formDataToSend = new FormData();

    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "pictures") {
        value.forEach((file) => formDataToSend.append("pictures", file));
      } else {
        formDataToSend.append(
          key,
          typeof value === "boolean" ? String(value) : value
        );
      }
    });

    // Add shop-related fields if posting to shop
    if (hasShop && postToShop && userShop) {
      formDataToSend.append("shop", userShop._id);
      formDataToSend.append("listingType", "shop");
    } else {
      formDataToSend.append("listingType", "individual");
    }

    // Always set offerType to "offer" (removed "looking for" option)
    formDataToSend.append("offerType", "offer");

    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/products/add`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );
      const data = await res.json();

      if (res.ok) {
        const successMessage =
          hasShop && postToShop
            ? t("form.productAddedToShop") || "Product added to your shop!"
            : t("form.formSubmittedSuccess");

        showSuccessToast(successMessage);

        // Reset form but keep shop-related data
        setFormData((prev) => ({
          title: "",
          category: "",
          condition: "",
          price: "",
          description: "",
          postalCode: hasShop && userShop ? userShop.address?.postalCode || "" : "",
          location: hasShop && userShop ? userShop.address?.city || "" : "",
          streetNo: hasShop && userShop ? userShop.address?.street || "" : "",
          showFullAddress: false,
          name: username,
          termsAccepted: false,
          subscribe: false,
          pictures: [],
          latitude: prev.latitude,
          longitude: prev.longitude,
          inputLanguage: i18n.language || "en",
        }));
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        showErrorToast(data.message || t("form.somethingWentWrong"));
      }
    } catch (error) {
      console.error("Error submitting ad:", error);
      showErrorToast(t("form.failedToSubmitForm"));
    } finally {
      setLoading(false);
    }
  };

  // Loading state while fetching shop
  if (loadingShop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircularProgress color="success" />
      </div>
    );
  }

  return (
    <>
      <ToastifyContainer />
      <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-4 text-black flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md w-full max-w-3xl space-y-6"
        >

          {/* Shop Toggle - Show at TOP if user has shop */}
          {hasShop && userShop && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <StoreIcon className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {userShop.shopName?.en ||
                        userShop.shopName?.[i18n.language] ||
                        "Your Shop"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {postToShop
                        ? t("form.productWillBePostedToShop") || "Product will be posted to your shop"
                        : t("form.productWillBePostedIndividually") || "Product will be posted individually"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${!postToShop ? 'text-gray-700' : 'text-gray-400'}`}>
                    {t("form.individual") || "Individual"}
                  </span>
                  <Switch
                    checked={postToShop}
                    onChange={(e) => setPostToShop(e.target.checked)}
                    color="success"
                  />
                  <span className={`text-sm font-medium ${postToShop ? 'text-green-700' : 'text-gray-400'}`}>
                    {t("form.shop") || "Shop"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ad Details */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 border-b pb-2 text-green-700">
              {t("form.adDetails")}
            </h2>

            {/* Input Language Selector */}
            <TextField
              select
              label={t("form.languageOfInput")}
              name="inputLanguage"
              value={formData.inputLanguage}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 3 }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="az">Azərbaycan</MenuItem>
              <MenuItem value="ru">Русский</MenuItem>
            </TextField>

            {/* Inputs */}
            <div className="flex flex-col gap-4">
              <TextField
                label={t("form.title")}
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title || t("form.titleHelper")}
                fullWidth
              />
              <TextField
                select
                label={t("form.category")}
                name="category"
                value={formData.category}
                onChange={handleChange}
                error={!!errors.category}
                helperText={errors.category}
                fullWidth
              >
                <MenuItem value="">{t("form.chooseCategory")}</MenuItem>
                <MenuItem value="Cars & Motorcycles">
                  {t("home.category.carsMotorcycles")}
                </MenuItem>
                <MenuItem value="Real Estate">
                  {t("home.category.realEstate")}
                </MenuItem>
                <MenuItem value="Jobs">{t("home.category.jobs")}</MenuItem>
                <MenuItem value="Household & Furniture">
                  {t("home.category.householdFurniture")}
                </MenuItem>
                <MenuItem value="Electronics">
                  {t("home.category.electronics")}
                </MenuItem>
                <MenuItem value="Leisure, Hobby & Neighborhood">
                  {t("home.category.leisureHobbyNeighborhood")}
                </MenuItem>
                <MenuItem value="Service">{t("home.category.service")}</MenuItem>
                <MenuItem value="Other">{t("home.category.other")}</MenuItem>
              </TextField>
              <TextField
                label={t("form.price")}
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <span className="text-gray-500">{t("form.currency")}</span>
                  ),
                }}
              />
              <TextField
                select
                label={t("form.condition") || "Condition"}
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">
                  {t("form.selectCondition") || "Select condition"}
                </MenuItem>
                <MenuItem value="New">{t("form.conditionNew") || "New"}</MenuItem>
                <MenuItem value="Like New">
                  {t("form.conditionLikeNew") || "Like New"}
                </MenuItem>
                <MenuItem value="Used">
                  {t("form.conditionUsed") || "Used"}
                </MenuItem>
                <MenuItem value="Defective / Needs Repair">
                  {t("form.conditionDefective") || "Defective / Needs Repair"}
                </MenuItem>
              </TextField>
              <TextField
                label={t("form.description") || "Description"}
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                error={!!errors.description}
                helperText={
                  errors.description ||
                  t("form.charactersLeft", {
                    count: maxDescriptionLength - formData.description.length,
                  })
                }
              />
            </div>

            {/* Upload Section */}
            <div className="mt-4">
              <label className="block font-medium mb-2">
                {t("form.pictures")} <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:border-green-600 transition-all">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="fileUpload"
                    onChange={handleChange}
                    className="hidden"
                    name="pictures"
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="fileUpload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <CloudUploadIcon style={{ fontSize: 40, color: "gray" }} />
                    <span className="text-gray-600 text-sm mt-2">
                      {t("form.uploadTip")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t("form.maxImagesTip")}
                    </span>
                  </label>
                </div>

                {loading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 rounded-lg">
                    <CircularProgress color="success" size={40} thickness={2} />
                  </div>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {imagePreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative w-full aspect-square border rounded overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          color: "white",
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 border-b pb-2 text-green-700">
              {t("form.location")}
              {hasShop && postToShop && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({t("form.autoFilledFromShop") || "Auto-filled from shop"})
                </span>
              )}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <TextField
                label={t("form.postalCode")}
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                error={!!errors.postalCode}
                helperText={errors.postalCode}
                fullWidth
              />
              <TextField
                label={t("form.locationCity")}
                name="location"
                value={formData.location}
                onChange={handleChange}
                error={!!errors.location}
                helperText={errors.location}
                fullWidth
              />
            </div>
            <TextField
              className="mt-4"
              label={t("form.streetNo")}
              name="streetNo"
              value={formData.streetNo}
              onChange={handleChange}
              helperText={t("form.streetNoHelper")}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="showFullAddress"
                  checked={formData.showFullAddress}
                  onChange={handleChange}
                />
              }
              label={t("form.showFullAddress")}
            />
          </div>

          {/* Your Details */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 border-b pb-2 text-green-700">
              {t("form.yourDetails")}
            </h2>
            <TextField
              label={t("form.name") || "Name"}
              name="name"
              value={username}
              disabled
              helperText={
                <span>
                  {t("form.nameHelper") || "Your display name"} <br />
                  <strong>{t("form.note") || "Note"}:</strong>{" "}
                  {t("form.forMoreInfo") || "For more info, visit"}{" "}
                  <a href="#" className="text-blue-600 underline">
                    {t("form.helpCenter") || "Help Center"}
                  </a>
                </span>
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="subscribe"
                  checked={formData.subscribe}
                  onChange={handleChange}
                />
              }
              label={t("form.subscribeToUpdates")}
            />
          </div>

          {/* Terms */}
          <div className="pt-6 border-t">
            <FormControlLabel
              control={
                <Checkbox
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
              }
              label={t("form.termsAndConditions")}
            />
            <p className="text-xs text-gray-500 mt-2">
              {t("form.termsText1", {
                termsLink: (
                  <a href="#" className="text-blue-600 underline">
                    {t("form.termsOfUse")}
                  </a>
                ),
              })}
            </p>
          </div>

          <Button
            type="submit"
            variant="contained"
            color="success"
            className="mt-6 w-full sm:w-auto"
            disabled={loading}
            sx={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            startIcon={hasShop && postToShop ? <StoreIcon /> : null}
          >
            {loading
              ? t("common.loading") || "Loading..."
              : hasShop && postToShop
              ? t("form.publishToShop") || "Publish to Shop"
              : t("form.publishAd") || "Publish Ad"}
          </Button>

          {/* Create Shop CTA - Show if user doesn't have shop */}
          {!hasShop && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <StoreIcon className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {t("form.wantToSellMore") || "Want to sell more?"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("form.createShopDesc") || "Create your own shop, build your brand, and reach more customers."}
                  </p>
                </div>
                <Button
                  variant="outlined"
                  color="success"
                  href="/create-shop"
                  className="whitespace-nowrap"
                >
                  {t("form.createShop") || "Create Shop"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Form;