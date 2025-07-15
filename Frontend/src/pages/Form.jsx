import React, { useState } from "react";
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
} from "@mui/material";
import Footer from "../components/common/Footer";
import toast from "react-hot-toast";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material"; // ✅ added

const Form = () => {
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
    subscribe: false,
    pictures: [], // 🔥 Important
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("name", formData.name);
    formDataToSend.append("offerType", formData.offerType);
    formDataToSend.append("termsAccepted", formData.termsAccepted ? "true" : "false");
    formDataToSend.append("showFullAddress", formData.showFullAddress ? "true" : "false");
    formDataToSend.append("subscribe", formData.subscribe ? "true" : "false");
    formDataToSend.append("postalCode", formData.postalCode);
    formDataToSend.append("streetNo", formData.streetNo || "");

    if (formData.pictures && formData.pictures.length > 0) {
      for (let i = 0; i < formData.pictures.length; i++) {
        formDataToSend.append("pictures", formData.pictures[i]);
      }
    }

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
        toast.success("Form submitted successfully");
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
          subscribe: false,
          pictures: [],
        });

        e.target.reset();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error submitting ad:", error);
      toast.error("Failed to submit form");
    }
  };

  return (
    <>
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
            <FormControl component="fieldset" className="mb-4 ">
              <FormLabel>Bid Request</FormLabel>
              <RadioGroup
                row
                name="offerType"
                value={formData.offerType}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="offer"
                  control={<Radio />}
                  label="I offer"
                />
                <FormControlLabel
                  value="looking"
                  control={<Radio />}
                  label="I am looking for"
                />
              </RadioGroup>
            </FormControl>

            <div className="flex flex-col gap-4 ">
              <div className="m-2">
                <TextField
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  sx={{ width: "40rem" }}
                  helperText="Tip: You sell better with a meaningful title"
                />
              </div>

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
                helperText="You have 4000 characters left"
              />
            </div>

            {/* Upload Section */}
            <div className="mt-4">
              <label className="block font-medium mb-2">
                Pictures (recommended)
              </label>

              <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:border-green-600 transition-all">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="fileUpload"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pictures: Array.from(e.target.files),
                    })
                  }
                  className="hidden"
                />
                <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
                  <CloudUploadIcon style={{ fontSize: 40, color: "gray" }} />
                  <span className="text-gray-600 text-sm mt-2">Click to upload or drag files here</span>
                  <span className="text-xs text-gray-500">Max 20 images (12MB each)</span>
                </label>
              </div>

              {/* ✅ Show selected file names */}
              {formData.pictures.length > 0 && (
                <div className="mt-3 text-left text-sm text-gray-700">
                  <p className="font-medium mb-1">Selected Images:</p>
                  <ul className="list-disc ml-6">
                    {formData.pictures.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}

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
                    name="changeOrder"
                    checked={formData.changeOrder}
                    onChange={handleChange}
                  />
                }
                label="Move to change the order"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">
              Location
            </h2>
            <div className="flex gap-4 mb-4">
              <TextField
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                sx={{ width: "10rem" }}
              />
              <TextField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                fullWidth
              />
            </div>

            <TextField
              className="mt-4"
              label="Street No. (optional)"
              name="streetNo"
              value={formData.streetNo}
              onChange={handleChange}
              fullWidth
              helperText="Tip: By default, we only display the postal code and city. To show full address, check the box below."
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
              fullWidth
              helperText={
                <span>
                  Tip: You can change your profile name at any time in settings.{" "}
                  <br />
                  <strong>Note:</strong> Missing your phone number? We've
                  removed it to protect your privacy. See our{" "}
                  <a href="#" className="text-blue-600 underline">
                    help center
                  </a>
                  .
                </span>
              }
            />
          </div>

          {/* Footer */}
          <div className="pt-6 border-t">
            <FormControlLabel
              control={
                <Checkbox
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                />
              }
              label="Yes, send me product updates, promotions and tips via email."
            />
            <p className="text-xs text-gray-500 mt-2">
              Our{" "}
              <a href="#" className="text-blue-600 underline">
                terms of use
              </a>{" "}
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
