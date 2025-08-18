import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentDialog from "../../pages/PaymentDialog";
import ShareModal from "../../components/Popups/ShareModal";

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [dialogUser, setDialogUser] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const product = state?.product;
  const user = state?.user;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg font-semibold text-gray-600 mb-4">
          ⚠️ No product found. Please go back and try again.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    address: "",
    city: "",
    postalCode: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckout = async () => {
    const userId = user?._id;
    const ownerId = product?.owner?._id || product?.owner;

    if (!userId) {
      alert("⚠️ Please log in to continue.");
      return;
    }
    if (!ownerId) {
      alert("⚠️ Seller information missing.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/users/get-users/${userId}`,
        { credentials: "include" } // Keep credentials for cookie sending
      );
      const json = await res.json();
      if (json?.data) {
        setDialogUser(json.data);
        setShowPaymentDialog(true);
      } else {
        alert("❌ Failed to load user data.");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert("❌ Error loading user data.");
    }
  };

  const tax = product.price * 0.1;
  const total = product.price + tax;
  const ownerId = product?.owner?._id || product?.owner;

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8">
        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <img
            src={product.pictures[0]}
            alt={product.title.en}
            className="w-full h-64 object-cover rounded-xl mb-4"
          />
          <h2 className="text-2xl font-bold">{product.title.en}</h2>
          <p className="text-gray-600 mt-2">{product.description.en}</p>
          <p className="mt-3">
            <span className="font-semibold">Condition:</span>{" "}
            {product.condition}
          </p>
          <p>
            <span className="font-semibold">Seller:</span> {product.name.en}
          </p>
          <p className="text-sm text-gray-500">{product.street}</p>
          <p className="mt-4 text-xl font-bold">${product.price}</p>
        </div>

        {/* Checkout Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Checkout</h3>

          <div className="space-y-4">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="postalCode"
              placeholder="Postal Code"
              value={form.postalCode}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Order Summary */}
          <div className="mt-6 border-t pt-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Product Price:</span>
              <span>${product.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
          >
            Place Order
          </button>
        </div>
      </div>

      {/* ✅ Payment Dialog */}
      {showPaymentDialog && dialogUser && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          product={product}
          user={dialogUser}
          owner={ownerId}
          onPaymentSuccess={() => {
            console.log("✅ Payment success");
          }}
        />
      )}

      {/* ✅ Share Modal */}
      {showShareModal && (
        <ShareModal
          product={product}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default CheckoutPage;
