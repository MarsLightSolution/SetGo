"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Added Link
import { CalendarToday, LocationOn } from "@mui/icons-material";
import Footer from "../components/common/Footer";
import leftadImage from "../assets/images/ad01.png";
import rightadImage from "../assets/images/ad02.png";
import UserIcon from "../assets/icons/user.svg";
import SaveIcon from "../assets/icons/save.svg";
import EyeIcon from "../assets/icons/eye.svg";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import { toast } from "react-toastify";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// i18n import
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Import i18n instance to get current language

// Fix default icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});


// Helper for multilingual fields (simplified to use i18n directly)
const getLocalizedText = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[i18n.language] || field.en || ""; // Fallback to English, then empty string
};


const ProductDetail = () => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("userId"); // No longer directly using token from localStorage for API auth
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const isWishlisted = wishlist.some((item) => item._id === product?._id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (!product?.pictures) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.pictures.length);
  };

  const prevImage = () => {
    if (!product?.pictures) return;
    setCurrentImageIndex((prevIndex) =>
      (prevIndex - 1 + product.pictures.length) % product.pictures.length
    );
  };
  const handleAddToWatchlist = (e) => {
    e.stopPropagation();

    // You might still want to check for a user being logged in,
    // even if the token isn't explicitly sent as a header.
    // This assumes your Redux state or another context holds user login status.
    if (!user) { // Check if user object exists
      alert(t("productDetail.loginToWatchlist")); // Translated
      return;
    }

    if (isWishlisted) {
      dispatch(unlike(product));
      toast.info(t("productDetail.removedFromWatchlist")); // Translated
    } else {
      dispatch(like(product));
      toast.success(t("productDetail.addedToWatchlist")); // Translated
    }
  };


  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing userData:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Pass i18n.language to fetch products in specific language (for dynamic content)
    fetchProductById();
  }, [id, i18n.language]); // Removed 'token' from dependencies

  const fetchProductById = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/products/product/${id}?lang=${i18n.language}`,
        {
            credentials: "include", // This is crucial for sending cookies
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch product:", res.status, res.statusText);
        setProduct(null);
        return;
      }

      const result = await res.json();
      setProduct(result.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // categoryObj will be { en: "...", az: "...", ru: "..." }
  const fetchRelatedProducts = async (categoryObj) => {
    const categoryName = getLocalizedText(categoryObj); // Get category in current display language
    if (!categoryName) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/products/category/${encodeURIComponent(categoryName)}?lang=${i18n.language}`
      );
      const json = await res.json();
      const filtered = json.data?.filter((p) => p._id !== id).slice(0, 3);
      setRelatedProducts(filtered || []);
    } catch (err) {
      console.error("Failed to fetch related products", err);
    }
  };

  useEffect(() => {
    if (product?.category) {
      fetchRelatedProducts(product.category);
    }
  }, [product, id, i18n.language]); // Added i18n.language to dependencies

