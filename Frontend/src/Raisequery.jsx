import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "./Hooks/Tostify"; // Adjust the path as necessary

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
    images: [],
  });

  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const issueTypes = [
    { value: "order_issue", label: "Order Issue", requiresOrderId: true },
    { value: "payment_issue", label: "Payment Issue", requiresTransactionId: true },
    { value: "tracking_issue", label: "Tracking Issue", requiresOrderId: true },
    { value: "cancellation_issue", label: "Cancellation Request", requiresOrderId: true },
    { value: "wallet_issue", label: "Wallet Issue", requiresWalletId: true },
    { value: "seller_buyer_issue", label: "Seller/Buyer Issue", requiresSellerId: true },
    { value: "ad_report", label: "Report Ad/Seller", requiresAdId: true },
    { value: "others", label: "Others", requiresNothing: true },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreview(previews);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setFormData({ ...formData, images: imageUrls });
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
    if (issue === "payment_issue" && !formData.transactionId) {
      showErrorToast("Transaction ID is required for payment issues.");
      return false;
    }
    if (formData.images.length > 3) {
      showErrorToast("You can upload a maximum of 3 images.");
      return false;
    }
    if (formData.message.trim().length < 10) {
      showErrorToast("Please provide a detailed description (min 10 characters).");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:8080/concern/raise", {
        userId,
        ...formData,
      });

      if (data.success) {
        showSuccessToast("✅ Query raised successfully!");
        setSuccess(true);
        setTimeout(() => navigate("/my-queries"), 1500);
      } else {
        showErrorToast(data.message || "Unexpected response from server.");
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
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", fontFamily: "Poppins, sans-serif" }}>
      <ToastifyContainer />
      <h2 style={{ textAlign: "center", color: "#0078ff", marginBottom: "30px" }}>
        🎫 Raise a Query
      </h2>

      {success ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#e8f5e9", borderRadius: "12px" }}>
          <h3 style={{ color: "#4caf50" }}>✅ Query Raised Successfully!</h3>
          <p>Our support team will respond within 24–48 hours.</p>
          <button
            onClick={() => navigate("/my-queries")}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              background: "#0078ff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            View My Queries
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: "#f9f9f9", padding: "30px", borderRadius: "16px" }}>
          {/* Issue Type */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Issue Type *</label>
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            >
              {issueTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Inputs */}
          {selectedIssue?.requiresOrderId && (
            <InputField label="Order ID *" name="orderId" value={formData.orderId} onChange={handleChange} required />
          )}
          {selectedIssue?.requiresTransactionId && (
            <InputField
              label="Transaction ID *"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              required
            />
          )}
          {selectedIssue?.requiresWalletId && (
            <InputField label="Wallet ID" name="walletId" value={formData.walletId} onChange={handleChange} />
          )}
          {selectedIssue?.requiresSellerId && (
            <InputField label="Seller ID" name="sellerId" value={formData.sellerId} onChange={handleChange} />
          )}
          {selectedIssue?.requiresAdId && (
            <InputField label="Ad/Product ID" name="adId" value={formData.adId} onChange={handleChange} />
          )}

          {/* Message */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Describe Your Issue * (Max 500 characters)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              maxLength={500}
              placeholder="Please describe your issue in detail..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
                minHeight: "120px",
                resize: "vertical",
              }}
            />
            <small style={{ color: "#666" }}>{formData.message.length}/500 characters</small>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Upload Images (Max 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
              }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
              {imagePreview.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`preview-${idx}`}
                  style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#ccc" : "#0078ff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Submit Query"}
          </button>
        </form>
      )}
    </div>
  );
}

// Common Input Field Component for readability
function InputField({ label, name, value, onChange, required }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={`Enter ${label}`}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          fontSize: "14px",
        }}
      />
    </div>
  );
}
