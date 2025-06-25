import React, { useState } from 'react';

const AddressModal = ({ isOpen, onClose }) => {
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) return null; // ✅ Prevent modal from rendering unless needed

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-brightness-75 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative">
        {/* Close button */}
        <button
          onClick={onClose} // ✅ Hook up correctly
          className="absolute top-3 right-4 text-gray-500 hover:text-green-600 text-xl"
        >
          ×
        </button>

        {showForm ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select address</h2>
            <form className="space-y-3">
              <input type="text" placeholder="First name*" className="w-full border rounded px-4 py-2" />
              <input type="text" placeholder="Last name*" className="w-full border rounded px-4 py-2" />
              <input type="text" placeholder="Address suffix" className="w-full border rounded px-4 py-2" />
              <div className="flex gap-2">
                <input type="text" placeholder="Street*" className="flex-1 border rounded px-4 py-2" />
                <input type="text" placeholder="House number*" className="w-1/3 border rounded px-4 py-2" />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Postal code*" className="flex-1 border rounded px-4 py-2" />
                <input type="text" placeholder="Location*" className="flex-1 border rounded px-4 py-2" />
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
                  className="bg-lime-400 rounded-full px-5 py-1 text-sm text-black font-semibold hover:bg-lime-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select address</h2>
            <p className="mb-6 text-sm text-gray-700">
              Manage your saved addresses here. You can use them as delivery, billing, or shipping addresses, for example.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="text-green-700 text-sm font-medium flex items-center gap-2"
            >
              <span className="text-lg">➕</span> Add address
            </button>
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="bg-lime-400 rounded-full px-6 py-1 text-sm text-black font-semibold hover:bg-lime-500"
              >
                Ready
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressModal;
