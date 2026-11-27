import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import axios from 'axios';

// Same rules as signup and the server's change-password check.
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

function NewPasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePasswordSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128 || !PASSWORD_RULE.test(newPassword)) {
      setErrorMsg("Password must be at least 8 characters with an uppercase letter, a lowercase letter and a number.");
      return;
    }

    try {
      setLoading(true);
      // The logged-in user comes from the login token; the current password is checked.
      const res = await axios.patch(`${import.meta.env.VITE_SERVER}/api/v2/profile/change-password`, {
        currentPassword,
        newPassword,
      });

      if (res.status === 200) {
        setSuccessMsg("Password updated successfully.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error("Password update failed:", err);
      setErrorMsg(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-6 bg-white rounded-xl shadow-xl w-[500px]">
      {/* Close Icon */}
      <button
        onClick={onClose}
        className="absolute top-7 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <X size={16} />
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-6">Change Your Password</h2>

      <div className="space-y-6">
        {/* Current Password */}
        <div className="flex items-center gap-2">
          <label className="w-40 text-base text-gray-700">Current Password</label>
          <div className="relative flex-1">
            <input
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full px-5 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            >
              {showCurrent ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="flex items-center gap-2">
          <label className="w-40 text-base text-gray-700">New Password</label>
          <div className="relative flex-1">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full px-5 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex items-center gap-2">
          <label className="w-40 text-base text-gray-700">Confirm Password</label>
          <div className="relative flex-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              className="w-full px-5 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            >
              {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        {/* Error / Success Message */}
        {(errorMsg || successMsg) && (
          <div className={`text-sm ${errorMsg ? "text-red-500" : "text-green-600"} text-right pr-1`}>
            {errorMsg || successMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 text-base border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handlePasswordSave}
            className="px-6 py-2 text-base text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewPasswordModal;
