// ✅ Imports
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddressModal from "./AddressModal";
import ChangePhone from "../Settings/ChangePhone";
import PhoneVerification from "../Settings/PhoneVerification";
import SmsVerification from "../Settings/SmsVerification";
import NewPasswordModal from "../Settings/NewPasswordModal";
import useUserProfile from "../../Hooks/useUserProfile";
import axios from "axios";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";

function AccountSettings() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [popupStep, setPopupStep] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [repeatEmail, setRepeatEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState([]);

  const { profile, updateField } = useUserProfile();

  const userId = localStorage.getItem("userId");
  const token = Cookies.get("refreshToken");
  useEffect(() => {
    const fetchUserAds = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/products/user/${userId}/ads`,
          { withCredentials: true } // ✅ Important: to send cookies
        );
        if (response.data && Array.isArray(response.data.data)) {
          setAds(response.data.data);
        } else {
          setAds([]);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
        setAds([]);
      }
    };

    if (userId && token) {
      fetchUserAds();
    }
  }, []);

  const handleBillingUpdate = async (newAddress) => {
    if (!profile || !profile._id) {
      toast.error("User  profile is not available.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.patch(
        `http://localhost:8080/billingaddress/${profile._id}/billingAddress`,
        {
          billingAddress: newAddress,
        },
        {
        withCredentials: true, // ✅ Important: to send cookies
      }
      );
      if (res.status === 200) {
        updateField("billingAddress", newAddress);
        toast.success("Billing address updated successfully");
      } else {
        toast.error("Failed to update billing address.");
      }
    } catch (error) {
      console.error("Error updating billing address:", error);
      toast.error(
        "Error updating billing address: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneUpdate = (newNumber) => {
    updateField("phoneNumber", newNumber);
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      if (!profile || !profile._id) {
        toast.error("User  profile is not available.");
        return;
      }

      const res = await axios.delete(
        `http://localhost:8080/deleteuser/${profile._id}`
      );
      if (res.status === 200) {
        await fetch("http://localhost:8080/logout", {
          method: "POST",
          credentials: "include",
        });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userData");
        setTimeout(() => {
          window.location.href = "/register";
        }, 1000);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert("An error occurred while deleting your account.");
    }
  };

  const handleEmailSave = async () => {
    if (newEmail !== repeatEmail || !emailPassword) {
      toast.warning("Emails must match and password is required.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`http://localhost:8080/emailverify`, {
        userId: profile._id,
        password: emailPassword,
        newEmail: newEmail,
      });

      if (res.status === 200) {
        updateField("email", newEmail);
        setShowEmailForm(false);
        setNewEmail("");
        setRepeatEmail("");
        setEmailPassword("");
        toast.success("Email updated successfully");
      } else {
        toast.error("Failed to update email.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toastify */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white px-4 py-2 rounded shadow text-sm text-gray-700">
            Loading...
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1 text-sm font-medium">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left cursor-pointer"
            >
              <span className="mr-3">👤</span> Profile information
            </button>
            <button
              onClick={() => navigate("/accountsettings")}
              className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md w-full text-left cursor-pointer"
            >
              <span className="mr-3">⚙️</span> Account settings
            </button>
            <button
              onClick={() => navigate("/paymentsettings")}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left cursor-pointer"
            >
              <span className="mr-3">💳</span> Payments
            </button>
            <button
              onClick={() => navigate("/dataprotection")}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left cursor-pointer"
            >
              <span className="mr-3">🛡️</span> Data protection
            </button>
            <button
              onClick={() => navigate("/emailsettings")}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left cursor-pointer"
            >
              <span className="mr-3">✉️</span> Emails
            </button>
            <button
              onClick={() => navigate("/aboutclassifieds")}
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left cursor-pointer"
            >
              <span className="mr-3">❤️</span> About Classified Ads
            </button>
          </nav>
        </div>

        {/* Main */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Account settings
          </h2>

          <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
            <Eye className="w-4 h-4" />
            <span>All information is visible only to you</span>
          </div>

          <div className="space-y-4">
            {/* Phone */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">
                  Verified phone number
                </label>
                <span className="text-gray-900 text-sm">
                  {profile.phoneNumber || "+49*****863"}
                </span>
              </div>
              <button
                onClick={() => setPopupStep("popup")}
                className="text-green-600 hover:text-green-700 text-sm cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Email */}
            <div className="border-b border-gray-100 py-2.5">
              {!showEmailForm ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-10">
                    <label className="text-sm font-medium text-gray-700 w-40">
                      E-mail Address
                    </label>
                    <span className="text-gray-900 text-sm">
                      {profile.email}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowEmailForm(true)}
                    className="text-green-600 hover:text-green-700 text-sm  cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-md space-y-5">
                  {/* Info Box */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700">
                    <p>
                      To change your email address, you will receive two emails:
                      <br />• One to your current email address
                      <br />• One to your new email address to confirm ownership
                    </p>
                  </div>

                  {/* Current Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Email
                    </label>
                    <input
                      disabled
                      type="text"
                      value={profile.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-600"
                    />
                  </div>

                  {/* New Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  {/* Repeat Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat New Email
                    </label>
                    <input
                      type="email"
                      value={repeatEmail}
                      onChange={(e) => setRepeatEmail(e.target.value)}
                      placeholder="Repeat new email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 text-gray-400 cursor-pointer"
                      >
                        {showPassword ? (
                          <Eye size={18} />
                        ) : (
                          <EyeOff size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowEmailForm(false)}
                      className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEmailSave}
                      className="px-5 py-2 text-sm text-white bg-lime-500 hover:bg-lime-600 rounded-md cursor-pointer"
                    >
                      Save Email
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="flex justify-between items-center border-b border-gray-100 py-2.5">
              <div className="flex items-center gap-10">
                <label className="text-sm font-medium text-gray-700 w-40">
                  Password
                </label>
                <span className="text-gray-900 text-sm">****</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-green-600 hover:text-green-700 text-sm cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>

          {/* Activity */}
          <div className="mt-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Your activity
            </h3>
            {ads.length > 0 ? (
              <p className="text-sm text-gray-500">
                You have {ads.length} ads available
              </p>
            ) : (
              <p className="text-sm text-gray-500">No ads available</p>
            )}
          </div>

          {/* Billing */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100 mb-8">
            <div className="flex items-center gap-6">
              <label className="text-sm font-medium text-gray-700 w-40">
                Billing address
              </label>
              <div className="text-gray-900 text-sm">
                {profile.billingAddress || "N/A"}
              </div>
            </div>
            <button
              className="text-green-600 hover:text-green-700 text-sm cursor-pointer"
              onClick={() => setShowBillingModal(true)}
            >
              Edit
            </button>
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete user account
            </button>
          </div>
        </div>
      </div>

      {/* Billing Modal */}
      <AddressModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSave={handleBillingUpdate}
      />
      <AnimatePresence>
        {popupStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <motion.div
              key={popupStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl p-0 shadow-xl w-full max-w-xl"
            >
              {popupStep === "popup" && (
                <ChangePhone
                  onClose={() => setPopupStep(null)}
                  onNext={() => setPopupStep("phone")}
                />
              )}
              {popupStep === "phone" && (
                <PhoneVerification
                  onSendOTP={() => setPopupStep("sms")}
                  setPhoneNumber={handlePhoneUpdate}
                  email={profile.email}
                  onClose={() => setPopupStep(null)}
                />
              )}
              {popupStep === "sms" && (
                <SmsVerification
                  phoneNumber={profile.phoneNumber}
                  email={profile.email}
                  onClose={() => setPopupStep(null)}
                  onNext={() => setPopupStep(null)}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <motion.div
              key="passwordModal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <NewPasswordModal onClose={() => setShowPasswordModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AccountSettings;
