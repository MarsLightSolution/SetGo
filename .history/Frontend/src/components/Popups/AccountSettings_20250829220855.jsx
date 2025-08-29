import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddressModal from "./AddressModal"; // Assuming this is the AddressModal component
import ChangePhone from "../Settings/ChangePhone"; // Assuming this is ChangePhone
import PhoneVerification from "../common/PhoneVerification"; // Assuming this is PhoneVerification
import SmsVerification from "../common/SmsVerification"; // Assuming this is SmsVerification
import NewPasswordModal from "../Settings/NewPasswordModal"; // Assuming this is NewPasswordModal
import useUserProfile from "../../Hooks/useUserProfile"; // Assuming this hook exists
import axios from "axios";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify"; // Using react-toastify directly here

// i18n import
import { useTranslation } from 'react-i18next';

function AccountSettings() {
  const { t } = useTranslation(); // Initialize useTranslation hook
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
          `${import.meta.env.VITE_SERVER}/api/products/user/${userId}/ads`,
          { withCredentials: true }
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
  }, [userId, token]);

  const handleBillingUpdate = async (newAddress) => {
    if (!profile || !profile._id) {
      toast.error(t("accountSettings.userProfileNotAvailable")); // Translated
      return;
    }

    try {
      setLoading(true);
      const res = await axios.patch(
        `${import.meta.env.VITE_SERVER}/billingaddress/${profile._id}/billingAddress`,
        {
          billingAddress: newAddress,
        },
        {
          withCredentials: true,
        }
      );
      if (res.status === 200) {
        updateField("billingAddress", newAddress);
        toast.success(t("accountSettings.billingAddressUpdateSuccess")); // Translated
      } else {
        toast.error(t("accountSettings.billingAddressUpdateFailed")); // Translated
      }
    } catch (error) {
      console.error("Error updating billing address:", error);
      toast.error(
        t("accountSettings.billingAddressUpdateError") +
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
      t("accountSettings.confirmDeleteAccount") // Translated
    );
    if (!confirmDelete) return;

    try {
      if (!profile || !profile._id) {
        toast.error(t("accountSettings.userProfileNotAvailable")); // Translated
        return;
      }

      const res = await axios.delete(
        `${import.meta.env.VITE_SERVER}/deleteuser/${profile._id}`
      );
      if (res.status === 200) {
        await fetch(`${import.meta.env.VITE_SERVER}/logout`, {
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
      alert(t("accountSettings.deleteAccountError")); // Translated
    }
  };

  const handleEmailSave = async () => {
    if (newEmail !== repeatEmail || !emailPassword) {
      toast.warning(t("accountSettings.emailMatchWarning")); // Translated
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_SERVER}/emailverify`, {
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
        toast.success(t("accountSettings.emailUpdateSuccess")); // Translated
      } else {
        toast.error(t("accountSettings.emailUpdateFailed")); // Translated
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("accountSettings.emailUpdateError")); // Translated fallback
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
          {t("accountSettings.loading")}
        </div>
      </div>
    )}

    {/* Layout */}
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          {t("profileMgmt.settingsTitle")}
        </h1>
        <nav className="space-y-1 text-sm font-medium">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
          >
            <span className="mr-3">👤</span> {t("profileMgmt.profileInfo")}
          </button>
          <button
            onClick={() => navigate("/accountsettings")}
            className="flex items-center px-3 py-2 text-green-700 bg-green-50 rounded-md w-full text-left"
          >
            <span className="mr-3">⚙️</span> {t("profileMgmt.accountSettings")}
          </button>
          <button
            onClick={() => navigate("/paymentsettings")}
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
          >
            <span className="mr-3">💳</span> {t("profileMgmt.payments")}
          </button>
          <button
            onClick={() => navigate("/dataprotection")}
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
          >
            <span className="mr-3">🛡️</span> {t("profileMgmt.dataProtection")}
          </button>
          <button
            onClick={() => navigate("/emailsettings")}
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
          >
            <span className="mr-3">✉️</span> {t("profileMgmt.emails")}
          </button>
          <button
            onClick={() => navigate("/aboutclassifieds")}
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left"
          >
            <span className="mr-3">❤️</span> {t("profileMgmt.aboutClassifiedAds")}
          </button>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t("accountSettings.title")}
        </h2>

        <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
          <Eye className="w-4 h-4" />
          <span>{t("accountSettings.infoVisibility")}</span>
        </div>

        {/* Settings Rows */}
        <div className="space-y-4">
          {/* Phone */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 py-2.5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10 flex-1">
              <label className="text-sm font-medium text-gray-700 sm:w-40">
                {t("accountSettings.verifiedPhoneNumber")}
              </label>
              <span className="text-gray-900 text-sm mt-1 sm:mt-0">
                {profile.phoneNumber || "+49*****863"}
              </span>
            </div>
            <button
              onClick={() => setPopupStep("popup")}
              className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0"
            >
              {t("accountSettings.changeButton")}
            </button>
          </div>

          {/* Email */}
          <div className="border-b border-gray-100 py-2.5">
            {!showEmailForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10 flex-1">
                  <label className="text-sm font-medium text-gray-700 sm:w-40">
                    {t("accountSettings.emailAddressLabel")}
                  </label>
                  <span className="text-gray-900 text-sm mt-1 sm:mt-0">
                    {profile.email}
                  </span>
                </div>
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0"
                >
                  {t("accountSettings.changeButton")}
                </button>
              </div>
            ) : (
              <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-md space-y-5">
                {/* Info Box */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700">
                  <p>
                    {t("accountSettings.emailChangeInfo1")}
                    <br />• {t("accountSettings.emailChangeInfo2")}
                    <br />• {t("accountSettings.emailChangeInfo3")}
                  </p>
                </div>

                {/* Current Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("accountSettings.currentEmailLabel")}
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
                    {t("accountSettings.newEmailLabel")}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t("accountSettings.newEmailPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Repeat Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("accountSettings.repeatNewEmailLabel")}
                  </label>
                  <input
                    type="email"
                    value={repeatEmail}
                    onChange={(e) => setRepeatEmail(e.target.value)}
                    placeholder={t("accountSettings.repeatNewEmailPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("accountSettings.yourPasswordLabel")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder={t("accountSettings.passwordPlaceholder")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-gray-400"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    {t("accountSettings.cancelButton")}
                  </button>
                  <button
                    onClick={handleEmailSave}
                    className="px-5 py-2 text-sm text-white bg-lime-500 hover:bg-lime-600 rounded-md"
                  >
                    {t("accountSettings.saveEmailButton")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 py-2.5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-10 flex-1">
              <label className="text-sm font-medium text-gray-700 sm:w-40">
                {t("accountSettings.passwordLabel")}
              </label>
              <span className="text-gray-900 text-sm mt-1 sm:mt-0">****</span>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0"
            >
              {t("accountSettings.changeButton")}
            </button>
          </div>
        </div>

        {/* Activity */}
        <div className="mt-8 mb-6 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {t("accountSettings.yourActivity")}
          </h3>
          {ads.length > 0 ? (
            <p className="text-sm text-gray-500">
              {t("accountSettings.adsAvailable", { count: ads.length })}
            </p>
          ) : (
            <p className="text-sm text-gray-500">{t("accountSettings.noAdsAvailable")}</p>
          )}
        </div>

        {/* Billing */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 mb-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 flex-1">
            <label className="text-sm font-medium text-gray-700 sm:w-40">
              {t("accountSettings.billingAddressLabel")}
            </label>
            <div className="text-gray-900 text-sm mt-1 sm:mt-0">
              {profile.billingAddress || t("accountSettings.notAvailable")}
            </div>
          </div>
          <button
            className="text-green-600 hover:text-green-700 text-sm mt-2 sm:mt-0"
            onClick={() => setShowBillingModal(true)}
          >
            {t("accountSettings.editButton")}
          </button>
        </div>

        {/* Delete Account */}
        <div className="flex justify-center sm:justify-end">
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            {t("accountSettings.deleteAccountButton")}
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

    {/* Phone / SMS Popup */}
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
                showCloseButton={true}
              />
            )}
            {popupStep === "sms" && (
              <SmsVerification
                phoneNumber={profile.phoneNumber}
                email={profile.email}
                onClose={() => setPopupStep(null)}
                onSuccess={() => setPopupStep(null)}
                showCloseButton={true}
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