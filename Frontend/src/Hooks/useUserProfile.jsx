import { useState, useEffect } from "react";

// Define default schema
const defaultProfile = {
  username: "",
  email: "",
  emailVerified: false,
  phoneNumber: "",
  billingAddress: "",
  deliveryAddress: "",
  newsletter: false,
  messageforuser: false,
  messagesFromUsers: [],
  paymentAccounts: [],
  activity: [],
  createdAt: "",
  updatedAt: "",
  refreshToken: "",
};

const useUserProfile = () => {
  const [profile, setProfile] = useState(() => {
    // Load from localStorage only once during initialization
    const stored = localStorage.getItem("userData");
    try {
      return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
    } catch (err) {
      // Failed to parse userData - using default profile
      return defaultProfile;
    }
  });

  const [loading, setLoading] = useState(false);

  // Update a specific field
  const updateField = (key, value) => {
    const updatedProfile = { ...profile, [key]: value };
    setProfile(updatedProfile);
    localStorage.setItem("userData", JSON.stringify(updatedProfile)); // Save immediately
  };

  // Save full profile (if needed after batch updates)
  const saveProfile = async () => {
    try {
      setLoading(true);
      localStorage.setItem("userData", JSON.stringify(profile));
    } catch (err) {
      // Error saving profile
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    updateField,
    saveProfile,
    setProfile,
  };
};

export default useUserProfile;
