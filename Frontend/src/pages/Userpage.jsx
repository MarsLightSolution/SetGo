import React, { useEffect, useState } from "react";
import Footer from "../components/common/Footer";
import binocularImage from "../assets/images/binocular.png";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const getLocalizedText = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[i18n.language] || field.en || "";
};

const UserPage = () => {
  const { t } = useTranslation();
  const userId = localStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("following");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAdsCount = async (userList) => {
    const updatedUsers = await Promise.all(
      userList.map(async (user) => {
        try {
          const res = await fetch(
            `http://localhost:8080/user/adsinfo/${user._id}`
          );
          const data = await res.json();
          return { ...user, adsCount: data.adsCount || 0 };
        } catch (err) {
          console.error("Error fetching ads count for user:", user._id, err);
          return { ...user, adsCount: 0 };
        }
      })
    );
    return updatedUsers;
  };

  const fetchFollowData = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/${userId}/${type}`);
      const data = await res.json();
      if (res.ok) {
        const rawList =
          type === "followers" ? data.followers || [] : data.following || [];
        const enrichedList = await fetchAdsCount(rawList);
        if (type === "followers") setFollowers(enrichedList);
        else setFollowing(enrichedList);
      } else {
        console.error(`Failed to fetch ${type}:`, data.message);
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
  }, [activeTab, userId, i18n.language]);

  const currentList = activeTab === "followers" ? followers : following;

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-md shadow-md px-6 py-8 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-left">
            {t("userPage.mainTitle")}
          </h2>

          {/* Tabs */}
          <div className="flex justify-center border-b border-green-800 text-sm font-medium mb-8">
            <button
              onClick={() => setActiveTab("following")}
              className={`px-4 py-2 ${
                activeTab === "following"
                  ? "border-b-2 border-green-800 text-green-800 font-semibold"
                  : "text-green-800"
              }`}
            >
              {t("userPage.followingTab", { count: following.length })}
            </button>
            <button
              onClick={() => setActiveTab("followers")}
              className={`px-4 py-2 ml-4 ${
                activeTab === "followers"
                  ? "border-b-2 border-green-800 text-green-800 font-semibold"
                  : "text-green-800"
              }`}
            >
              {t("userPage.followersTab", { count: followers.length })}
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <p className="text-sm text-gray-600">
              {t("userPage.loadingUsers")}
            </p>
          ) : currentList.length > 0 ? (
            <div className="space-y-4">
              {currentList.map((user, index) => {
                const name =
                  typeof user.profileName === "object"
                    ? getLocalizedText(user.profileName)
                    : user.profileName ||
                      user.username ||
                      t("userPage.unnamedUser");

                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                const isFollowing = following.some((f) => f._id === user._id);

                const colors = [
                  "bg-pink-500",
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-indigo-500",
                  "bg-yellow-500",
                  "bg-purple-500",
                ];
                const bgColor = colors[index % colors.length];
                const userLocation =
                  getLocalizedText(user.location) || t("home.unknownLocation");

                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition"
                  >
                    {/* Left: Avatar and Info */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full text-white flex items-center justify-center text-md font-semibold ${bgColor}`}
                      >
                        {initials}
                      </div>
                      <div className="flex flex-col text-left">
                        <p className="text-base font-semibold text-gray-900 leading-tight mb-1">
                          {name}
                        </p>
                        {user.email && (
                          <p className="text-sm text-gray-500 leading-none">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Ads + Location */}
                    <div className="flex flex-col items-end text-right gap-1">
                      {activeTab === "followers" && (
                        <span
                          className={`text-xs font-medium ${
                            isFollowing ? "text-green-600" : "text-pink-500"
                          }`}
                        >
                          {isFollowing
                            ? t("userPage.followingStatus")
                            : t("userPage.notFollowingStatus")}
                        </span>
                      )}
                      <p className="text-xs text-gray-700 font-medium">
                        {t("userPage.adsAvailableCount", {
                          count:
                            typeof user.adsCount === "number"
                              ? user.adsCount
                              : 0,
                        })}
                      </p>
                      {/* <p className="text-xs text-gray-500">
                        {t("userPage.locationLabel")}: {userLocation}
                      </p> */}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mt-6">
              <img
                src={binocularImage}
                alt={t("userPage.noUsersFoundAlt")}
                className="w-32 h-32"
              />
              <h3 className="text-lg font-semibold">
                {activeTab === "following"
                  ? t("userPage.discoveredFavoriteUser")
                  : t("userPage.noFollowersYet")}
              </h3>
              <p className="text-sm text-gray-600 max-w-md text-center">
                {activeTab === "following"
                  ? t("userPage.followInstructions")
                  : t("userPage.followersAppearHere")}
              </p>
              <button className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-2 rounded-full mt-2 font-semibold">
                {t("userPage.browseAdsButton")}
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
