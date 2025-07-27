import React, { useEffect, useState } from "react";
import Footer from "../components/common/Footer";
import binocularImage from "../assets/images/binocular.png";

const UserPage = () => {
  const userId = localStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("following"); // 'following' or 'followers'
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFollowData = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/${userId}/${type}`);
      const data = await res.json();

      if (type === "followers") {
        setFollowers(data.followers || []);
      } else {
        setFollowing(data.following || []);
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFollowData(activeTab);
    }
  }, [activeTab, userId]);

  const currentList = activeTab === "followers" ? followers : following;

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-md shadow-md px-6 py-8 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-left">Users</h2>

          {/* Tabs */}
          <div className="flex justify-center border-b border-green-800 text-sm font-medium mb-8">
            <button
              onClick={() => setActiveTab("following")}
              className={`px-4 py-2 ${
                activeTab === "following"
                  ? "border-b-2 border-green-800 text-green-800 font-semibold"
                  : "text-green-800 cursor-pointer"
              }`}
            >
              {following.length} Following
            </button>
            <button
              onClick={() => setActiveTab("followers")}
              className={`px-4 py-2 ml-4 ${
                activeTab === "followers"
                  ? "border-b-2 border-green-800 text-green-800 font-semibold"
                  : "text-green-800 cursor-pointer"
              }`}
            >
              {followers.length} Followers
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : currentList.length > 0 ? (
          <div className="space-y-4">
            {currentList.map((user, index) => {
              const name = user.profileName || user.username || "Unnamed User";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              const isFollowing = following.some((f) => f._id === user._id);

              // Optional: set of background colors for initials
              const colors = [
                "bg-pink-500",
                "bg-blue-500",
                "bg-green-500",
                "bg-indigo-500",
                "bg-yellow-500",
                "bg-purple-500",
              ];
              const bgColor = colors[index % colors.length];

              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition"
                >
                  {/* Profile section */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center text-md font-semibold ${bgColor}`}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-800">{name}</p>
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Action section */}
            <div className="flex flex-col items-end justify-center gap-1 text-right">
              {activeTab === "followers" && (
                <span
                  className={`text-sm font-semibold ${
                    isFollowing ? "text-green-600" : "text-pink-500"
                  }`}
                >
                  {isFollowing ? "FOLLOWING" : "+"}
                </span>
              )}

              <p className="text-xs text-gray-700 font-medium">
                Ad Available: {typeof user.adsCount === "number" ? user.adsCount : 0}
              </p>

              <p className="text-xs text-gray-500">
                Location: {user.location || "Unknown"}
              </p>
            </div>
                </div>
              );
            })}
          </div>


          ) : (
            // Empty State
            <div className="flex flex-col items-center gap-4 mt-6">
              <img
                src={binocularImage}
                alt="No users found"
                className="w-32 h-32"
              />
              <h3 className="text-lg font-semibold">
                {activeTab === "following"
                  ? "Discovered your favorite user?"
                  : "You have no followers yet"}
              </h3>
              <p className="text-sm text-gray-600 max-w-md text-center">
                {activeTab === "following"
                  ? `Tap “Follow” on any user’s profile or ad to start following.`
                  : `Once users follow you, they will appear here.`}
              </p>
              <button className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-full mt-2 font-semibold cursor-pointer">
                Browse ads
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserPage;