const handleBuyNow = async () => {
  const userId = user?._id;
  const ownerId = product?.owner?._id || product?.owner;

  if (!userId) {
    alert(t("productDetail.loginToBuy"));
    return;
  }
  if (!ownerId) {
    alert(t("productDetail.ownerInfoMissing"));
    return;
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SERVER}/users/get-users/${userId}`,
      { credentials: "include" }
    );
    const json = await res.json();
    if (json?.data) {
      // ✅ instead of dialog, navigate to checkout
      navigate("/checkout", {
        state: {
          product,
          user: json.data,
        },
      });
    } else {
      alert(t("productDetail.failedToLoadUserData"));
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    alert(t("productDetail.errorLoadingUserData"));
  }
};
const handleSendMessage = async () => {
  if (!user) {
    alert(t("productDetail.loginToMessage")); // Translated
    return;
  }

  const ownerId = product?.owner?._id || product?.owner;
  if (!ownerId) {
    alert(t("productDetail.ownerInfoMissingMessaging"));
    return;
  }

  try {
    // Step 1: Get or create conversation from backend
    const res = await fetch(`${import.meta.env.VITE_SERVER}/api/chat/conversation/get-or-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        senderId: user._id,
        receiverId: ownerId,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || t("productDetail.failedToStartConversation"));
      return;
    }

    const conversationId = data.conversation._id;

    // Step 2: Send a hardcoded initial message
    const initialMessage = "Hi! I'm interested in your product.";
    await fetch(`${import.meta.env.VITE_SERVER}/api/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        conversationId,
        senderId: user._id,
        text: initialMessage,
      }),
    });

    // Step 3: Redirect to chat page with conversationId
    navigate("/chat", {
      state: {
        conversationId,
        receiverUsername: product.owner?.username || ownerId,
      },
    });
  } catch (err) {
    console.error("Error starting chat:", err);
    alert(t("productDetail.anErrorOccurred"));
  }
};
  const ownerId = product?.owner?._id || product?.owner || null;

  useEffect(() => {
    if (user && ownerId) {
      checkFollowStatus(user._id, ownerId);
    }
  }, [user, ownerId]); // Removed 'token' from dependencies

  const checkFollowStatus = async (followerId, followingId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/check/${followerId}/${followingId}`,
        { credentials: "include" } // Ensure credentials are included
      );
      const data = await res.json();
      setIsFollowing(data?.isFollowing);
    } catch (err) {
      console.error("Error checking follow status", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !ownerId) {
      alert(t("productDetail.authRequiredFollow")); // Translated
      return;
    }
    setFollowLoading(true);

    try {
      const endpoint = isFollowing
        ? `${import.meta.env.VITE_SERVER}/unfollow/${ownerId}`
        : `${import.meta.env.VITE_SERVER}/follow/${ownerId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Removed Authorization header: Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followerId: user._id }),
        credentials: "include", // Ensure credentials are included
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        await checkFollowStatus(user._id, ownerId);
        toast.success(isFollowing ? t("productDetail.unfollowed") : t("productDetail.followed")); // Translated
      } else {
        const errorMsg = result.message || t("productDetail.followUnfollowFailed"); // Translated fallback
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      alert(t("productDetail.anErrorOccurred")); // Translated
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-10">{t("productDetail.loadingProduct")}</div>; // Translated
  if (!product)
    return (
      <div className="text-center text-red-500 mt-10">{t("productDetail.productNotFound")}</div> // Translated
    );

  // Safely access owner name, prioritizing populated user object, then product.name, then "Unknown Seller"
  const ownerRawName = product.owner?.name || product.name;
  const ownerName = typeof ownerRawName === 'object' ? getLocalizedText(ownerRawName) : ownerRawName || t("productDetail.unknownSeller");
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  // Postal code is a direct field on product now
  const displayPostalCode = product.postalCode || product.location?.postalCode || t("home.unknownLocation");

  return (
    <>
      <div className="min-h-screen bg-white-100 pt-3">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={leftadImage}
                alt={t("home.leftAdAlt")} // Reusing home key
                className="w-full h-[550px] object-cover rounded"
              />
            </div>

            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                <div className="md:col-span-2 space-y-6">
                  {/* IMAGE CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                  <div className="relative w-full h-[300px] bg-gray-50 flex justify-center items-center rounded-md overflow-hidden">
{product?.pictures?.length > 0 ? (
  <>
    <img
      src={`${import.meta.env.VITE_SERVER}/${product.pictures[currentImageIndex].replace(/\\/g, "/")}`}
      alt={`Product image ${currentImageIndex + 1}`}
      className="max-h-full max-w-full object-contain"
    />

    {/* Left Arrow */}
    {product.pictures.length > 1 && (
      <button
        onClick={prevImage}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl transition"
        aria-label="Previous Image"
      >
        &#10094;
      </button>
    )}

    {/* Right Arrow */}
    {product.pictures.length > 1 && (
      <button
        onClick={nextImage}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl transition"
        aria-label="Next Image"
      >
        &#10095;
      </button>
    )}
  </>
) : (
  <img
    src={`${import.meta.env.VITE_SERVER}/uploads/placeholder.jpg`}
    alt="Placeholder"
    className="max-h-full object-contain"
  />
)}
</div>

{/* Optional Image Counter */}
{product.pictures?.length > 1 && (
  <div className="text-center text-sm text-gray-500 mt-2">
    {currentImageIndex + 1} / {product.pictures.length}
  </div>
)}

                  </div>
                  {/* DETAILS CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {getLocalizedText(product.title) || t("productDetail.productTitlePlaceholder")}
                    </h1>
                    <p className="text-green-700 text-xl font-bold mb-3">
                      ₼  {product.price?.toLocaleString(i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-IN'))}{" "}
                      <span className="text-sm">{t("productDetail.negotiableAbbr")}</span>
                    </p>

                    <div className="text-sm text-gray-600 flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <LocationOn fontSize="small" />
                        {displayPostalCode}
                      </div>

                      <div className="flex items-center gap-1">
                        <CalendarToday fontSize="small" />
                        {new Date(product.createdAt).toLocaleDateString(
                          i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-GB')
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <img src={EyeIcon} alt={t("productDetail.viewsAlt")} className="w-5 h-5" />
                        {product.views || 0}
                      </div>
                    </div>

                    <button
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-semibold text-sm cursor-pointer"
                      onClick={handleBuyNow}
                    >
                      {t("productDetail.buyNowButton")}
                    </button>
                  </div>

                  {/* EXTRA INFO CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4 mt-6 relative ">
                    {/* MAP LOCATION CONTAINER */}
                    {product.location?.coordinates && product.location.coordinates.length === 2 && (
                      <div className="bg-white rounded-md shadow p-4 mb-6"> {/* Added mb-6 for spacing */}
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>
                          <div className="w-full overflow-hidden rounded-md" style={{ height: "300px" }}>
                        <MapContainer
                          center={[
                            product.location.coordinates[1],
                            product.location.coordinates[0],
                          ]}
                          zoom={13}
                          scrollWheelZoom={false}
                          style={{ height: "300px", width: "100%", zIndex: 0, position: "relative" }}
                        >
                          <TileLayer
                            attribution={t("productDetail.mapAttribution")}
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            position={[
                              product.location.coordinates[1],
                              product.location.coordinates[0],
                            ]}
                          >
                            <Popup>{getLocalizedText(product.title) || t("productDetail.productLocation")}</Popup>
                          </Marker>
                        </MapContainer>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                      <div>
                        <div className="font-semibold text-gray-800">{t("productDetail.typeLabel")}</div>
                        <div>{product.type || t("productDetail.notAvailableAbbr")}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("productDetail.brandLabel")}</div>
                        <div>{product.brand || t("productDetail.notAvailableAbbr")}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("productDetail.sizeLabel")}</div>
                        <div>{product.size || t("productDetail.notAvailableAbbr")}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("productDetail.colorLabel")}</div>
                        <div>{product.color || t("productDetail.notAvailableAbbr")}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("productDetail.conditionLabel")}</div>
                        <div>{product.condition || t("productDetail.notAvailableAbbr")}</div>
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      {t("productDetail.descriptionSectionTitle")}
                    </h2>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {getLocalizedText(product.description) || t("productDetail.noDescriptionAvailable")}
                    </p>
                  </div>

                  {/* WRITE A MESSAGE CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      {t("productDetail.writeMessageTitle")}
                    </h2>

                    <div className="mb-4">
                      <label className="block font-medium text-gray-700 mb-1">
                        {t("productDetail.newsLabel")}
                      </label>
                      <textarea
                        className="w-full border rounded-md p-2 text-sm text-gray-800"
                        placeholder={t("productDetail.messagePlaceholder")}
                        rows={4}
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <label className="block font-medium text-gray-700 mb-1">
                        {t("productDetail.profileNameLabel")}
                      </label>
                      <div className="w-full border rounded-md p-2 bg-gray-100 text-sm text-gray-800">
                        {getLocalizedText(user?.name) || t("productDetail.notAvailableAbbr")}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">
                      {t("productDetail.dataTransmissionInfo1")}{" "}
                      <a href="#" className="text-green-700 underline">
                        {t("productDetail.moreInformation")}
                      </a>
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      {t("productDetail.dataTransmissionInfo2")}{" "}
                      <a href="#" className="text-green-700 underline">
                        {t("productDetail.termsOfUse")}
                      </a>
                      . {t("productDetail.dataTransmissionInfo3")}{" "}
                      <a href="#" className="text-green-700 underline">
                        {t("productDetail.privacyPolicy")}
                      </a>
                      .
                    </p>

                    <button
                      onClick={handleSendMessage}
                      className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-semibold text-sm cursor-pointer">
                      {t("productDetail.sendMessageButton")}
                    </button>
                  </div>
                </div>

                <div>
                  {/* Main Sidebar Section */}
                  <div className="bg-white rounded-xl shadow-md p-5 h-fit border border-gray-200 space-y-4">
                    {/* Green Rounded "Write a message" button */}
                    <button
                      onClick={handleSendMessage}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      {t("productDetail.writeMessageButton")}
                    </button>

                    {/* Outlined Buttons */}
                    <button
                      onClick={handleAddToWatchlist}
                      className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isWishlisted ? t("productDetail.removeFromWatchlistButton") : t("productDetail.addToWatchlistButton")} {/* Corrected keys here */}
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {t("productDetail.shareAdButton")} {/* Corrected key here */}
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center text-white text-sm font-bold">
                        {ownerInitial}
                      </div>
                      <p className="font-semibold text-sm text-gray-900">
                        {ownerName}
                      </p>
                    </div>

                    {/* User Status */}
                    <div className="text-sm text-gray-600 space-y-1 pl-1">
                      {/* Private user row */}
                      <div className="flex items-center gap-2">
                        <img
                          src={UserIcon}
                          alt={t("productDetail.userIconAlt")}
                          className="w-5 h-5"
                        />
                        <p>{t("productDetail.privateUser")}</p>
                      </div>

                      {/* Active since row */}
                      <div className="flex items-center gap-2">
                        <img
                          src={SaveIcon}
                          alt={t("productDetail.activeSinceIconAlt")}
                          className="w-5 h-5"
                        />
                        <p>
                          {t("productDetail.activeSince")}{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-GB')
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Follow Button */}
                    {user?._id !== ownerId && (
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`w-full border border-gray-600 text-sm font-medium cursor-pointer py-2 rounded-full flex justify-center items-center gap-2 hover:bg-green-50 ${
                          isFollowing
                            ? "text-red-600 border-red-500 hover:bg-red-50"
                            : "text-green-700 border-green-600 hover:bg-green-50"
                        }`}
                      >
                        {followLoading
                          ? t("productDetail.loading")
                          : isFollowing
                          ? t("productDetail.unfollowButton")
                          : t("productDetail.followButton")}
                      </button>
                    )}
                  </div>

                  {/* Ad ID Section Below */}
                  <div className="bg-white rounded-xl shadow-md p-4 mt-4 border border-gray-200 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t("productDetail.adIdLabel")}:</span>
                      <span className="text-gray-900">{product._id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {relatedProducts.length > 0 && (
                <div className="max-w-6xl mx-auto mt-8 px-4">
                  <h2 className="text-xl font-semibold mb-6">
                    {t("productDetail.mightAlsoInterestYouTitle")}
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    {relatedProducts.map((item) => (
                      <div
                        key={item._id}
                        onClick={() =>
                          navigate(`/products/product/${item._id}`)
                        }
                        className="flex gap-4 bg-white shadow p-4 rounded-md hover:bg-gray-50 cursor-pointer transition"
                      >
                        <img
                          src={`${import.meta.env.VITE_SERVER}/${
                            item.pictures?.[0]?.replace(/\\/g, "/") ||
                            "uploads/placeholder.jpg"
                          }`}
                          alt={getLocalizedText(item.title)}
                          className="w-32 h-24 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 flex items-center justify-between">
                            <span>
                              📍 {item.postalCode || item.location?.postalCode || t("home.unknownLocation")}{" "}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString(
                                i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-GB')
                              )}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800 mt-1 mb-1 line-clamp-1">
                            {getLocalizedText(item.title)}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {getLocalizedText(item.description)}
                          </p>
                          <div className="flex gap-4 text-sm font-semibold text-green-700">
                            <span>{item.price?.toLocaleString(i18n.language === 'az' ? 'az-AZ' : (i18n.language === 'ru' ? 'ru-RU' : 'en-IN'))}₼ </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={rightadImage}
                alt={t("home.rightAdAlt")}
                className="w-full h-[550px] object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;