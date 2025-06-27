import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from '../../Hooks/Tostify';

function NewPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      return showErrorToast('Both fields are required.');
    }

    if (newPassword !== confirmPassword) {
      return showErrorToast('Passwords do not match.');
    }

    setLoading(true);

    try {
      const res = await axios.post(`http://localhost:8080/resetpassword?token=${token}`, {
        newPassword,
      });

      if (res.status === 200) {
        showSuccessToast('Password reset successful! Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showErrorToast('Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Server error. Please try again.';
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastifyContainer />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">
              New Password
            </h1>
            <p className="text-gray-600 mb-8">
              Please enter your new password below. Make sure it's secure and easy for you to remember.
            </p>

            <div className="space-y-6">
              {/* New Password Field */}
              <div className="flex items-center gap-4 relative">
                <label className="w-40 text-gray-700 font-medium">New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 max-w-md border border-gray-300 rounded-md px-4 py-2 pr-10"
                />
                <span
                  className="absolute right-5 cursor-pointer text-gray-500"
                  onClick={() => setShowNew((prev) => !prev)}
                >
                  {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                </span>
              </div>

              {/* Confirm Password Field */}
              <div className="flex items-center gap-4 relative">
                <label className="w-40 text-gray-700 font-medium">Confirm Password</label>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 max-w-md border border-gray-300 rounded-md px-4 py-2 pr-10"
                />
                <span
                  className="absolute right-5 cursor-pointer text-gray-500"
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                </span>
              </div>

              {/* Save Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-white text-green-600 border-2 border-green-600 hover:bg-green-50 px-12 py-2 rounded-full flex items-center gap-2"
                >
                  {loading && (
                    <svg
                      className="animate-spin h-4 w-4 text-green-600"
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
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NewPassword;
