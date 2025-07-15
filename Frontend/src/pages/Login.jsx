import React, { useState} from "react";
import {
  Heart,
  MessageSquareText,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import Footer from "../components/common/Footer";
import { useNavigate } from "react-router-dom";
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from "../Hooks/Tostify";
import  setupAutoTokenRefresh  from "../Hooks/accesstoken";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.status === 200 || res.status === 201) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("userName", data.userName);
        setupAutoTokenRefresh();
        const userRes = await fetch(
          `http://localhost:8080/userdata/${data.userId}`,
          { method: "GET" }
        );

        const userData = await userRes.json();
        if (userRes.ok) {
          localStorage.setItem("userData", JSON.stringify(userData.data));
        } else {
          console.warn(
            "Failed to fetch user details:",
            userData.message || userData.error
          );
        }

        showSuccessToast("Login successful!");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        showErrorToast(data?.error || data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      showErrorToast("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastifyContainer />

      <div className="py-8 flex items-center justify-center bg-[#f5f3f0] text-black">
        <div className="bg-white rounded-md shadow-md p-8 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Side: Login Form */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Log In</h2>
            <hr className="mb-6 border-t border-gray-300" />

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="relative">
                <label className="block mb-1 font-medium">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3/4 transform -translate-y-1/2 cursor-pointer text-gray-500"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </span>
              </div>

              <div className="text-sm mt-2">
                <button
                  type="button"
                  onClick={() => navigate("/renewpassword")}
                  className="text-green-700 underline cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`bg-[#B5E941] text-black font-semibold py-2 px-6 rounded-full mt-4 flex items-center justify-center cursor-pointer ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                )}
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          {/* Right Side: Register Info */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Not registered yet?</h2>
            <hr className="mb-6 border-t border-gray-300" />

            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-black" />
                Watchlist available everywhere
              </li>
              <li className="flex items-center">
                <MessageSquareText className="w-4 h-4 mr-2 text-black" />
                Read and reply to messages anywhere
              </li>
              <li className="flex items-center">
                <Pencil className="w-4 h-4 mr-2 text-black" />
                Easily manage and edit ads
              </li>
            </ul>

            <button
              className="bg-[#B5E941] text-black font-semibold py-2 px-6 rounded-full w-fit cursor-pointer"
              onClick={() => (window.location.href = "/register")}
            >
              Register in 30 seconds
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};
export default Login;