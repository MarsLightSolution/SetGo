import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "./Hooks/Tostify";
import { Upload, X, CheckCircle, AlertCircle, HelpCircle, Send } from "lucide-react";

// ✅ Backend Base URL
const BACKEND_URL = "http://localhost:8080";

export default function RaiseQuery() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") || "68b1e2fa927f21500b024dd0";

  const [formData, setFormData] = useState({
    issueType: "order_issue",
    orderId: "",
    transactionId: "",
    walletId: "",
    sellerId: "",
    adId: "",
    message: "",
  });

  // ✅ FIXED: Store actual File objects separately from previews
  const [imageFiles, setImageFiles] = useState([]); // Actual File objects for upload
  const [imagePreviews, setImagePreviews] = useState([]); // Blob URLs for preview only

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const issueTypes = [
    { value: "order_issue", label: "Order Issue", icon: "📦", requiresOrderId: true },
    { value: "payment_issue", label: "Payment Issue", icon: "💳", requiresTransactionId: true },
    { value: "tracking_issue", label: "Tracking Issue", icon: "📍", requiresOrderId: true },
    { value: "cancellation_issue", label: "Cancellation Request", icon: "❌", requiresOrderId: true },
    { value: "wallet_issue", label: "Wallet Issue", icon: "💰", requiresWalletId: true },
    { value: "seller_buyer_issue", label: "Seller/Buyer Issue", icon: "👥", requiresSellerId: true },
    { value: "ad_report", label: "Report Ad/Seller", icon: "🚩", requiresAdId: true },
    { value: "others", label: "Others", icon: "📝", requiresNothing: true },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ FIXED: Properly handle image upload - store File objects
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total count (existing + new)
    const totalCount = imageFiles.length + files.length;
    if (totalCount > 3) {
      showErrorToast("Maximum 3 images allowed");
      return;
    }

    // Validate each file
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        showErrorToast(`${file.name} is not an image file`);
        continue;
      }

      // Check file size (5MB limit)
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 5) {
        showErrorToast(`${file.name} exceeds 5MB limit (${sizeInMB.toFixed(2)}MB)`);
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
      showSuccessToast(`${validFiles.length} image(s) added`);
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // ✅ FIXED: Clean up blob URLs when removing images
  const removeImage = (idx) => {
    // Revoke the blob URL to free memory
    URL.revokeObjectURL(imagePreviews[idx]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const validateForm = () => {
    const issue = formData.issueType;
    
    if (!userId) {
      showErrorToast("User ID missing. Please log in again.");
      return false;
    }
    
    if (issue === "order_issue" && !formData.orderId) {
      showErrorToast("Order ID is required for order issues.");
      return false;
    }
    
    if (issue === "tracking_issue" && !formData.orderId) {
      showErrorToast("Order ID is required for tracking issues.");
      return false;
    }
    
    if (issue === "cancellation_issue" && !formData.orderId) {
      showErrorToast("Order ID is required for cancellation requests.");
      return false;
    }
    
    if (issue === "payment_issue" && !formData.transactionId) {
      showErrorToast("Transaction ID is required for payment issues.");
      return false;
    }
    
    if (issue === "wallet_issue" && !formData.walletId) {
      showErrorToast("Wallet ID is required for wallet issues.");
      return false;
    }
    
    if (issue === "seller_buyer_issue" && !formData.sellerId) {
      showErrorToast("Seller ID is required for seller/buyer issues.");
      return false;
    }
    
    if (issue === "ad_report" && !formData.adId) {
      showErrorToast("Ad/Product ID is required to report.");
      return false;
    }
    
    if (imageFiles.length > 3) {
      showErrorToast("You can upload a maximum of 3 images.");
      return false;
    }
    
    if (formData.message.trim().length < 10) {
      showErrorToast("Please provide a detailed description (min 10 characters).");
      return false;
    }
    
    return true;
  };

  // ✅ FIXED: Use FormData instead of JSON for proper file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Create FormData for multipart/form-data submission
      const submitData = new FormData();

      // Append all text fields
      submitData.append("userId", userId);
      submitData.append("issueType", formData.issueType);
      submitData.append("orderId", formData.orderId || "");
      submitData.append("transactionId", formData.transactionId || "");
      submitData.append("walletId", formData.walletId || "");
      submitData.append("sellerId", formData.sellerId || "");
      submitData.append("adId", formData.adId || "");
      submitData.append("message", formData.message);

      // ✅ Append actual File objects - this is the key fix!
      imageFiles.forEach((file, index) => {
        submitData.append("images", file);
        console.log(`Appending image ${index + 1}:`, file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
      });

      console.log("Submitting form with", imageFiles.length, "images");

      // ✅ Use fetch or axios without setting Content-Type (let browser set it with boundary)
      const response = await fetch(`${BACKEND_URL}/concern/raise`, {
        method: "POST",
        body: submitData,
        // DO NOT set Content-Type header - browser will set it automatically with boundary
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccessToast("✅ Query raised successfully!");
        setSuccess(true);
        
        // Clean up blob URLs
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        
        setTimeout(() => navigate("/my-queries"), 1500);
      } else {
        showErrorToast(data.message || "Failed to submit query.");
      }
    } catch (error) {
      console.error("Error raising query:", error);
      const msg =
        error.response?.data?.message ||
        (error.message.includes("Network")
          ? "Network error: Cannot reach server."
          : "Something went wrong. Please try again later.");
      showErrorToast(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedIssue = issueTypes.find((t) => t.value === formData.issueType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:py-12 flex justify-center">
      <ToastifyContainer />

      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-4 sm:gap-6 mb-6">
          <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Raise a Support Query
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              We're here to help you. Tell us what's wrong and we'll get back to you soon.
            </p>
          </div>
        </div>

        {success ? (
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg">
              <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Query Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-2">
              Your ticket has been created and our support team has been notified.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              We'll respond within 24–48 hours via email or in your query dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/my-queries")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                View My Queries
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <span className="mr-2">🎯</span>
                What can we help you with?
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:outline-none transition-all text-base font-medium shadow-sm hover:shadow-md cursor-pointer"
              >
                {issueTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {selectedIssue?.requiresOrderId && (
                <InputField 
                  label="Order ID" 
                  name="orderId" 
                  value={formData.orderId} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., ORD123456789"
                  icon="📦"
                />
              )}
              {selectedIssue?.requiresTransactionId && (
                <InputField
                  label="Transaction ID"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleChange}
                  required
                  placeholder="e.g., TXN987654321"
                  icon="💳"
                />
              )}
              {selectedIssue?.requiresWalletId && (
                <InputField 
                  label="Wallet ID" 
                  name="walletId" 
                  value={formData.walletId} 
                  onChange={handleChange}
                  required
                  placeholder="e.g., WAL123456789"
                  icon="💰"
                />
              )}
              {selectedIssue?.requiresSellerId && (
                <InputField 
                  label="Seller ID" 
                  name="sellerId" 
                  value={formData.sellerId} 
                  onChange={handleChange}
                  required
                  placeholder="e.g., SEL123456789"
                  icon="👤"
                />
              )}
              {selectedIssue?.requiresAdId && (
                <InputField 
                  label="Ad/Product ID" 
                  name="adId" 
                  value={formData.adId} 
                  onChange={handleChange}
                  required
                  placeholder="e.g., AD123456789"
                  icon="🏷️"
                />
              )}
            </div>

            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <span className="mr-2">✍️</span>
                Describe Your Issue
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  placeholder="Please provide as much detail as possible to help us resolve your issue quickly. Include any relevant information like dates, amounts, or error messages..."
                  className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:outline-none transition-all resize-none text-base leading-relaxed shadow-sm hover:shadow-md"
                  rows={6}
                />
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className={`text-sm flex items-center gap-1.5 ${formData.message.length < 10 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  {formData.message.length < 10 && <AlertCircle className="w-4 h-4" />}
                  Minimum 10 characters required
                </span>
                <span className={`text-sm font-medium ${formData.message.length > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {formData.message.length}/500
                </span>
              </div>
            </div>

            {/* ✅ FIXED: Image Upload Section */}
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <span className="mr-2">📸</span>
                Upload Images
                <span className="text-gray-400 text-xs font-normal ml-2">(Optional, Max 3)</span>
              </label>
              
              <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all group shadow-sm ${
                imageFiles.length >= 3 
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                  : 'border-gray-300 cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50/30 hover:from-blue-50/50 hover:to-indigo-50/50 hover:border-blue-400 hover:shadow-md'
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    imageFiles.length >= 3 ? 'bg-gray-200' : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                    <Upload className={`w-6 h-6 transition-colors ${
                      imageFiles.length >= 3 ? 'text-gray-400' : 'text-blue-600 group-hover:text-blue-700'
                    }`} />
                  </div>
                  <p className={`text-sm font-semibold mb-1 ${
                    imageFiles.length >= 3 ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {imageFiles.length >= 3 ? 'Maximum images reached' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (Max 3 files, 5MB each)</p>
                  {imageFiles.length > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold mt-2">
                      {imageFiles.length}/3 images selected
                    </p>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageFiles.length >= 3}
                />
              </label>

              {/* ✅ Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
                  {imagePreviews.map((previewUrl, idx) => (
                    <div key={idx} className="relative group">
                      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all">
                        <img
                          src={previewUrl}
                          alt={`preview-${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        {/* Image info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">
                            {imageFiles[idx]?.name || `Image ${idx + 1}`}
                          </p>
                          <p className="text-white/70 text-xs">
                            {((imageFiles[idx]?.size || 0) / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 hover:scale-110 transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Quick Response Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Provide order/transaction IDs for faster resolution</li>
                    <li>• Include screenshots if applicable</li>
                    <li>• Check your email for updates from our support team</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mx-auto w-48 py-3 rounded-xl font-semibold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Query
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange, required, placeholder, icon }) {
  return (
    <div>
      <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-4 bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:outline-none transition-all text-base shadow-sm hover:shadow-md"
      />
    </div>
  );
}