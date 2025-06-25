import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

function ProfileMgmt() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: "", address: "" });
  const [editMode, setEditMode] = useState({ name: false, address: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        setProfile({ name: res.data.name, address: res.data.address });
        setLoading(false);
      });
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (field) => {
    axios
      .put(
        "/api/user/profile",
        { [field]: profile[field] },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      .then(() => {
        setEditMode((prev) => ({ ...prev, [field]: false }));
      });
  };

  const menuItems = [
    { path: "/profile", icon: "👤", label: "Profile information" },
    { path: "/accountsettings", icon: "⚙️", label: "Account settings" },
    { path: "/paymentsettings", icon: "💳", label: "Payments" },
    { path: "/dataprotection", icon: "🛡️", label: "Data protection" },
    { path: "/emailsettings", icon: "✉️", label: "Emails" },
    { path: "/aboutclassieds", icon: "❤️", label: "About Classified Ads" },
  ];

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition duration-200"
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <motion.div
          className="flex-1 p-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile information</h2>
          <div className="space-y-6">
            {/* Profile Name */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Profile name</label>
                {editMode.name ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="border p-1 rounded text-sm"
                  />
                ) : (
                  <div className="text-gray-900">{profile.name}</div>
                )}
              </div>
              <button
                className="text-green-600 hover:text-green-700 text-sm"
                onClick={() =>
                  editMode.name ? handleSave("name") : setEditMode((prev) => ({ ...prev, name: true }))
                }
              >
                {editMode.name ? "Save" : "Edit"}
              </button>
            </div>

            {/* Delivery Address */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Delivery address</label>
                {editMode.address ? (
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="border p-1 rounded text-sm"
                  />
                ) : (
                  <div className="text-gray-900">{profile.address}</div>
                )}
              </div>
              <button
                className="text-green-600 hover:text-green-700 text-sm"
                onClick={() =>
                  editMode.address
                    ? handleSave("address")
                    : setEditMode((prev) => ({ ...prev, address: true }))
                }
              >
                {editMode.address ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ProfileMgmt;
