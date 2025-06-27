import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddressModal from './AddressModal';
import useUserProfile from '../../Hooks/useUserProfile';
import axios from 'axios';
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from '../../Hooks/Tostify';

function ProfileMgmt() {
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
        `http://localhost:8080/nameupdate/${userId}/profileName`,
        { profileName: tempProfileName }
      );

      const updatedUser = res.data.data;
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      updateField('username', tempProfileName);
      setIsEditingName(false);
      showSuccessToast('Profile name updated successfully!');
    } catch (err) {
      console.error(err);
      showErrorToast(err.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleAddressUpdate = async (newAddress) => {
    const userId = JSON.parse(localStorage.getItem('userData'))?._id;

    try {
      const res = await axios.patch(
        `http://localhost:8080/deliveryaddress/${userId}/delivery-Address`,
        { deliveryAddress: newAddress }
      );

      const updatedUser = res.data.data;
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      updateField('deliveryAddress', newAddress);
      showSuccessToast('Address updated successfully!');
    } catch (err) {
      console.error(err);
      showErrorToast(err.response?.data?.message || 'Failed to update address');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <ToastifyContainer />
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>
          <nav className="space-y-1">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md"
            >
              <span className="mr-3">👤</span> Profile information
            </button>
            <button
              onClick={() => navigate('/accountsettings')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">⚙️</span> Account settings
            </button>
            <button
              onClick={() => navigate('/paymentsettings')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">💳</span> Payments
            </button>
            <button
              onClick={() => navigate('/dataprotection')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">🛡️</span> Data protection
            </button>
            <button
              onClick={() => navigate('/emailsettings')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">✉️</span> Emails
            </button>
            <button
              onClick={() => navigate('/aboutclassieds')}
              className="flex items-center w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span className="mr-3">❤️</span> About Classified Ads
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile information</h2>
          <div className="space-y-6">
            {/* Profile Name */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-6">
                <label className="text-sm font-medium text-gray-700 w-32">Profile name</label>
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
                      className="text-gray-700 border border-gray-300 px-3 py-1 rounded-full hover:bg-gray-100 text-sm ml-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="bg-lime-400 text-white px-4 py-1 rounded-full text-sm ml-2 hover:bg-lime-500 flex items-center gap-2"
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
                      {savingName ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <div className="text-gray-900 text-sm">{profile.username || 'N/A'}</div>
                )}
              </div>
              {!isEditingName && (
                <button
                  className="text-green-600 hover:text-green-700 text-sm"
                  onClick={() => {
                    setTempProfileName(profile.username || '');
                    setIsEditingName(true);
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            {/* Delivery Address */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center gap-6">
                <label className="text-sm font-medium text-gray-700 w-32">Delivery address</label>
                <div className="text-gray-900 text-sm">{profile.deliveryAddress || 'N/A'}</div>
              </div>
              <button
                className="text-green-600 hover:text-green-700 text-sm"
                onClick={() => setShowAddressModal(true)}
              >
                Edit
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

export default ProfileMgmt;
