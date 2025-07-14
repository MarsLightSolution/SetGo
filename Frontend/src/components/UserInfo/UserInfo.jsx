import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import bannerImage from "../../assets/images/banner1.png";
import nodataImage from "../../assets/images/nodata.png";

export default function UserInfo() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const userId = localStorage.getItem("userId"); // Set during login
  const token = localStorage.getItem("accessToken");   // JWT token

  const handlePlaceAdClick = () => {
    navigate("/form");
  };

  useEffect(() => {
    const fetchUserAds = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/products/user/${userId}/ads`, {
          headers: {
            Authorization:`${token}`,
          },
        });

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/products/product/${id}`, {
        headers: { Authorization:`${token}`},
      });
      // fetchUserAds(); // Refresh list
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleEdit = (id) => {
    navigate(/edit/`${id}`);
  };

  const handlePreview = (id) => {
    navigate(/product/`${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
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
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">Username</h2>
              </div>
              <p className="text-sm text-gray-500">{ads.length} ads available</p>
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

      {/* Post Ad Prompt Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5 text-center">
          <div className="mb-4">
            <img src={nodataImage} alt="No data" className="mx-auto" />
          </div>
          <h4 className="text-lg font-semibold mb-1">Any Treasure left in the basement?</h4>
          <p className="text-gray-600 mb-1">You can manage your ads here.</p>
          <p className="text-gray-600 mb-4">Start advertising easily and for free.</p>
          <button
            onClick={handlePlaceAdClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow cursor-pointer"
          >
            Place an ad
          </button>
        </div>
      </section>

      {/* My Published Ads Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-xl font-bold mb-4">My Published Ads</h2>
          {ads.length === 0 ? (
            <p className="text-gray-500">No ads published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map((ad) => (
                <div key={ad._id} className="border rounded-lg p-4 shadow hover:shadow-md transition">
                  <img
                    src={ad.pictures?.[0] || nodataImage}
                    alt={ad.title}
                    className="h-40 w-full object-cover rounded mb-2"
                  />
                  <h3 className="text-lg font-semibold">{ad.title}</h3>
                  <p className="text-sm text-gray-600">{ad.description?.slice(0, 80)}...</p>
                  <p className="text-green-600 font-bold mt-2">₹ {ad.price}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(/edit/`${ad._id}`)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handlePreview(/product/`${ad._id}`)}
                      className="px-3 py-1 bg-gray-700 text-white text-sm rounded"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-5">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {[
              {
                title: "Classifieds",
                links: ["About Us", "Career", "Press", "Classifieds Magazine", "Engagement", "Mobile Apps"],
              },
              {
                title: "Information",
                links: ["Help", "Tips for your safety", "Child and your protection", "Privacy Policy", "Privacy Settings", "Terms of use"],
              },
              {
                title: "For companies",
                links: ["Classified Real Estate", "PRO Infopoint", "PRO Packages for companies", "Advertising on classifieds"],
              },
              {
                title: "Social Media",
                links: ["Facebook", "Youtube", "Instagram", "Threads", "Pinterest", "Tik Tok"],
              },
              {
                title: "Generally",
                links: ["Popular searches", "Ads Overview", "Overview of company pages", "Car valuation"],
              },
            ].map((col, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 mb-4">{col.title}</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="hover:text-green-800 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-xs text-gray-500 space-y-1">
            <p>© 2005-2025 Marktplaats B.V. All rights reserved.</p>
            <p>The classifieds services are operated by kleinanzeigen.de GmbH.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
const UserIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" />
  </svg>
);
