import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bannerImage from "../../assets/images/banner1.png";
import nodataImage from "../../assets/images/nodata.png";
import Footer from "../common/Footer";
import { FaTrash, FaEdit, FaEye } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Custom confirmation modal component
const ConfirmDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
    <div className="bg-white rounded-xl p-6 shadow-2xl w-[350px] text-center border border-gray-200">
      <h2 className="text-lg font-bold mb-3">Delete this ad?</h2>
      <p className="text-sm text-gray-600 mb-5">
        Are you sure you want to delete this ad? This action cannot be undone.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 border border-gray-400 text-gray-700 rounded hover:bg-gray-100 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
);
export default function UserInfo() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [expandedAdId, setExpandedAdId] = useState(null);
  const [confirmAdId, setConfirmAdId] = useState(null); // for modal
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("accessToken");
  const sliderRef = useRef(null);
  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const amount = direction === "left" ? -300 : 300;
    sliderRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchUserAds = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/products/user/${userId}/ads`,
          { headers: { Authorization: `${token}` } }
        );

        if (response.data && Array.isArray(response.data.data)) {
          setAds(response.data.data);
        } else {
          setAds([]);
        }
      } catch (err) {
        console.error("Error fetching user ads", err);
        setAds([]);
      }
    };

    if (userId && token) fetchUserAds();
  }, [userId, token]);

  const deleteAd = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/products/product/${id}`, {
        headers: { Authorization: `${token}` },
      });
      setAds((prev) => prev.filter((ad) => ad._id !== id));
      toast.success("Ad deleted successfully!");
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Failed to delete ad");
    } finally {
      setConfirmAdId(null);
    }
  };

  const handleEdit = (id) => {
    navigate(`/editform/${id}`);
  };

  const handlePreview = (id) => {
    navigate(`/product/${id}`);
  };

  const toggleExpand = (id) => {
    setExpandedAdId(expandedAdId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <ToastContainer />
      {confirmAdId && (
        <ConfirmDialog
          onConfirm={() => deleteAd(confirmAdId)}
          onCancel={() => setConfirmAdId(null)}
        />
      )}

      {/* Banner */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 relative">
          <img
            src={bannerImage}
            alt="User Banner"
            className="w-full h-[233px] object-cover rounded-xl shadow"
          />
          <div className="absolute bottom-6 left-10">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">
              Join Now
            </button>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600">
              UN
            </div>
            <div>
              <h2 className="text-xl font-bold">Username</h2>
              <p className="text-sm text-gray-500">
                {ads.length} ads available
              </p>

            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <UserIcon />
              <span>Private user</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon />
              <span>Active Since June 2025</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckIcon />
              <span>Verified Profile</span>
            </div>
          </div>
        </div>
      </section>

      {/* Post Ad Prompt */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="mb-4">
            <img src={nodataImage} alt="No data" className="mx-auto" />
          </div>
          <h4 className="text-lg font-semibold mb-1">
            Any Treasure left in the basement?
          </h4>
          <p className="text-gray-600 mb-1">You can manage your ads here.</p>
          <p className="text-gray-600 mb-4">
            Start advertising easily and for free.
          </p>
          <button
            onClick={() => navigate("/form")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow cursor-pointer"
          >
            Place an ad
          </button>
        </div>
      </section>

      {/* My Published Ads Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Published Ads</h2>
            {ads.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => scrollSlider("left")}
                  className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => scrollSlider("right")}
                  className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  &#8594;
                </button>
              </div>
            )}
          </div>

          {ads.length === 0 ? (
            <p className="text-gray-500">No ads published yet.</p>
          ) : (
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
            >
              {ads.map((ad) => (
                <div
                  key={ad._id}
                  className="min-w-[260px] max-w-[260px] h-[320px] border border-gray-200 rounded-lg bg-white shadow-md hover:shadow-xl hover:scale-105 hover:z-10 transition duration-300 ease-in flex-shrink-0 flex flex-col overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-44 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {ad.pictures?.[0] ? (
                      <img
                        src={`http://localhost:8080/${
                          ad.pictures?.[0]?.replace(/\\/g, "/") ||
                          "uploads/placeholder.jpg"
                        }`}

                        alt={ad.title}
                        className="h-full w-full object-cover rounded-t-lg"
                      />
                    ) : (
                      "No Image"
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-between flex-grow p-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">
                        {ad.title}
                      </h3>
                      <p className="text-sm text-gray-500 break-words">
                        {expandedAdId === ad._id
                          ? ad.description
                          : ad.description?.slice(0, 80)}
                        {ad.description?.length > 80 && (
                          <span
                            onClick={() => toggleExpand(ad._id)}
                            className="text-blue-600 cursor-pointer ml-1 hover:underline"
                          >
                            {expandedAdId === ad._id
                              ? " Show less"
                              : " ...more"}
                          </span>
                        )}
                      </p>
                      <p className="text-green-700 font-semibold text-base mt-1">
                        {ad.price} €
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-4 justify-center">
                      <button
                        onClick={() => handleEdit(ad._id)}
                        className="text-green-600 bg-white border hover:bg-green-600 hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmAdId(ad._id)}
                        className="text-red-500 bg-white border hover:bg-red-600 hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePreview(ad._id)}
                        className="text-blue-500 bg-white border hover:bg-blue-600 hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Icons
const UserIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-green-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);
