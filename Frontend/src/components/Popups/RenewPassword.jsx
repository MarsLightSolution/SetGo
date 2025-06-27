import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ToastifyContainer,
  showSuccessToast,
  showErrorToast,
} from "../../Hooks/Tostify";

function RenewPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!email) {
      showErrorToast("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8080/forgotpassword", {
        email,
      });

      if (res.status === 200 || res.status === 201) {
        showSuccessToast("Reset link sent successfully!");
        setTimeout(() => {
          navigate("/emailnotify", {
            state: {
              email: email,
            },
          });
        }, 1000);
      } else {
        showErrorToast("Failed to send reset email.");
      }
   } catch (error) {
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    "An error occurred. Please try again.";

  showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastifyContainer />

      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Renew Password</h1>
            <p className="text-gray-600 mb-8">
              Please enter your email address. You will then receive an email with a link where you can choose a new password.
            </p>
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded text-gray-700"
                  required
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading}
                className={`bg-lime-400 hover:bg-lime-500 text-gray-800 px-8 py-3 rounded flex items-center justify-center ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-gray-800"
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
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default RenewPassword;
