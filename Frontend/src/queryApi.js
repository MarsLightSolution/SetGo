import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_SERVER}/concern`;

// SECURITY: every /concern endpoint now requires a verified login (see
// backend/Routes/concernRoutes.js) - identity is derived server-side from this
// token, never from an id passed in the request body/query.
const authHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ========= Close Concern with Admin Message (Main Close API) =========
export const closeConcernWithMessage = async (concernId, adminMessage) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/${concernId}/close`,
      { adminMessage },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error closing concern:", error);
    throw error;
  }
};

// ========= Add Admin Response (without closing) =========
export const addAdminResponse = async (concernId, message) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/${concernId}/response`,
      { message },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding admin response:", error);
    throw error;
  }
};

// ========= Update Concern Status =========
export const updateConcernStatus = async (concernId, status) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/${concernId}/status`,
      { status },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating concern status:", error);
    throw error;
  }
};

// ========= Reopen Concern =========
export const reopenConcern = async (concernId, reason) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/${concernId}/reopen`,
      { reason },
      { headers: authHeaders() }
    );
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

    const response = await axios.get(`${BASE_URL}/admin/all?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all concerns:", error);
    throw error;
  }
};

// ========= Get Concern Statistics =========
export const getConcernStatistics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/statistics`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching concern statistics:", error);
    throw error;
  }
};

// ========= Get User Concerns =========
export const getUserConcerns = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/user`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching user concerns:", error);
    throw error;
  }
};

// ========= Get Concern Details =========
export const getConcernDetails = async (concernId) => {
  try {
    const response = await axios.get(`${BASE_URL}/${concernId}`, { headers: authHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error fetching concern details:", error);
    throw error;
  }
};

// ========= Raise New Concern =========
export const raiseConcern = async (concernData) => {
  try {
    const response = await axios.post(`${BASE_URL}/raise`, concernData, {
      headers: authHeaders(),
    });
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
    const response = await axios.patch(
      `${BASE_URL}/${concernId}/status`,
      { status: "closed" },
      { headers: authHeaders() }
    );
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
    const response = await axios.post(
      `${BASE_URL}/${concernId}/response`,
      { message },
      { headers: authHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending admin message:", error);
    throw error;
  }
};
