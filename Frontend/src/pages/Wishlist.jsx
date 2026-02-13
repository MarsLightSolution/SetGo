import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlineCalendarToday } from "react-icons/md";
import { unlike } from "../slices/wishSlice";
import EmptyImage from '../assets/images/binocular.png';
import SafeImage from "../components/common/SafeImage";

// i18n import
import { useTranslation } from 'react-i18next';

const Wishlist = () => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation hook
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setTotalItems(wishlist.length);
  }, [wishlist]);

  const handleRemove = (post) => {
    // Alert is hardcoded here, but typically you'd use a toast or translated confirmation
    // alert("Item removed from wishlist!");
    dispatch(unlike(post));
  };

  // Helper to format date based on i18n language
  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    // Use i18n.language for locale-aware date formatting
    const locale = i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-GB');
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen py-8 px-4 flex flex-col justify-between">
      <div className="flex-grow">
        {totalItems > 0 ? ( // Use totalItems state
          <div className="max-w-5xl mx-auto bg-white rounded-md shadow-md p-6 mb-10">
            <h1 className="text-3xl font-bold text-green-700 mb-6">{t("wishlist.title")}</h1> {/* Translated main title */}

            <div className="flex flex-col gap-6">
              {wishlist.map((post, index) => {
                // Access translated title and description
                const displayTitle = post.title || post.title?.en || t("wishlist.untitledProduct");
                const displayDescription = post.description|| post.description?.en || t("wishlist.noDescription");
                const displayLocation = post.postalCode || post.location?.postalCode || t("home.unknownLocation"); // Reusing unknown location key

                return (
                  <div
                    key={post._id || index}
                    className="border border-gray-100 p-4 rounded flex flex-col md:flex-row md:items-center justify-between"
                  >
                    {/* Image */}
                    <Link to={`/product/${post._id}`} className="w-full md:w-[160px] h-[120px] flex items-center justify-center mb-4 md:mb-0 flex-shrink-0">
                      <SafeImage
                        src={`${import.meta.env.VITE_SERVER}/${post.pictures?.[0]?.replace(/\\/g, "/")}`}
                        alt={displayTitle}
                        className="h-full w-full object-contain rounded-md"
                      />
                    </Link>

                    {/* Info Section */}
                    <div className="flex-1 md:ml-4 w-full">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <MdOutlineCalendarToday className="text-gray-400" />
                          {formatPostDate(post.createdAt)} {/* Use localized date */}
                        </span>
                      </div>

                      <p className="font-bold text-lg text-black">{displayTitle}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {/* Shorten description, then translate "..." or "read more" */}
                        {displayDescription.length > 100
                          ? `${displayDescription.slice(0, 100)}...` // Simplified shortening
                          : displayDescription
                        }
                      </p>

                      <p className="text-green-700 font-bold text-xl mt-2">
                        ₼  {post.price}
                        <span className="text-sm font-normal text-green-700 ml-1">{t("wishlist.negotiable")}</span> {/* Translated */}
                      </p>

                      {/* Remove Button */}
                      <div className="mt-2">
                        <button
                          onClick={() => handleRemove(post)}
                          className="border border-green-800 text-green-800 hover:text-white hover:bg-green-700 transition px-4 py-1.5 rounded-full text-sm font-semibold"
                        >
                          {t("wishlist.removeFromWatchlist")} {/* Translated */}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            {/* Empty Wishlist Image */}
            <img
              src={EmptyImage}
              alt={t("wishlist.emptyWishlistAlt")} // Translated
              className="w-40 h-40 object-contain mb-4 opacity-80"
            />

            {/* Message */}
            <h1 className="text-gray-700 font-semibold text-xl mb-2">
              {t("wishlist.emptyMessage")} {/* Corrected key */}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {t("wishlist.suggestion")} {/* Corrected key */}
            </p>

            {/* Browse Listings Button */}
            <Link to="/">
              <button className="bg-green-600 hover\:bg-green-700 text-white text-sm font-medium rounded-md px-6 py-2 transition duration-300 border border-green-600 hover:bg-white hover:text-green-700">
                {t("wishlist.browseButton")} {/* Corrected key */}
              </button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};

export default Wishlist;