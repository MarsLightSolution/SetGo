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
import { toast } from "react-hot-toast";
// import { useTranslation } from 'react-i18next';
// i18n import
import { useTranslation } from 'react-i18next';

function AccountSettings() {
  const { t , i18n  } = useTranslation(); // Initialize useTranslation hook
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
  // const [ads, setAds] = useState([]);
  // const { t, i18n } = useTranslation(); 
  const currentLang = i18n.language || "en"; // fallback

  const { profile, updateField } = useUserProfile();

  const userId = localStorage.getItem("userId");
  const token = Cookies.get("refreshToken");

  const sidebarItems = [
    { labelKey: "profileMgmt.profileInfo", icon: "👤", path: "/profile" },
    { labelKey: "profileMgmt.accountSettings", icon: "⚙️", path: "/accountsettings", active: true },
    { labelKey: "profileMgmt.payments", icon: "💳", path: "/paymentsettings" },
    { labelKey: "profileMgmt.dataProtection", icon: "🛡️", path: "/dataprotection" },
    { labelKey: "profileMgmt.emails", icon: "✉️", path: "/emailsettings" },
    { labelKey: "profileMgmt.aboutClassifiedAds", icon: "❤️", path: "/aboutclassifieds" },
  ];
  useEffect(() => {
    const fetchUserAds = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER}/api/products/user/${userId}/ads`,
          {
            withCredentials: true,
          }
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

    const accessToken = localStorage.getItem("accessToken");

    if (userId && accessToken) {
      fetchUserAds();
    } else {
      console.log("DEBUG: Ads fetch skipped. userId or accessToken missing.");
      setAds([]);
    }
  }, [userId]);


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
      toast(t("accountSettings.emailMatchWarning"), { icon: '⚠️' }); // Translated
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
  className="min-h-screen bg-gray-50 flex flex-col"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

  {loading && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white px-4 py-2 rounded shadow text-sm text-gray-700">
        {t("accountSettings.loading")}
      </div>
    </div>
  )}

  {/* Content */}
  <div className="flex-1 py-10 px-4">
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">
              {t("profileMgmt.settingsTitle")}
            </h1>
            <nav className="space-y-1 text-sm font-medium flex flex-wrap md:block">
              {sidebarItems.map((item) => (
                <button
                  key={item.labelKey}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center px-3 py-2 rounded-md w-full md:w-auto text-left cursor-pointer transition duration-200 ${
                    item.active
                      ? "text-green-700 bg-green-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {t(item.labelKey)}
                </button>
              ))}
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

            {/* Sections */}
            <div className="space-y-4">
              {/* Phone */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 py-2.5">
  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
    <label className="text-sm font-medium text-gray-700 md:w-40">
      {t("accountSettings.verifiedPhoneNumber")}
    </label>
    <span className="text-gray-900 text-sm">
      {profile.phoneNumber
        ? profile.phoneNumber
        : t("")}
    </span>
  </div>

  <button
    onClick={() => setPopupStep("popup")}
    className="text-green-600 hover:text-green-700 text-sm cursor-pointer mt-2 md:mt-0"
  >
    {profile.phoneNumber
      ? t("Change")
      : t("Add")}
  </button>
</div>


              {/* Email */}
              <div className="border-b border-gray-100 py-2.5">
                {!showEmailForm ? (
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
                      <label className="text-sm font-medium text-gray-700 md:w-40">
                        {t("accountSettings.emailAddressLabel")}
                      </label>
                      <span className="text-gray-900 text-sm">
                        {profile.email}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="text-green-600 hover:text-green-700 text-sm cursor-pointer mt-2 md:mt-0"
                    >
                      {t("accountSettings.changeButton")}
                    </button>
                  </div>
                ) : (
                  /* Email Form (kept same layout as yours, responsive naturally) */
                  <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-md space-y-5">
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
                        placeholder={t(
                          "accountSettings.repeatNewEmailPlaceholder"
                        )}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>

                    {/* Password Input */}
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
                          className="absolute right-3 top-2.5 text-gray-400 cursor-pointer"
                        >
                          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowEmailForm(false)}
                        className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        {t("accountSettings.cancelButton")}
                      </button>
                      <button
                        onClick={handleEmailSave}
                        className="px-5 py-2 text-sm text-white bg-lime-500 hover:bg-lime-600 rounded-md cursor-pointer"
                      >
                        {t("accountSettings.saveEmailButton")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 py-2.5">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
                  <label className="text-sm font-medium text-gray-700 md:w-40">
                    {t("accountSettings.passwordLabel")}
                  </label>
                  <span className="text-gray-900 text-sm">****</span>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-green-600 hover:text-green-700 text-sm cursor-pointer mt-2 md:mt-0"
                >
                  {t("accountSettings.changeButton")}
                </button>
              </div>
            </div>
 {/* Activity */}
  <div className="mt-8 mb-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-1">
      {t("accountSettings.yourActivity")}
    </h3>

    {ads.length > 0 ? (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">
          {t("accountSettings.adsAvailable", { count: ads.length })}
        </p>

        {/* Show a small preview of ads */}
        {/* <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md">
          {ads.slice(0, 5).map((ad) => (
            <li
              key={ad._id}
              className="flex justify-between items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            > */}
              {/* <span className="truncate"> */}
                {/* ✅ choose based on i18n.language */}
                {/* {ad.title?.[currentLang] || t("accountSettings.untitledAd")}
              </span> */}
              {/* <span className="text-xs text-gray-400">
                {new Date(ad.createdAt).toLocaleDateString()}
              </span> */}
            {/* </li>
          ))}
        </ul> */}

        {/* {ads.length > 5 && (
          <button className="text-green-600 hover:text-green-700 text-sm mt-2">
            {t("View All ")}
          </button>
        )} */}
      </div>
    ) : (
      <p className="text-sm text-gray-500">
        {t("accountSettings.noAdsAvailable")}
      </p>
    )}
  </div>


            {/* Billing */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b border-gray-100 mb-8 gap-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                <label className="text-sm font-medium text-gray-700 md:w-40">
                  {t("accountSettings.billingAddressLabel")}
                </label>
                <div className="text-gray-900 text-sm">
                  {profile.billingAddress || t("accountSettings.notAvailable")}
                </div>
              </div>
              <button
                className="text-green-600 hover:text-green-700 text-sm cursor-pointer"
                onClick={() => setShowBillingModal(true)}
              >
                {t("accountSettings.editButton")}
              </button>
            </div>

            {/* Delete */}
            <div className="flex justify-end">
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {t("accountSettings.deleteAccountButton")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Modal */}
      <AddressModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        onSave={handleBillingUpdate}
      />

      {/* Phone Verification Flow */}
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
                  setPhoneNumber={() => {}}
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