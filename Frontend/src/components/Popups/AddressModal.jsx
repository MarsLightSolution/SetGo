import React, { useState } from 'react';
import {
  showSuccessToast,
  showErrorToast,
  ToastifyContainer,
} from '../../Hooks/Tostify';

const AddressModal = ({ isOpen, onClose, onSave }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    suffix: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    location: '',
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, street, houseNumber, postalCode, location } = address;

    // Validation: Required Fields
    if (!firstName || !lastName || !street || !houseNumber || !postalCode || !location) {
      return showErrorToast("Please fill all required fields.");
    }

    setLoading(true);

    try {
      const fullAddress = `${firstName} ${lastName}, ${address.suffix || ''}, ${street} ${houseNumber}, ${postalCode}, ${location}`.trim();

      // Save to parent
      onSave(fullAddress);

      // Reset form
      setShowForm(false);
      showSuccessToast("Address updated successfully!");
      onClose();
    } catch (error) {
      showErrorToast("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-brightness-75 z-50">
      <ToastifyContainer />
      <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 hover:text-green-600 text-xl">×</button>

        {showForm ? (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold mb-4">Enter address</h2>
            <input name="firstName" value={address.firstName} onChange={handleInputChange} placeholder="First name*" className="w-full border rounded px-4 py-2" />
            <input name="lastName" value={address.lastName} onChange={handleInputChange} placeholder="Last name*" className="w-full border rounded px-4 py-2" />
            <input name="suffix" value={address.suffix} onChange={handleInputChange} placeholder="Address suffix" className="w-full border rounded px-4 py-2" />
            <div className="flex gap-2">
              <input name="street" value={address.street} onChange={handleInputChange} placeholder="Street*" className="flex-1 border rounded px-4 py-2" />
              <input name="houseNumber" value={address.houseNumber} onChange={handleInputChange} placeholder="House number*" className="w-1/3 border rounded px-4 py-2" />
            </div>
            <div className="flex gap-2">
              <input name="postalCode" value={address.postalCode} onChange={handleInputChange} placeholder="Postal code*" className="flex-1 border rounded px-4 py-2" />
              <input name="location" value={address.location} onChange={handleInputChange} placeholder="Location*" className="flex-1 border rounded px-4 py-2" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border rounded-full px-5 py-1 text-sm text-green-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-lime-400 rounded-full px-5 py-1 text-sm text-black font-semibold hover:bg-lime-500 flex items-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4 text-black"
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
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Delivery address</h2>
            <p className="mb-6 text-sm text-gray-700">Manage your saved delivery address here.</p>
            <button onClick={() => setShowForm(true)} className="text-green-700 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">➕</span> Add address
            </button>
            <div className="flex justify-end mt-6">
              <button onClick={onClose} className="bg-lime-400 rounded-full px-6 py-1 text-sm text-black font-semibold hover:bg-lime-500">Ready</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressModal;
