import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressModal from './AddressModal'; // Assuming AddressModal is a local component
import useUserProfile from '../../Hooks/useUserProfile'; // Assuming this hook exists
import axios from 'axios';
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from '../../Hooks/Tostify'; // Assuming this utility exists
import Footer from '../common/Footer';
// i18n import
import { useTranslation } from 'react-i18next';
import Footer from '../common/Footer';

function ProfileMgmt() {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const navigate = useNavigate();
  const { profile, updateField, loading: profileLoading } = useUserProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(profile.username || '');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingName, setSavingName] = useState(false);

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
      showSuccessToast(t('profileMgmt.nameUpdateSuccess')); // Translated
    } catch (err) {
      console.error(err);
      showErrorToast(err.response?.data?.message || t('profileMgmt.nameUpdateFailed')); // Translated fallback
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
      showSuccessToast(t('profileMgmt.addressUpdateSuccess')); // Translated
    } catch (err) {
      console.error(err);
      showErrorToast(err.response?.data?.message || t('profileMgmt.addressUpdateFailed')); // Translated fallback
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <ToastifyContainer />
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.settingsTitle")}</h1> {/* Translated */}
          <nav className="space-y-1">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md cursor-pointer"
            >
              <span className="mr-3">👤</span> {t("profileMgmt.profileInfo")} {/* Translated */}
            </button>
            <button
              onClick={() => navigate('/accountsettings')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <span className="mr-3">⚙️</span> {t("profileMgmt.accountSettings")} {/* Translated */}
            </button>
            <button
              onClick={() => navigate('/paymentsettings')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <span className="mr-3">💳</span> {t("profileMgmt.payments")} {/* Translated */}
            </button>
            <button
              onClick={() => navigate('/dataprotection')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <span className="mr-3">🛡️</span> {t("profileMgmt.dataProtection")} {/* Translated */}
            </button>
            <button
              onClick={() => navigate('/emailsettings')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <span className="mr-3">✉️</span> {t("profileMgmt.emails")} {/* Translated */}
            </button>
            <button
              onClick={() => navigate('/aboutclassieds')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <span className="mr-3">❤️</span> {t("profileMgmt.aboutClassifiedAds")} {/* Translated */}
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("profileMgmt.profileInfoTitle")}</h2> {/* Translated */}
          <div className="space-y-6">
            {/* Profile Name */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-6">
                <label className="text-sm font-medium text-gray-700 w-32">{t("profileMgmt.profileNameLabel")}</label> {/* Translated */}
                {isEditingName ? (
                  <>
                    <input
                      type="text"
                      value={tempProfileName}
                      onChange={(e) => setTempProfileName(e.target.value)}
                      className="border rounded px-3 py-1 text-sm text-gray-800"
                    />
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="text-gray-700 border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-100 text-sm ml-2 cursor-pointer"
                    >
                      {t("profileMgmt.cancelButton")} {/* Translated */}
                    </button>
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="bg-lime-400 text-white px-4 py-1 rounded-full text-sm ml-2 hover:bg-lime-500 flex items-center gap-2 cursor-pointer"
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
                      {savingName ? t('profileMgmt.saving') : t('profileMgmt.save')} {/* Translated */}
                    </button>
                  </>
                ) : (
                  <div className="text-gray-900 text-sm">{profile.username || t('profileMgmt.notAvailable')}</div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-6">
                <label className="text-sm font-medium text-gray-700 w-32">{t("profileMgmt.deliveryAddressLabel")}</label> {/* Translated */}
                <div className="text-gray-900 text-sm">{profile.deliveryAddress || t('profileMgmt.notAvailable')}</div> {/* Translated N/A */}
              </div>
              <button
                className="text-green-600 hover:text-green-700 text-sm cursor-pointer"
                onClick={() => setShowAddressModal(true)}
              >
                {t("profileMgmt.editButton")} {/* Translated */}
              </button>
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
    </div>
  );
}
<Footer/>
export default ProfileMgmt;