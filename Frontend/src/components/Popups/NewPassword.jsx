import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function NewPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      return setMessage('Both fields are required.');
    }

    if (newPassword !== confirmPassword) {
      return setMessage('Passwords do not match.');
    }

    try {
      const res = await axios.post(`http://localhost:8080/resetpassword?token=${token}`, {
        newPassword,
      });

      if (res.status === 200) {
        setMessage('✅ Password reset successful. Redirecting to login...');
        setTimeout(() => {
          navigate('/login'); // 🔁 redirect after 2 seconds
        }, 2000);
      } else {
        setMessage('❌ Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage(error?.response?.data?.error || 'Server error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">New Password</h1>
            <p className="text-gray-600 mb-8">
              Please enter your new password below. Make sure it's secure and easy for you to remember.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="w-40 text-gray-700 font-medium">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 max-w-md border border-gray-300 rounded-md px-4 py-2"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-40 text-gray-700 font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 max-w-md border border-gray-300 rounded-md px-4 py-2"
                />
              </div>

              {message && (
                <p className={`text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleSubmit}
                  className="bg-white text-green-600 border-2 border-green-600 hover:bg-green-50 px-12 py-2 rounded-full"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Keep your footer if needed */}
    </div>
  );
}

export default NewPassword;