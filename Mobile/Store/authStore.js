import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showSuccessToast, showErrorToast } from "../utils/toastify"; // adjust path

const API_BASE = "http://localhost:8080"; // update if different

export const useAuthStore = create((set, get) => ({
  userId: null,
  userName: null,
  accessToken: null,
  error: null,
  loading: false,

  // 🔹 Load stored data on app start
  loadAuth: async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUserName = await AsyncStorage.getItem("userName");
      const storedAccessToken = await AsyncStorage.getItem("accessToken");

      set({
        userId: storedUserId || null,
        userName: storedUserName || null,
        accessToken: storedAccessToken || null,
        loading: false,
      });
    } catch (err) {
      console.error("Error loading auth:", err);
      showErrorToast("Failed to load auth data"); // toastify
      set({ userId: null, userName: null, accessToken: null, loading: false });
    }
  },

  // 🔹 Login API
login: async (email, password) => {
  try {
    set({ loading: true, error: null });

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json(); // parse JSON response

    if (!res.ok) {
      const errorMsg = data?.message || "Login failed";
      set({ error: errorMsg, loading: false });
      return { success: false, message: errorMsg }; // return message
    }

    await AsyncStorage.setItem("userId", data.userId);
    await AsyncStorage.setItem("userName", data.userName);
    await AsyncStorage.setItem("accessToken", data.accessToken);

    set({
      userId: data.userId,
      userName: data.userName,
      accessToken: data.accessToken,
      loading: false,
    });

    return { success: true, message: "Login successful!" };
  } catch (err) {
    console.error("Login error:", err);
    const msg = err?.message || "Network error";
    set({ error: msg, loading: false });
    return { success: false, message: msg };
  }
},

  // 🔹 Logout API
  logout: async () => {
    try {
      const { accessToken } = get();
      set({ loading: true });

      await fetch(`${API_BASE}/logout`, {
        method: "POST",
        headers: { Authorization: accessToken },
      });

      await AsyncStorage.multiRemove(["userId", "userName", "accessToken"]);

      set({ userId: null, userName: null, accessToken: null, loading: false });
      showSuccessToast("Logged out successfully!"); // toastify
    } catch (err) {
      console.error("Logout error:", err);
      showErrorToast("Logout failed"); // toastify
      set({ loading: false });
    }
  },
}));
