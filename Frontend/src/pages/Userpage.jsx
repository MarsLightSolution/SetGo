import React, { useState } from "react";
import Footer from "../components/common/Footer";
import binocularImage from "../assets/images/binocular.png";

const UserPage = () => {
  const [activeTab, setActiveTab] = useState("follow"); // 'follow' or 'followers'

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-black">
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-md shadow-md px-6 py-8 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-left">Users</h2>

          {/* Tabs */}
          <div className="flex justify-center border-b border-green-800 text-sm font-medium mb-8">
            <button
              onClick={() => setActiveTab("follow")}
              className={`px-4 py-2 ${
                activeTab === "follow"
                  ? "border-b-2 border-green-800 text-green-800 font-semibold"
                  : "text-green-800"
              }`}
            >
              0 I follow
            </button>
            <button
              onClick={() => setActiveTab("followers")}
              className={`px-4 py-2 ml-4 ${
                activeTab === "followers"
                  ? "border-b-2 border-green-800 text-green-800 font-semibold"
                  : "text-green-800"
              }`}
            >
              0 followers
            </button>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center gap-4">
            <img
              src={binocularImage}
              alt="Empty binoculars"
              className="w-32 h-32"
            />
            <h3 className="text-lg font-semibold">
              {activeTab === "follow"
                ? "Discovered your favorite user?"
                : "You have no followers yet"}
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              {activeTab === "follow"
                ? `Simply tap a user’s “Follow” button and be the first to hear about new ads.`
                : `Once users follow you, they will appear here.`}
            </p>
            <button className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-full mt-2 font-semibold">
              Browse ads
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserPage;