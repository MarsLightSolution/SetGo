import React from "react";
import { FaWhatsapp, FaFacebookF, FaEnvelope } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const ShareModal = ({ onClose, product }) => {
  const shareUrl = `${import.meta.env.VITE_SERVER}/products/product/${product._id}`;
  const title = encodeURIComponent(product.title);

  return (
    <div className="fixed inset-0 z-50 bg-black/10 flex items-center justify-center px-4">
      {/* Modal Box */}
      <div className="bg-white rounded-lg shadow-md max-w-md w-full p-6 relative border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <IoClose size={22} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">
          Share this ad
        </h2>
        <p className="text-sm text-gray-600 mb-5 text-center">
          Let others know about this product via:
        </p>

        {/* Share Buttons */}
        <div className="space-y-3">
          <a
            href={`https://api.whatsapp.com/send?text=${title}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-green-500 text-green-700 hover:bg-green-50 py-2 rounded-full transition text-sm"
          >
            <FaWhatsapp size={16} />
            WhatsApp
          </a>

          <a
            href={`mailto:?subject=${title}&body=${shareUrl}`}
            className="flex items-center justify-center gap-2 border border-gray-500 text-gray-700 hover:bg-gray-100 py-2 rounded-full transition text-sm"
          >
            <FaEnvelope size={15} />
            Email
          </a>

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-blue-600 text-blue-700 hover:bg-blue-50 py-2 rounded-full transition text-sm"
          >
            <FaFacebookF size={15} />
            Facebook
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
