import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import Footer from "../components/common/Footer";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";

// i18n imports
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Adjust path if necessary
import imageCompression from "browser-image-compression";
import heic2any from "heic2any";
const Form = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook

  const maxDescriptionLength = 1000;
  const fileInputRef = useRef(null);
  
  const username = localStorage.getItem("userName");
  const [formData, setFormData] = useState({
    offerType: "offer",
    title: "",
    category: "",
    condition: "",
    price: "",
    description: "",
    postalCode: "",
    location: "",
    streetNo: "",
    showFullAddress: false,
    name: username ,
    termsAccepted: false,
    subscribe: false,
    pictures: [],
    latitude: '',
    longitude: '',
    inputLanguage: i18n.language || 'en', // Initialize with current i18n language or default to 'en'
  });
  console.log("Input Language:", formData); // Debug log for input language

  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);

  // Get geolocation on load
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (err) => {
          console.error("Geolocation error:", err);
          showErrorToast(t("locationError")); // Translated
        }
      );
    } else {
      console.warn("Geolocation not supported");
      showErrorToast(t("geolocationNotSupported")); // Translated
    }
  }, [t]);

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

  try {
    const compressedFiles = [];
    const previews = [];

    for (let file of filesArray) {
      let processedFile = file;

      // Convert HEIC/HEIF to JPEG
      if (file.type === "image/heic" || file.type === "image/heif") {
        const blob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8
        });
        processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
      }

      // Compress
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg",
      };

      const compressedFile = await imageCompression(processedFile, options);
      compressedFiles.push(compressedFile);
      previews.push(URL.createObjectURL(compressedFile));
    }

    setFormData((prev) => ({
      ...prev,
      pictures: [...prev.pictures, ...compressedFiles],
    }));
    setImagePreviews((prev) => [...prev, ...previews]);
  } catch (err) {
    console.error("Image compression/conversion error:", err);
    showErrorToast(t("form.imageCompressionFailed"));
  }
}
 else {
      setFormData((prev) => ({
        ...prev,
        [name]: updatedValue,
      }));
    }

    setErrors(newErrors);
  };
  
  const removeImage = (indexToRemove) => {
    const updatedPictures = formData.pictures.filter((_, idx) => idx !== indexToRemove);
    const updatedPreviews = imagePreviews.filter((_, idx) => idx !== indexToRemove);

    setFormData((prev) => ({ ...prev, pictures: updatedPictures }));
    setImagePreviews(updatedPreviews);

    if (updatedPictures.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-check validation before submission
    const currentErrors = {};
    if (!formData.title.trim()) currentErrors.title = t("form.titleRequired");
    if (formData.title.length > 24) currentErrors.title = t("form.titleLengthError");
    if (!formData.category.trim()) currentErrors.category = t("form.categoryRequired");
    if (!formData.price.trim()) currentErrors.price = t("form.priceRequired");
    else if (!/^\d+$/.test(formData.price)) currentErrors.price = t("form.priceNumbersOnly");
    if (!formData.description.trim()) currentErrors.description = t("form.descriptionRequired");
    if (!formData.postalCode.trim()) currentErrors.postalCode = t("form.postalCodeRequired");
    else if (!/^\d{6}$/.test(formData.postalCode)) currentErrors.postalCode = t("form.postalCodeFormatError");
    // if (!formData.location.trim()) currentErrors.location = t("form.locationRequired");
    if (formData.location.length > 50) currentErrors.location = t("form.locationLengthError");
    if (!formData.name.trim()) currentErrors.name = t("form.nameRequired");
    else if (!/^[A-Za-z\s]+$/.test(formData.name)) currentErrors.name = t("form.nameAlphabetOnly");
    // Required fields
    const requiredFields = [
      "title",
      "category",
      "condition",
      "price",
      "description",
      "postalCode",
      "location",
      "name",
    ];

    setErrors(currentErrors); // Update errors state

    if (Object.keys(currentErrors).length > 0) {
      showErrorToast(t("form.fixFormErrors")); // Translated
      return;
    }

    if (!formData.termsAccepted) {
      showErrorToast(t("form.termsRequired")); // Translated
      return;
    }

    // if (!formData.latitude || !formData.longitude) {
    //   showErrorToast(t("form.locationNotFound")); // Translated
    //   return;
    // }

    if (formData.pictures.length === 0) {
        showErrorToast(t("form.picturesRequired")); // Translated
        return;
    }

    const formDataToSend = new FormData();
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

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/api/products/add`, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        showSuccessToast(t("form.formSubmittedSuccess")); // Translated
        setFormData((prev) => ({
          offerType: "offer",
          title: "",
          category: "",
          condition: "",
          price: "",
          description: "",
          postalCode: "",
          location: "",
          streetNo: "",
          showFullAddress: false,
          name: "",
          termsAccepted: false,
          subscribe: false,
          pictures: [],
          latitude: prev.latitude,
          longitude: prev.longitude,
          inputLanguage: i18n.language || 'en', // Reset input language to current display language
        }));
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        showErrorToast(data.message || t("form.somethingWentWrong")); // Translated fallback
      }
    } catch (error) {
      console.error("Error submitting ad:", error);
      showErrorToast(t("form.failedToSubmitForm")); // Translated
    }
  };

  return (
    <>
      <ToastifyContainer />
      <div className="min-h-screen bg-gray-50 py-10 px-4 text-black flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-md w-full max-w-3xl space-y-6"
        >
          {/* Ad Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">{t("form.adDetails")}</h2>

            <FormControl component="fieldset" className="mb-4">
              <FormLabel>{t("form.bidRequest")}</FormLabel>
              <RadioGroup row name="offerType" value={formData.offerType} onChange={handleChange}>
                <FormControlLabel value="offer" control={<Radio />} label={t("form.iOffer")} />
                <FormControlLabel value="looking" control={<Radio />} label={t("form.iAmLookingFor")} />
              </RadioGroup>
            </FormControl>

            {/* Input Language Selector */}
            <TextField
              select
              label={t("form.languageOfInput")}
              name="inputLanguage"
              value={formData.inputLanguage}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 3 }} // Margin bottom for spacing
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="az">Azərbaycan</MenuItem>
              <MenuItem value="ru">Русский</MenuItem>
            </TextField>

            <div className="flex flex-col gap-4">
              <TextField
                label={t("form.title")}
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title || t("form.titleHelper")}
                sx={{ width: "40rem" }}
              />
              <TextField
                select
                label={t("form.category")}
                name="category"
                value={formData.category}
                onChange={handleChange}
                error={!!errors.category}
                helperText={errors.category}
                sx={{ width: "41rem" }}
              >
                <MenuItem value="">{t("form.chooseCategory")}</MenuItem>
                <MenuItem value="Cars & Motorcycles">{t("home.category.carsMotorcycles")}</MenuItem>
                <MenuItem value="Real Estate">{t("home.category.realEstate")}</MenuItem>
                <MenuItem value="Jobs">{t("home.category.jobs")}</MenuItem>
                <MenuItem value="Household & Furniture">{t("home.category.householdFurniture")}</MenuItem>
                <MenuItem value="Electronics">{t("home.category.electronics")}</MenuItem>
                <MenuItem value="Leisure, Hobby & Neighborhood">{t("home.category.leisureHobbyNeighborhood")}</MenuItem>
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
                sx={{ width: "41rem" }}
                InputProps={{ endAdornment: <span className="text-gray-500">{t("form.currency")}</span> }}
              />
              <TextField
                select
                label="Condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                sx={{ width: "41rem" }}
              >
                <MenuItem value="">Select condition</MenuItem>
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Like New">Like New</MenuItem>
                <MenuItem value="Used">Used</MenuItem>
                <MenuItem value="Defective / Needs Repair">
                  Defective / Needs Repair
                </MenuItem>
              </TextField>

              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                sx={{ width: "41rem" }}
                error={!!errors.description}
                helperText={errors.description || t("form.charactersLeft", { count: maxDescriptionLength - formData.description.length })}
              />
            </div>

            {/* Upload Section */}
            <div className="mt-4">
              <label className="block font-medium mb-2">
                {t("form.pictures")} <span className="text-red-600">*</span>
              </label>
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
                  <span className="text-gray-600 text-sm mt-2">{t("form.uploadTip")}</span>
                  <span className="text-xs text-gray-500">{t("form.maxImagesTip")}</span>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap mt-4 gap-3">
                  {imagePreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 border rounded overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
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
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">{t("form.location")}</h2>
            <div className="flex gap-4 mb-4">
              <TextField
                label={t("form.postalCode")}
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                error={!!errors.postalCode}
                helperText={errors.postalCode}
                sx={{ width: "10rem" }}
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
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">{t("form.yourDetails")}</h2>
          <TextField
          label="Name"
          name="name"
          value={username} // hardcoded value
          disabled // optional: makes it readonly
          helperText={
            <span>
              Please enter your full name <br />
              <strong>Note:</strong> For more info, visit{" "}
              <a href="#" className="text-blue-600 underline">
                Help Center
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

          {/* Terms and Conditions */}
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
              {t("form.termsText1", { termsLink: <a href="#" className="text-blue-600 underline">{t("form.termsOfUse")}</a> })}
            </p>
          </div>

          <Button type="submit" variant="contained" color="success" className="mt-8">
            {t("form.publishAd")}
          </Button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Form;