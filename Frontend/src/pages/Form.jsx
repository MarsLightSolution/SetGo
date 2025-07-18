import React, { useState, useRef } from "react";
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
import Footer from "../components/common/Footer";
import { CloudUpload as CloudUploadIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";

const Form = () => {
  const maxDescriptionLength = 1000;
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    offerType: "offer",
    title: "",
    category: "",
    price: "",
    description: "",
    postalCode: "",
    location: "",
    streetNo: "",
    showFullAddress: false,
    name: "",
    termsAccepted: false,
    pictures: [],
  });

  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    let updatedValue = type === "checkbox" ? checked : type === "file" ? files : value;
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

    if (name === "location") {
      if (!updatedValue.trim()) {
        newErrors.location = "Location is required";
      } else if (updatedValue.length > 50) {
        newErrors.location = "Max 50 characters allowed";
      } else {
        delete newErrors.location;
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

    if (name === "pictures") {
      const filesArray = Array.from(files);
      const previews = filesArray.map((file) => URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        pictures: filesArray,
      }));
      setImagePreviews(previews);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: updatedValue,
      }));
    }

    setErrors(newErrors);
  };

  const removeImage = (index) => {
    const updatedPictures = [...formData.pictures];
    const updatedPreviews = [...imagePreviews];
    updatedPictures.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setFormData((prev) => ({ ...prev, pictures: updatedPictures }));
    setImagePreviews(updatedPreviews);

    // Reset input value to allow re-selecting the same image
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields
    const requiredFields = [
      "title",
      "category",
      "price",
      "description",
      "postalCode",
      "location",
      "name",
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        showErrorToast("All fields are required");
        return;
      }
    }

    if (!formData.termsAccepted) {
      showErrorToast("You must accept the terms and conditions");
      return;
    }

    if (Object.keys(errors).length > 0) {
      showErrorToast("All fields are required");
      return;
    }

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "pictures" && value.length > 0) {
        value.forEach((file) => formDataToSend.append("pictures", file));
      } else {
        formDataToSend.append(key, typeof value === "boolean" ? String(value) : value);
      }
    });

    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch("http://localhost:8080/api/products/add", {
        method: "POST",
        headers: {
          Authorization: `${token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        showSuccessToast("Form submitted successfully");
        setFormData({
          offerType: "offer",
          title: "",
          category: "",
          price: "",
          description: "",
          postalCode: "",
          location: "",
          streetNo: "",
          showFullAddress: false,
          name: "",
          termsAccepted: false,
          pictures: [],
        });
        setImagePreviews([]);
        e.target.reset();
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        showErrorToast(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error submitting ad:", error);
      showErrorToast("Failed to submit form");
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
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">
              Ad details
            </h2>

            {/* Offer Type */}
            <FormControl component="fieldset" className="mb-4">
              <FormLabel>Bid Request</FormLabel>
              <RadioGroup
                row
                name="offerType"
                value={formData.offerType}
                onChange={handleChange}
              >
                <FormControlLabel value="offer" control={<Radio />} label="I offer" />
                <FormControlLabel value="looking" control={<Radio />} label="I am looking for" />
              </RadioGroup>
            </FormControl>

            <div className="flex flex-col gap-4">
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title || "Tip: You sell better with a meaningful title"}
                sx={{ width: "40rem" }}
              />

              <TextField
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                sx={{ width: "41rem" }}
              >
                <MenuItem value="">Choose your category</MenuItem>
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
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price}
                sx={{ width: "41rem" }}
                InputProps={{
                  endAdornment: <span className="text-gray-500">EUR</span>,
                }}
              />

              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                sx={{ width: "41rem" }}
                helperText={`${maxDescriptionLength - formData.description.length} characters left`}
              />
            </div>

            {/* Upload Section */}
            <div className="mt-4">
              <label className="block font-medium mb-2">
                Pictures <span className="text-red-600">*</span>
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
                <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                  <CloudUploadIcon style={{ fontSize: 40, color: "gray" }} />
                  <span className="text-gray-600 text-sm mt-2">Click to upload or drag files here</span>
                  <span className="text-xs text-gray-500">Max 8 images (12MB each)</span>
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap mt-4 gap-3">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden">
                      <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                      <IconButton
                        size="small"
                        onClick={() => removeImage(idx)}
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

              {/* <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                sx={{ width: "41rem" }}
                helperText="You have 4000 characters left"
              /> */}
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">Location</h2>
            <div className="flex gap-4 mb-4">
              <TextField
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                error={!!errors.postalCode}
                helperText={errors.postalCode}
                sx={{ width: "10rem" }}
              />
              <TextField
                label="Location"
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
              label="Street No. (optional)"
              name="streetNo"
              value={formData.streetNo}
              onChange={handleChange}
              helperText="Tip: By default, we only display the postal code and city. To show full address, check the box below."
              fullWidth
            />
            {/* <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              sx={{ width: "41rem" }}
              helperText="You have 4000 characters left"
            /> */}
          </div>

          {/* Upload Section */}
          {/* <div className="mt-4">
            <label className="block font-medium mb-2">
              Pictures (recommended)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pictures: Array.from(e.target.files),
                })
              }
            />
            <p className="text-sm text-gray-500 mt-2">
              Tip: Upload up to 20 images (max size 12 MB). Images will be
              perfect with our{" "}
              <a href="#" className="text-blue-600 underline">
                Phototips
              </a>
              .
            </p>
            <FormControlLabel
              control={
                <Checkbox
                  name="showFullAddress"
                  checked={formData.showFullAddress}
                  onChange={handleChange}
                />
              }
              label="Show full address"
            />
          </div> */}

          {/* Your Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">
              Your details
            </h2>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={
                errors.name || (
                  <span>
                    Tip: You can change your profile name at any time in settings. <br />
                    <strong>Note:</strong> We've removed phone numbers for privacy. See our{" "}
                    <a href="#" className="text-blue-600 underline">help center</a>.
                  </span>
                )
              }
              fullWidth
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
              label="I accept the terms and conditions"
            />
            <p className="text-xs text-gray-500 mt-2">
              Our{" "}
              <a href="#" className="text-blue-600 underline">terms of use</a>{" "}
              apply. For privacy info, see our policy.
            </p>
          </div>

          <Button
            type="submit"
            variant="contained"
            color="success"
            className="mt-8"
          >
            Publish your ad
          </Button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Form;
