import React, { useState } from "react";
import { Heart, MessageSquareText, Pencil } from "lucide-react";
import Footer from "../components/common/Footer";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();

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
      console.log(data);

      if (res.status === 200 || res.status === 201) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("userName", data.userName);
        window.location.href = "/"; // full reload
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("An error occurred. Please try again.");
    }
  };
  return (
    <>
      <div className="min-h-screen bg-white flex text-black items-center justify-center px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl w-full">
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
              <div>
                <label className="block mb-1 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="text-sm mt-2">
                <button
                  type="button"
                  onClick={() => navigate("/renewpassword")}
                  className="text-green-700 underline"
                >
                  Forgot your password?
                </button>
              </div>


              <button
                type="submit"
                className="bg-[#B5E941] text-black font-semibold py-2 px-6 rounded-full mt-4"
              >
                Login
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
              className="bg-[#B5E941] text-black font-semibold py-2 px-6 rounded-full w-fit"
              onClick={() => window.location.href = "/register"}
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
