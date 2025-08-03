import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  FormControlLabel, // For Checkbox if used
  Checkbox // For Checkbox if used
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../../Hooks/Tostify";

import { useTranslation } from 'react-i18next';
import i18n from '../../i18n'; // Import i18n instance

const EditForm = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const maxDescriptionLength = 1000;
  const token = localStorage.getItem("accessToken");
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    offerType: "offer",
    title: "",
    category: "",
    condition: "",
    price: "",
    description: "",
    postalCode: "",
    streetNo: "",
    showFullAddress: false,
    name: "",
    termsAccepted: false,
    subscribe: false,
    pictures: [],
  });

  const [initialImageUrls, setInitialImageUrls] = useState([]);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // --- Category Keys and Helpers (Crucial for Translation & Data Mapping) ---
  const categoryKeys = [
    "home.category.carsMotorcycles",
    "home.category.realEstate",
    "home.category.jobs",
    "home.category.householdFurniture",
    "home.category.electronics",
    "home.category.leisureHobbyNeighborhood",
    "home.category.service",
    "home.category.other",
  ];

  // Helper to get the English category value to send to backend
  const getEnglishCategoryValue = (translatedCategoryString) => {
    // Find the category key whose translation in the CURRENT LANGUAGE matches the input string
    const foundKey = categoryKeys.find(key => t(key) === translatedCategoryString);
    if (foundKey) {
      return t(foundKey, { lng: 'en' }); // Return the English translation of that found key
    }
    // Fallback: If the input string itself is already an English value (or unrecognized), return as is
    return translatedCategoryString;
  };

  // Helper to convert backend category value (could be object, key string, or English string)
  // into the translated display string for the dropdown.
  const getDisplayCategoryFromBackendValue = (backendCategoryValue) => {
    // Case 1: Backend sends category as a multilingual object (ideal scenario, as per your model)
    if (typeof backendCategoryValue === 'object' && backendCategoryValue !== null) {
      return backendCategoryValue[i18n.language] || backendCategoryValue.en || '';
    }

    // Case 2: Backend sends category as a string (either an English value OR a translation key itself)
    if (typeof backendCategoryValue === 'string') {
      // Try to find the key by matching its English translation (if backend sends English values directly)
      const foundKeyByEnglishTranslation = categoryKeys.find(key =>
        t(key, { lng: 'en' }) === backendCategoryValue
      );
      if (foundKeyByEnglishTranslation) {
        return t(foundKeyByEnglishTranslation); // Translate that key to current display language
      }

      // Try to find the key if the backend value IS the translation key string itself (e.g., "home.category.householdFurniture")
      if (categoryKeys.includes(backendCategoryValue)) {
        return t(backendCategoryValue); // Directly translate the key string
      }
    }
    return backendCategoryValue || ''; // Fallback to raw value if no match
  };
  // --- End Category Keys and Helpers ---


  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/products/product/${id}?lang=${i18n.language}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          const product = data.data;

          const initialTitle = product.title?.[i18n.language] || product.title?.en || "";
          const initialDescription = product.description?.[i18n.language] || product.description?.en || "";
          const initialName = product.name?.[i18n.language] || product.name?.en || "";

          // --- CRITICAL FIX FOR CATEGORY INITIALIZATION ---
          const initialCategoryForForm = getDisplayCategoryFromBackendValue(product.category);
          // --- END CRITICAL FIX ---

          setFormData((prev) => ({
            ...prev,
            ...product,
            title: initialTitle,
            category: initialCategoryForForm, // Set the category to the translated display value
            description: initialDescription,
            name: initialName,
            postalCode: product.postalCode || "",
            streetNo: product.street || "",
            pictures: [],
            showFullAddress: product.showFullAddress || false,
            termsAccepted: product.termsAccepted || false,
            subscribe: product.subscribe || false,
          }));

          setInitialImageUrls(product.pictures || []);
          setNewlySelectedFiles([]);
        } else {
          showErrorToast(t("editForm.failedToLoadAd"));
        }
      } catch (err) {
        console.error(err);
        showErrorToast(t("editForm.errorFetchingAd"));
      }
    };
    fetchAd();
  }, [id, i18n.language, t]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let updatedValue = type === "checkbox" ? checked : value;
    let newErrors = { ...errors };

    if (name === "title") {
      if (!updatedValue.trim()) newErrors.title = t("form.titleRequired");
      else if (updatedValue.length > 24) newErrors.title = t("form.titleLengthError");
      else delete newErrors.title;
    }

    if (name === "price") {
      if (!updatedValue.trim()) newErrors.price = t("form.priceRequired");
      else if (!/^\d+$/.test(updatedValue)) newErrors.price = t("form.priceNumbersOnly");
      else delete newErrors.price;
    }

    if (name === "postalCode") {
      if (!updatedValue.trim()) newErrors.postalCode = t("form.postalCodeRequired");
      else if (!/^\d{6}$/.test(updatedValue)) newErrors.postalCode = t("form.postalCodeFormatError");
      else delete newErrors.postalCode;
    }

    if (name === "name") {
      if (!updatedValue.trim()) newErrors.name = t("form.nameRequired");
      else if (!/^[A-Za-z\s]+$/.test(updatedValue)) newErrors.name = t("form.nameAlphabetOnly");
      else delete newErrors.name;
    }

    setErrors(newErrors);

    if (type === "file") {
        const selectedFiles = Array.from(files);
        if (initialImageUrls.length + selectedFiles.length > 8) {
            showErrorToast(t("form.maxPicturesError"));
            if (fileInputRef.current) fileInputRef.current.value = null;
            return;
        }
        setNewlySelectedFiles((prev) => [...prev, ...selectedFiles]);
    } else {
        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));
    }
  };

  const removeImage = (type, index) => {
    if (type === 'initial') {
      const updatedUrls = [...initialImageUrls];
      updatedUrls.splice(index, 1);
      setInitialImageUrls(updatedUrls);
    } else if (type === 'new') {
      const updatedFiles = [...newlySelectedFiles];
      const removedFile = updatedFiles.splice(index, 1)[0];
      setNewlySelectedFiles(updatedFiles);
      URL.revokeObjectURL(URL.createObjectURL(removedFile));
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };

  useEffect(() => {
    return () => {
      newlySelectedFiles.forEach((file) => URL.revokeObjectURL(URL.createObjectURL(file)));
    };
  }, [newlySelectedFiles]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ["title", "category", "price", "description", "postalCode", "name"];
    const hasEmptyField = requiredFields.some((field) => !formData[field]);

    if (hasEmptyField) {
      showErrorToast(t("form.allFieldsRequired"));
      return;
    }

    if (Object.keys(errors).some(key => errors[key])) {
      showErrorToast(t("editForm.fixErrorsPrompt"));
      return;
    }

    if (initialImageUrls.length + newlySelectedFiles.length === 0) {
        showErrorToast(t("form.picturesRequired"));
        return;
    }

    const updatedData = new FormData();

    // Append existing images (as strings/paths) and newly selected files
    initialImageUrls.forEach(url => updatedData.append("existingPictures", url));
    newlySelectedFiles.forEach(file => updatedData.append("newPictures", file));

    // Append all other form data, ensuring language fields are handled
    for (const key in formData) {
      if (key !== "pictures") {
        if (["title", "description", "name"].includes(key)) {
            updatedData.append(key, formData[key]);
        } else if (key === "category") {
            // Send English category value to backend using the helper
            updatedData.append(key, getEnglishCategoryValue(formData[key]));
        }
        else {
            updatedData.append(key, typeof formData[key] === "boolean" ? String(formData[key]) : formData[key]);
        }
      }
    }
    updatedData.append("inputLanguage", i18n.language); // Send current display language as input language

    try {
      const res = await fetch(`http://localhost:8080/api/products/product/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
        },
        body: updatedData,
      });

      const data = await res.json();
      if (res.ok) {
        showSuccessToast(t("editForm.adUpdatedSuccess"));
        navigate("/userinfo");
      } else {
        showErrorToast(data.message || t("editForm.failedToUpdateAd"));
      }
    } catch (err) {
      console.error(err);
      showErrorToast(t("editForm.somethingWentWrong"));
    }
  };


  return (
    <>
      <ToastifyContainer />
      <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-md w-full max-w-3xl space-y-6"
        >
          <h2 className="text-xl font-semibold text-green-700 border-b pb-2 mb-4">{t("editForm.editAdTitle")}</h2>

          {/* Title and Category */}
          <div className="flex flex-col gap-6">
            <TextField
              label={t("form.title")} // Use translated label
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              error={!!errors.title}
              helperText={errors.title || t("editForm.titleHelperText")}
            />

            <TextField
              select
              label={t("form.category")} // Use translated label
              name="category"
              value={formData.category} // formData.category will hold the translated string
              onChange={handleChange}
              fullWidth
            >
              {/* Map over categoryKeys and translate labels for display values */}
              {categoryKeys.map((key) => (
                <MenuItem key={key} value={t(key)}> {/* MenuItem value is the translated string */}
                  {t(key)}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              label="Condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              sx={{ width: "41rem" }}
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Like New">Like New</MenuItem>
              <MenuItem value="Used">Used</MenuItem>
              <MenuItem value="Defective/Need Repair">Defective/Need Repair</MenuItem>
            </TextField>
          </div>

          {/* Price and Description */}
          <div className="flex flex-col gap-6">
            <TextField
              label={t("form.price")} // Use translated label
              name="price"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{ endAdornment: <span className="text-gray-500">{t("form.currency")}</span> }}
            />

            <TextField
              label={t("form.description")} // Use translated label
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              helperText={`${maxDescriptionLength - formData.description.length} ${t("form.charactersLeft", { count: maxDescriptionLength - formData.description.length })}`}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label={t("form.postalCode")} // Use translated label
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              fullWidth
              error={!!errors.postalCode}
              helperText={errors.postalCode}
            />
            <TextField
              label={t("editForm.streetNoLabel")} // Use translated label
              name="streetNo"
              value={formData.streetNo}
              onChange={handleChange}
              fullWidth
            />
          </div>

          {/* Name */}
          <TextField
            label={t("editForm.yourNameLabel")} // Use translated label
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            error={!!errors.name}
            helperText={errors.name}
          />

          {/* Upload Section */}
          <div className="mt-6">
            <label className="block font-medium mb-2 text-sm text-gray-700">
              {t("editForm.uploadNewPicturesLabel")} // Use translated label
            </label>

            <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:border-green-600 transition-all">
              <input
                type="file"
                name="pictures"
                id="editFileUpload"
                multiple
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                ref={fileInputRef}
              />
              <label htmlFor="editFileUpload" className="cursor-pointer flex flex-col items-center">
                <CloudUploadIcon style={{ fontSize: 40, color: "gray" }} />
                <span className="text-gray-600 text-sm mt-2">{t("form.uploadTip")}</span>
                <span className="text-xs text-gray-500">{t("form.maxImagesTip")}</span>
              </label>
            </div>

            {/* Preview Existing Images */}
            {initialImageUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                    {initialImageUrls.map((url, index) => (
                        <div key={`initial-${index}`} className="relative">
                            <img
                                src={`http://localhost:8080/${url.replace(/\\/g, "/")}`}
                                alt={`${t("editForm.existingImageAlt")} ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-md border"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage('initial', index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Newly Selected Images */}
            {newlySelectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {newlySelectedFiles.map((file, index) => (
                  <div key={`new-${index}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`${t("editForm.previewImageAlt")} ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage('new', index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="contained"
              color="success"
              size="medium"
            >
              {t("editForm.updateAdButton")} // Use translated button text
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditForm;