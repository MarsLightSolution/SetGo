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
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    const form=e.target;
    const formDataToSend=new FormData();
  formDataToSend.append("title", formData.title);
  formDataToSend.append("category", formData.category);
  formDataToSend.append("price", formData.price);
  formDataToSend.append("description", formData.description);
  formDataToSend.append("name", formData.name);
  formDataToSend.append("offerType", formData.offerType);
  formDataToSend.append("termsAccepted", formData.termsAccepted ? "true" : "false");
  formDataToSend.append("showFullAddress", formData.showFullAddress ? "true" : "false");
  formDataToSend.append("subscribe", formData.subscribe ? "true" : "false");

  // Nested object field: location
  formDataToSend.append("location[postalCode]", formData.postalCode);
  formDataToSend.append("location[streetNo]", formData.streetNo || "");

  // File uploads: pictures (assumed as multiple)
  if (formData.pictures && formData.pictures.length > 0) {
    for (let i = 0; i < formData.pictures.length; i++) {
      formDataToSend.append("pictures", formData.pictures[i]);
    }
  }

  try{
    const res=await fetch("http://localhost:8080/api/products/add",{
      method:"POST",
      body:formDataToSend,
    });
    if(!res.ok){
      throw new Error("Failed to submit form");
    }
    const data = await response.json();
    console.log("Ad submitted successfully:", data);
  } catch (error) {
    console.error("Error submitting ad:", error);
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
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">Ad details</h2>

          {/* Offer Type */}
        
            <FormControl component="fieldset" className="mb-4 ">
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

          <div className="flex flex-col gap-4 ">
            <div className="m-2">
            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              sx={{width:"40rem"}}
              helperText="Tip: You sell better with a meaningful title"
            />
            </div>

            <TextField
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              sx={{width:"41rem"}}
            >
              <MenuItem value="">Choose your category</MenuItem>
              <MenuItem value="electronics">Electronics</MenuItem>
              <MenuItem value="books">Books</MenuItem>
              <MenuItem value="furniture">Furniture</MenuItem>
            </TextField>

            <TextField
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              sx={{width:"41rem"}}
              InputProps={{ endAdornment: <span className="text-gray-500">EUR</span> }}
            />

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              sx={{width:"41rem"}}

              helperText="You have 4000 characters left"
            />
          </div>

          {/* Upload Section */}
          <div className="mt-4">
            <label className="block font-medium mb-2">Pictures (recommended)</label>
            <input type="file" multiple accept="image/*" />
            <p className="text-sm text-gray-500 mt-2">
              Tip: Upload up to 20 images (max size 12 MB). Images will be perfect with our{" "}
              <a href="#" className="text-blue-600 underline">Phototips</a>.
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
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">Location</h2>
          <div className="flex gap-4 mb-4">
            <TextField
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              sx={{width:"10rem"}}/>
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
        </div>

        {/* Your Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-green-700">Your details</h2>
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            helperText={
              <span>
                Tip: You can change your profile name at any time in settings. <br />
                <strong>Note:</strong> Missing your phone number? We've removed it to protect your privacy. See our{" "}
                <a href="#" className="text-blue-600 underline">help center</a>.
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
            Our <a href="#" className="text-blue-600 underline">terms of use</a> apply. For privacy info, see our policy.
          </p>
        </div>
          <Button type="submit" variant="contained" color="success" className="mt-8">
            Publish your ad
          </Button>
      </form>
    </div>
      <Footer/>
      </>
  );
};

export default Form;

