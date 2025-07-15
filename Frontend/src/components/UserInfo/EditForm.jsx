import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const EditForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    offerType: "offer",
    title: "",
    category: "",
    price: "",
    description: "",
    postalCode: "",
    streetNo: "",
    showFullAddress: false,
    name: "",
    termsAccepted: false,
    subscribe: false,
    pictures: [], // for new uploads
  });

  const token = localStorage.getItem("accessToken");

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
          toast.error("Failed to load ad data");
        }
      } catch (err) {
        console.log(err);
        toast.error("Error fetching ad");
      }
    };
    fetchAd();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked :
        type === "file" ? Array.from(files) :
        value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        toast.success("Ad updated successfully!");
        navigate("/userinfo");
      } else {
        toast.error(data.message || "Failed to update ad");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
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
        </div>

        {/* Price and Description */}
        <div className="flex flex-col gap-6">
          <TextField
            label="Price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
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
        />

        {/* Upload */}
        <div className="mt-6">
          <label className="block font-medium mb-2 text-sm text-gray-700">Upload New Pictures</label>
          <input
            type="file"
            name="pictures"
            multiple
            accept="image/*"
            onChange={handleChange}
          />
          <p className="text-sm text-gray-500 mt-2">
            Tip: Upload up to 20 images (max size 12 MB).
          </p>
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
  );
};

export default EditForm;
