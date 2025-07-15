import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { FaFilter } from "react-icons/fa";
import { MdOutlineAddCircle } from "react-icons/md";
import { useSelector } from "react-redux";
import Slider from "rc-slider";
import { useDispatch } from "react-redux";
import {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
} from "../../slices/FilterSlice";
import "rc-slider/assets/index.css";
const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownPinned, setIsDropdownPinned] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [condition, setLocalCondition] = useState("");
  const [radius, setLocalRadius] = useState(0);
  const [selectedCity, setSelectedCity] = useState("");
  const [priceRange, setLocalPriceRange] = useState([0, 10000]);
  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const accessToken = localStorage.getItem("accessToken");

    if (storedName && accessToken) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userData");
      setUserName("");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  const wishlist = useSelector((state) => state.wishlist.totalItems);

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white">
        {/* Top Bar */}
        <div className="bg-white shadow-sm">
          <div className="max-w-[864px] mx-auto flex justify-between items-center px-4 py-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src="/logo.svg" alt="logo" className="h-6 w-6" />
              <span className="text-2xl font-semibold text-[#2e4a2f]">
                kleinanzeigen
              </span>
            </div>

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
                  <span className="text-sm font-medium text-green-900">
                    Hello, {userName}
                  </span>
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
        </div>

        {/* Search & Icons Row */}
        <div className="bg-lime-400 py-4">
          <div className="max-w-[864px] mx-auto flex items-center justify-between gap-4 px-1">
            {/* Search Box */}
            <div className="flex bg-white rounded-full shadow px-4 h-12 w-full items-center gap-3">
              {/* Search Input */}
              <div className="flex items-center gap-2 w-[40%]">
                <FaSearch className="text-gray-500" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="outline-none text-sm w-full"
                />
              </div>
              <button
                className="ml-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                onClick={() => setShowFilter(true)}
                title="Open Filters"
              >
                <FaFilter className="text-lime-800" />
              </button>
              {/* Category Select */}
              <select className="text-sm text-gray-700 outline-none w-[25%] border-l border-gray-300 pl-4">
                <option>All categories</option>
              </select>

              {/* Location Input */}
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4 w-[21%]">
                <FaMapMarkerAlt className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Postal code"
                  className="outline-none text-sm w-full"
                />
              </div>

              {/* Disabled Input */}
              <input
                type="text"
                placeholder="Whole place"
                disabled
                className="text-sm text-gray-400 bg-gray-100 cursor-not-allowed w-[17%] px-1 py-1 rounded"
              />

              {/* Find Button */}
              <button className="ml-1 mx-0 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-1.5 rounded-full">
                Find
              </button>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 text-sm text-green-900 font-medium whitespace-nowrap">
              <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => navigate("/form")}
              >
                <MdOutlineAddCircle className="text-lg" />
                Advertise
              </div>

              {/* Mine Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => {
                  if (!isDropdownPinned) setDropdownOpen(false);
                }}
              >
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    setDropdownOpen((prev) => !prev);
                    setIsDropdownPinned((prev) => !prev);
                  }}
                >
                  <FaUser className="text-lg" />
                  <span>Mine</span>
                </div>

                {(dropdownOpen || isDropdownPinned) && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                    {[
                      { label: "News", path: "/chat" },
                      { label: "Show", path: "/userinfo" },
                      { label: "Settings", path: "/profile" },
                      { label: "Watchlist", path: "/watchlist" },
                      { label: "Users", path: "/userpage" },
                      { label: "Search Request", path: "/mysearch" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          navigate(item.path);
                          setDropdownOpen(false);
                          setIsDropdownPinned(false);
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
            <h2 className="text-lg font-semibold mb-4">Filter Listings</h2>

            {/* Price Range Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Price Range: ₹{priceRange[0]} – ₹{priceRange[1]}
              </label>
              <Slider
                range
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onChange={setLocalPriceRange}
                trackStyle={[{ backgroundColor: "#84cc16" }]}
                handleStyle={[
                  { borderColor: "#84cc16", backgroundColor: "#84cc16" },
                  { borderColor: "#84cc16", backgroundColor: "#84cc16" },
                ]}
                railStyle={{ backgroundColor: "#d1d5db" }}
              />
            </div>

            {/* Condition Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setLocalCondition(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Select</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="used">Used</option>
                <option value="defective">Defective/Need Repair</option>
              </select>
            </div>

            {/* Radius Slider */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Radius: {radius} km
              </label>
              <input
                type="range"
                min="0"
                max="400"
                step="10"
                value={radius}
                onChange={(e) => setLocalRadius(e.target.value)}
                className="w-full accent-lime-500"
              />
            </div>

            {/* City Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Select City</option>
                <option value="baku">Baku</option>
                <option value="ganja">Ganja</option>
                <option value="sumqayit">Sumqayit</option>
                <option value="mingachevir">Mingachevir</option>
                <option value="shaki">Shaki</option>
                {/* Add all cities as needed */}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFilter(false)}
                className="px-4 py-2 text-sm bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("typeof setPriceRange", typeof setPriceRange);
                  console.log("setPriceRange", setPriceRange);
                  dispatch(setPriceRange(priceRange));
                  dispatch(setCondition(condition));
                  dispatch(setRadius(radius));
                  dispatch(setCity(selectedCity));
                  setShowFilter(false);
                }}
                className="px-4 py-2 text-sm bg-lime-500 text-white rounded"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;