import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RenewPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSend = async () => {
    try {
      const res = await axios.post("http://localhost:8080/forgotpassword", {
        email,
      });

      if (res.status === 200 || res.status === 201) {
        // Assuming server sends resetToken or email for verification purpose
        navigate("/emailnotify", {
          state: {
            email: email, // optionally pass email
          },
        });
      } else {
        alert("Failed to send reset email.");
      }
    } catch (error) {
      console.error("Error sending reset email:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
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
              className="bg-lime-400 hover:bg-lime-500 text-gray-800 px-8 py-3 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </main>

      {/* (Footer remains unchanged) */}
    </div>
  );
}

export default RenewPassword;