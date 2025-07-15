// utils/setupAutoTokenRefresh.js
const setupAutoTokenRefresh = () => {
  const refreshInterval = setInterval(async () => {
    try {
      const res = await fetch("http://localhost:8080/refreshAccessToken", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        console.log("✅ Token refreshed");
      } else {
        console.warn("⚠️ Token refresh failed:", data?.message || data?.error);
        clearInterval(refreshInterval);
      }
    } catch (err) {
      console.error("❌ Token refresh error:", err);
      clearInterval(refreshInterval);
    }
  }, 14 * 60 * 1000); // 14 minutes
};

export default setupAutoTokenRefresh;
