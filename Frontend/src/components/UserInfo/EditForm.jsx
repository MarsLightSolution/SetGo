
import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../../Hooks/Tostify"


const EditForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const maxDescriptionLength = 1000;
  const token = localStorage.getItem("accessToken");
  const fileInputRef = useRef(null); // ✅ Ref added to reset inpu
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

  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/products/product/${id}`, {
          headers: { Authorization: `${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const product = data.data;
          setFormData((prev) => ({
            ...prev,
            ...product,
            postalCode: product?.location?.postalCode || "",
            streetNo: product?.location?.street || "",
          }));
        } else {
          showErrorToast("Failed to load ad data");
        }
      } catch (err) {
        console.log(err);
        showErrorToast("Error fetching ad");
      }
    };
    fetchAd();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    let updatedValue =
      type === "checkbox" ? checked : type === "file" ? files : value;

    let newErrors = { ...errors };

    if (name === "title") {
      if (!updatedValue.trim()) {
        newErrors.title = "Title is required";
      } else if (updatedValue.length > 24) {
        newErrors.title = "Title must be at most 24 characters";
      } else {
        delete newErrors.title;
      }
    }

    if (name === "price") {
      if (!updatedValue.trim()) {
        newErrors.price = "Price is required";
      } else if (!/^\d+$/.test(updatedValue)) {
        newErrors.price = "Only numbers allowed";
      } else {
        delete newErrors.price;
      }
    }

    if (name === "postalCode") {
      if (!updatedValue.trim()) {
        newErrors.postalCode = "Postal code is required";
      } else if (!/^\d{6}$/.test(updatedValue)) {
        newErrors.postalCode = "Postal code must be 6-digit number";
      } else {
        delete newErrors.postalCode;
      }
    }

    if (name === "name") {
      if (!updatedValue.trim()) {
        newErrors.name = "Name is required";
      } else if (!/^[A-Za-z\s]+$/.test(updatedValue)) {
        newErrors.name = "Only alphabets allowed";
      } else {
        delete newErrors.name;
      }
    }

    setErrors(newErrors);

    if (type === "file") {
      const fileArray = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        pictures: fileArray,
      }));

      const imagePreviews = fileArray.map((file) => URL.createObjectURL(file));
      setPreviewImages(imagePreviews);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: updatedValue,
      }));
    }
  };

  const removeImage = (index) => {
    const updatedPreviews = [...previewImages];
    const updatedFiles = [...formData.pictures];

    updatedPreviews.splice(index, 1);
    updatedFiles.splice(index, 1);

    setPreviewImages(updatedPreviews);
    setFormData((prev) => ({
      ...prev,
      pictures: updatedFiles,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  useEffect(() => {
    return () => {
      previewImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ["title", "category", "price", "description", "postalCode", "name"];
    const hasEmptyField = requiredFields.some((field) => !formData[field]);

    if (hasEmptyField) {
      showErrorToast("All fields are required");
      return;
    }

    if (Object.keys(errors).length > 0) {
      showErrorToast("Please fix the highlighted errors");
      return;
    }
    const updatedData = new FormData();

    for (const key in formData) {
      if (key === "pictures" && formData.pictures?.length > 0) {

        formData.pictures.forEach((file) => {
          updatedData.append("pictures", file);
        });
      } else {
        updatedData.append(key, formData[key]);
      }
    }

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
        showSuccessToast("Ad updated successfully!");
        navigate("/userinfo");
      } else {
        showErrorToast(data.message || "Failed to update ad");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Something went wrong");
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
          <h2 className="text-xl font-semibold text-green-700 border-b pb-2 mb-4">Edit Ad</h2>

          {/* Title and Category */}
          <div className="flex flex-col gap-6">
            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              error={!!errors.title}
              helperText={errors.title || "Only alphabets allowed (max 24 characters)"}
            />

            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Cars & Motorcycles">Cars & Motorcycles</MenuItem>
              <MenuItem value="Real Estate">Real Estate</MenuItem>
              <MenuItem value="Jobs">Jobs</MenuItem>
              <MenuItem value="Household & Furniture">Household & Furniture</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Leisure, Hobby & Neighborhood">Leisure, Hobby & Neighborhood</MenuItem>
              <MenuItem value="Service">Service</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
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
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              error={!!errors.price}
              helperText={errors.price}
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              helperText={`${maxDescriptionLength - formData.description.length} characters left`}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              fullWidth
              error={!!errors.postalCode}
              helperText={errors.postalCode}
            />
            <TextField
              label="Street No."
              name="streetNo"
              value={formData.streetNo}
              onChange={handleChange}
              fullWidth
            />
          </div>

          {/* Name */}
          <TextField
            label="Your Name"
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
              Upload New Pictures
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
                <span className="text-gray-600 text-sm mt-2">Click to upload or drag files here</span>
                <span className="text-xs text-gray-500">Max 8 images (12MB each)</span>
              </label>
            </div>

            {/* 👇 Preview Selected Images */}
            {previewImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {previewImages.map((src, index) => (
                  <div key={index} className="relative">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
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
              Update Ad
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditForm;
