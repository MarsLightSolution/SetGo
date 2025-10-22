import axios from "axios";

const BASE_URL = "http://localhost:8080/concern";

// ========= Close Concern with Admin Message (Main Close API) =========
export const closeConcernWithMessage = async (concernId, adminId, adminMessage) => {
  try {
    const response = await axios.post(`${BASE_URL}/${concernId}/close`, {
      adminId,
      adminMessage,
    });
    return response.data;
  } catch (error) {
    console.error("Error closing concern:", error);
    throw error;
  }
};

// ========= Add Admin Response (without closing) =========
export const addAdminResponse = async (concernId, adminId, message) => {
  try {
    const response = await axios.post(`${BASE_URL}/${concernId}/response`, {
      adminId,
      message,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding admin response:", error);
    throw error;
  }
};

// ========= Update Concern Status =========
export const updateConcernStatus = async (concernId, status) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${concernId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating concern status:", error);
    throw error;
  }
};

// ========= Reopen Concern =========
export const reopenConcern = async (concernId, reason) => {
  try {
    const response = await axios.post(`${BASE_URL}/${concernId}/reopen`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("Error reopening concern:", error);
    throw error;
  }
};

// ========= Get All Concerns (Admin) =========
export const getAllConcerns = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.issueType) params.append("issueType", filters.issueType);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await axios.get(`${BASE_URL}/admin/all?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all concerns:", error);
    throw error;
  }
};

// ========= Get Concern Statistics =========
export const getConcernStatistics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/statistics`);
    return response.data;
  } catch (error) {
    console.error("Error fetching concern statistics:", error);
    throw error;
  }
};

// ========= Get User Concerns =========
export const getUserConcerns = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user concerns:", error);
    throw error;
  }
};

// ========= Get Concern Details =========
export const getConcernDetails = async (concernId, userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/${concernId}?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching concern details:", error);
    throw error;
  }
};

// ========= Raise New Concern =========
export const raiseConcern = async (concernData) => {
  try {
    const response = await axios.post(`${BASE_URL}/raise`, concernData);
    return response.data;
  } catch (error) {
    console.error("Error raising concern:", error);
    throw error;
  }
};

// ========= DEPRECATED: Old closeQuery function =========
// This was the old API - kept for backward compatibility
// Use closeConcernWithMessage instead
export const closeQuery = async (concernId) => {
  console.warn(
    "closeQuery is deprecated. Use closeConcernWithMessage instead."
  );
  try {
    const response = await axios.patch(`${BASE_URL}/${concernId}/status`, {
      status: "closed",
    });
    return response.data;
  } catch (error) {
    console.error("Error closing query:", error);
    throw error;
  }
};

// ========= DEPRECATED: Old sendAdminMessage function =========
// This was the old API - kept for backward compatibility
// Use addAdminResponse instead
export const sendAdminMessage = async (concernId, message) => {
  console.warn(
    "sendAdminMessage is deprecated. Use addAdminResponse instead."
  );
  try {
    const response = await axios.post(`${BASE_URL}/${concernId}/response`, {
      adminId: null,
      message,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending admin message:", error);
    throw error;
  }
};