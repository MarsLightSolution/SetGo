import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import AddressModal from './AddressModal'; 
import useUserProfile from '../../Hooks/useUserProfile'; 
import axios from 'axios';
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from '../../Hooks/Tostify'; 
import { useTranslation } from 'react-i18next';

// Import Footer
import Footer from '../common/Footer';

function ProfileMgmt() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateField, loading: profileLoading } = useUserProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(profile.username || '');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const sidebarItems = [
    { labelKey: "profileMgmt.profileInfo", icon: "👤", path: "/profile", active: true },
    { labelKey: "profileMgmt.accountSettings", icon: "⚙️", path: "/accountsettings" },
    { labelKey: "profileMgmt.payments", icon: "💳", path: "/paymentsettings" },
    { labelKey: "profileMgmt.dataProtection", icon: "🛡️", path: "/dataprotection" },
    { labelKey: "profileMgmt.emails", icon: "✉️", path: "/emailsettings" },
    { labelKey: "profileMgmt.aboutClassifiedAds", icon: "❤️", path: "/aboutclassieds" },
  ];

  const handleSaveName = async () => {
    const userId = JSON.parse(localStorage.getItem('userData'))?._id;
    setSavingName(true);

    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_SERVER}/nameupdate/${userId}/profileName`,
        { profileName: tempProfileName }
      );

      const updatedUser = res.data.data;
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      updateField('username', tempProfileName);
      setIsEditingName(false);
      showSuccessToast(t('profileMgmt.nameUpdateSuccess'));
    } catch (err) {
      showErrorToast(err.response?.data?.message || t('profileMgmt.nameUpdateFailed'));
    } finally {
      setSavingName(false);
    }
  };

  const handleAddressUpdate = async (newAddress) => {
    const userId = JSON.parse(localStorage.getItem('userData'))?._id;

    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_SERVER}/deliveryaddress/${userId}/delivery-Address`,
        { deliveryAddress: newAddress }
      );

      const updatedUser = res.data.data;
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      updateField('deliveryAddress', newAddress);
      showSuccessToast(t('profileMgmt.addressUpdateSuccess'));
    } catch (err) {
      showErrorToast(err.response?.data?.message || t('profileMgmt.addressUpdateFailed'));
    }
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ToastifyContainer />

      {/* Content Wrapper */}
      <div className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.settingsTitle")}</h1>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.labelKey}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    item.active
                      ? "text-green-700 bg-green-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span> {t(item.labelKey)}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.profileInfoTitle")}</h2>
            <div className="space-y-6">
              
              {/* Profile Name */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <label className="text-sm font-medium text-gray-700 w-32">
                    {t("profileMgmt.profileNameLabel")}
                  </label>

                  {isEditingName ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={tempProfileName}
                        onChange={(e) => setTempProfileName(e.target.value)}
                        className="border rounded px-3 py-1 text-sm text-gray-800"
                      />
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="text-gray-700 border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-100 text-sm cursor-pointer"
                      >
                        {t("profileMgmt.cancelButton")}
                      </button>
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="bg-lime-400 text-white px-4 py-1 rounded-full text-sm hover:bg-lime-500 flex items-center gap-2 cursor-pointer"
                      >
                        {savingName && (
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                            />
                          </svg>
                        )}
                        {savingName ? t('profileMgmt.saving') : t('profileMgmt.save')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-gray-900 text-sm">
                        {profile.username || t('profileMgmt.notAvailable')}
                      </div>
                    </>
                  )}
                </div>

                {/* {!isEditingName && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-green-600 hover:text-green-700 text-sm cursor-pointer mt-2 sm:mt-0"
                  >
                    {t("Change")}
                  </button>
                )} */}
              </div>

              {/* Delivery Address */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <label className="text-sm font-medium text-gray-700 w-32">{t("profileMgmt.deliveryAddressLabel")}</label>
                  <div className="text-gray-900 text-sm">{profile.deliveryAddress || t('profileMgmt.notAvailable')}</div>
                </div>
                <button
                  className="text-green-600 hover:text-green-700 text-sm cursor-pointer mt-2 sm:mt-0"
                  onClick={() => setShowAddressModal(true)}
                >
                  {t("profileMgmt.editButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleAddressUpdate}
      />

      {/* Footer */}
      <Footer />
    </motion.div>
  );
}

export default ProfileMgmt;
