import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { MdOutlineAddCircle } from "react-icons/md";
import { useSelector } from "react-redux";
const Navbar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const accessToken = localStorage.getItem("accessToken");

    if (storedName && accessToken) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Optional: call backend logout route to clear refresh token cookie
      await fetch("http://localhost:8080/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear localStorage and refresh page
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      setUserName("");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
const wishlist=useSelector(state=>state.wishlist.totalItems);

  return (
    <div className="w-full">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
        {/* Logo */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src="/logo.svg" alt="logo" className="h-6 w-6" />
          <span className="text-2xl font-semibold text-[#2e4a2f]">kleinanzeigen</span>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {!userName ? (
            <>
              <button
                className="border border-black text-black px-4 py-1 rounded-full text-sm"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
              <span className="text-sm text-gray-500">or</span>
              <span className="text-sm text-gray-500">{wishlist}</span>
              <button
                className="flex items-center gap-2 bg-lime-400 px-4 py-1 rounded-full text-sm font-medium"
                onClick={() => navigate("/login")}
              >
                <FaUser />
                Log in
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-green-900">Hello, {userName}</span>
              <button
                onClick={handleLogout}
                className="border border-black text-black px-4 py-1 rounded-full text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-lime-400 py-4 px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 max-w-screen-xl mx-auto">
          {/* Search Inputs */}
          <div className="flex flex-1 bg-white rounded-full overflow-hidden shadow-sm w-full">
            <div className="flex items-center px-3 gap-2 border-r border-gray-300 w-full max-w-[300px]">
              <FaSearch className="text-gray-500" />
              <input
                type="text"
                placeholder="What are you looking for?"
                className="outline-none text-sm py-2 w-full"
              />
            </div>

            <select className="px-4 text-sm border-r border-gray-300 outline-none text-gray-700">
              <option>Alle Kategorien</option>
            </select>

            <div className="flex items-center gap-2 px-4 border-r border-gray-300">
              <FaMapMarkerAlt className="text-gray-500" />
              <input
                type="text"
                placeholder="Postal code or city"
                className="outline-none text-sm py-2 w-32"
              />
            </div>

            <input
              type="text"
              placeholder="Ganzer Ort"
              disabled
              className="px-4 text-sm text-gray-400 bg-gray-100 cursor-not-allowed w-28"
            />

            <button className="bg-white text-green-900 font-semibold px-6 rounded-full ml-2 mr-2">
              Find
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-6 text-sm text-green-900 font-medium">
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate("/advertise")}>
              <MdOutlineAddCircle className="text-lg" />
              Advertise
            </div>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate("/profile")}>
              <FaUser className="text-lg" />
              Mine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
