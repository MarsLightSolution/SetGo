import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarToday, LocationOn } from "@mui/icons-material";
import PaymentDialog from "./PaymentDialog";
import Footer from "../components/common/Footer";
import leftadImage from "../assets/images/ad01.png";
import rightadImage from "../assets/images/ad02.png";
import UserIcon from "../assets/icons/user.svg";
import SaveIcon from "../assets/icons/save.svg";
import EyeIcon from "../assets/icons/eye.svg";
import ShareModal from "../components/Popups/ShareModal";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import { toast } from "react-toastify";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { useTranslation } from 'react-i18next';

// Helper for multilingual fields (dynamic data from MongoDB)
const getLocalizedText = (field, lang = "en") => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] || field.en || field.de || ""; // Fallback to en, then de if current lang not found
};


const ProductDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dialogUser, setDialogUser] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const isWishlisted = wishlist.some((item) => item._id === product?._id);

  // Use i18n.language for dynamic content language
  const displayLanguage = i18n.language;

  const handleAddToWatchlist = (e) => {
    e.stopPropagation();

    if (!token) {
      alert(t("product_detail_page.login_to_add_watchlist"));
      return;
    }

    if (isWishlisted) {
      dispatch(unlike(product));
      toast.info(t("product_detail_page.removed_from_watchlist"));
    } else {
      dispatch(like(product));
      toast.success(t("product_detail_page.added_to_watchlist"));
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
    fetchProductById();
  }, [id, token, i18n.language]); // Added i18n.language here to re-fetch if language changes

  const fetchProductById = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/products/product/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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

  const fetchRelatedProducts = async (categoryObj) => {
    const categoryName = getLocalizedText(categoryObj, displayLanguage);
    if (!categoryName) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/products/category/${encodeURIComponent(categoryName)}`
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
  }, [product, id, i18n.language]);

  const handleBuyNow = async () => {
    const userId = user?._id;
    const ownerId = product?.owner?._id || product?.owner;

    if (!userId) {
      alert(t("product_detail_page.login_to_buy"));
      return;
    }
    if (!ownerId) {
      alert(t("product_detail_page.user_owner_not_loaded"));
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8080/users/get-users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json?.data) {
        setDialogUser(json.data);
        setShowPaymentDialog(true);
      } else {
        alert(t("product_detail_page.failed_to_load_user_data"));
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert(t("product_detail_page.an_error_occurred"));
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      alert(t("product_detail_page.login_to_send_messages"));
      return;
    }
    const ownerUsername = getLocalizedText(product.name || product.owner?.name, displayLanguage) || product.owner;

    if (!ownerUsername) {
      alert(t("product_detail_page.owner_info_not_available"));
      return;
    }

    // Call the global function to prepare chat state/data
    if (window.startChatConversation) {
      const productInfo = {
        title: getLocalizedText(product.title, displayLanguage),
        price: product.price,
        id: product._id,
      };
      // window.startChatConversation should NOT navigate directly.
      // It should only update global state that ChatApp might read.
      window.startChatConversation(ownerUsername, productInfo);
    }

    // Navigate using React Router after the chat state is prepared.
    // This is the controlled navigation.
    navigate(`/chat`); // Navigate to chat route (without language prefix)
  };

  const ownerId = product?.owner?._id || product?.owner || null;

  useEffect(() => {
    if (user && ownerId) {
      checkFollowStatus(user._id, ownerId);
    }
  }, [user, ownerId, token]);

  const checkFollowStatus = async (followerId, followingId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/check/${followerId}/${followingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setIsFollowing(data?.isFollowing);
    } catch (err) {
      console.error("Error checking follow status", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !ownerId) {
      alert(t("product_detail_page.authentication_required"));
      return;
    }
    setFollowLoading(true);

    try {
      const endpoint = isFollowing
        ? `http://localhost:8080/unfollow/${ownerId}`
        : `http://localhost:8080/follow/${ownerId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followerId: user._id }),
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        await checkFollowStatus(user._id, ownerId);
        toast.success(isFollowing ? t("product_detail_page.unfollowed") : t("product_detail_page.followed"));
      } else {
        const errorMsg = result.message || t("product_detail_page.follow_unfollow_failed");
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      alert(t("product_detail_page.an_error_occurred"));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-10">{t("common.loading_text")}</div>;
  if (!product)
    return (
      <div className="text-center text-red-500 mt-10">{t("product_detail_page.product_not_found")}</div>
    );

  const ownerRawName = product.owner?.name || product.name;
  const ownerName = getLocalizedText(ownerRawName, displayLanguage) || t("common.unknown_seller");
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const displayPostalCode = product.postalCode || product.location?.postalCode || t("common.unknown");


  return (
    <>
      <div className="min-h-screen bg-white-100 pt-3">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
            {/* Left Ad */}
            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={leftadImage}
                alt={t("home_page.left_ad_alt_text")}
                className="w-full h-[550px] object-cover rounded"
              />
            </div>

            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                <div className="md:col-span-2 space-y-6">
                  {/* IMAGE CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="w-full h-[300px] bg-gray-50 flex justify-center items-center rounded-md overflow-hidden">
                      <img
                        src={`http://localhost:8080/${
                          product.pictures?.[0]?.replace(/\\/g, "/") ||
                          "uploads/placeholder.jpg"
                        }`}
                        alt={getLocalizedText(product.title, displayLanguage)}
                        className="max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* DETAILS CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {getLocalizedText(product.title, displayLanguage) || t("product_detail_page.product_title_placeholder")}
                    </h1>
                    <p className="text-green-700 text-xl font-bold mb-3">
                      {product.price?.toLocaleString("en-IN")}€{" "}
                      <span className="text-sm">{t("product_detail_page.price_suffix")}</span>
                    </p>

                    <div className="text-sm text-gray-600 flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <LocationOn fontSize="small" />
                        {displayPostalCode}
                      </div>

                      <div className="flex items-center gap-1">
                        <CalendarToday fontSize="small" />
                        {new Date(product.createdAt).toLocaleDateString(
                          i18n.language
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <img src={EyeIcon} alt={t("product_detail_page.views_label")} className="w-5 h-5" />
                        {product.views || 0} {t("product_detail_page.views_label")}
                      </div>
                    </div>

                    <button
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-semibold text-sm"
                      onClick={handleBuyNow}
                    >
                      {t("product_detail_page.buy_now_button")}
                    </button>
                  </div>

                  {/* EXTRA INFO CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4 mt-6">
                    {product.location?.coordinates && product.location.coordinates.length === 2 && (
                      <div className="bg-white rounded-md shadow p-4 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("product_detail_page.location_heading")}</h2>
                        <MapContainer
                          center={[
                            product.location.coordinates[1],
                            product.location.coordinates[0],
                          ]}
                          zoom={13}
                          scrollWheelZoom={false}
                          style={{ height: "300px", width: "100%" }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker
                            position={[
                              product.location.coordinates[1],
                              product.location.coordinates[0],
                            ]}
                          >
                            <Popup>{getLocalizedText(product.title, displayLanguage) || t("product_detail_page.product_location_fallback")}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                      <div>
                        <div className="font-semibold text-gray-800">{t("product_detail_page.type_label")}</div>
                        <div>{product.type || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("product_detail_page.brand_label")}</div>
                        <div>{product.brand || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("product_detail_page.size_label")}</div>
                        <div>{product.size || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{t("product_detail_page.color_label")}</div>
                        <div>{product.color || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {t("product_detail_page.condition_label")}
                        </div>
                        <div>{product.condition || "NA"}</div>
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      {t("product_detail_page.description_heading")}
                    </h2>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {getLocalizedText(product.description, displayLanguage) || t("product_detail_page.no_description_available")}
                    </p>
                  </div>

                  {/* WRITE A MESSAGE CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      {t("product_detail_page.write_message_heading")}
                    </h2>

                    <div className="mb-4">
                      <label className="block font-medium text-gray-700 mb-1">
                        {t("product_detail_page.news_label")}
                      </label>
                      <textarea
                        className="w-full border rounded-md p-2 text-sm text-gray-800"
                        placeholder={t("product_detail_page.message_placeholder")}
                        rows={4}
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        {t("product_detail_page.profile_name_label")}
                      </label>
                      <div className="w-full border rounded-md p-2 bg-gray-100 text-sm text-gray-800">
                        {user?.name || "NA"}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">
                      {t("product_detail_page.data_transmission_info")}{" "}
                      <a href="#" className="text-green-700 underline">
                        {t("product_detail_page.more_information")}
                      </a>
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      {t("product_detail_page.terms_of_use_info")}{" "}
                      <a href="#" className="text-green-700 underline">
                        {t("product_detail_page.terms_of_use_link_text")}
                      </a>
                      {t("product_detail_page.privacy_policy_info_part1")}{" "}
                      <a href="#" className="text-green-700 underline">
                        {t("product_detail_page.privacy_policy_link_text")}
                      </a>
                      {t("product_detail_page.privacy_policy_info_part2")}
                    </p>

                    <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-semibold text-sm cursor-pointer" onClick={handleSendMessage}>
                      {t("product_detail_page.send_message_button")}
                    </button>
                  </div>
                </div>

                <div>
                  {/* Main Sidebar Section */}
                  <div className="bg-white rounded-xl shadow-md p-5 h-fit border border-gray-200 space-y-4">
                    <button
                      onClick={handleSendMessage}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      {t("product_detail_page.write_message_button")}
                    </button>

                    <button
                      onClick={handleAddToWatchlist}
                      className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isWishlisted ? t("product_detail_page.remove_from_watchlist_button") : t("product_detail_page.add_to_watchlist_button")}
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {t("product_detail_page.share_ad_button")}
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
                      <div className="flex items-center gap-2">
                        <img
                          src={UserIcon}
                          alt={t("product_detail_page.private_user_label")}
                          className="w-5 h-5"
                        />
                        <p>{t("product_detail_page.private_user_label")}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={SaveIcon}
                          alt={t("product_detail_page.active_since_label")}
                          className="w-5 h-5"
                        />
                        <p>
                          {t("product_detail_page.active_since_label")}{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            i18n.language
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
                          ? t("common.loading_text")
                          : isFollowing
                          ? t("product_detail_page.unfollow_button")
                          : t("product_detail_page.follow_button")}
                      </button>
                    )}
                  </div>

                  {/* Ad ID Section Below */}
                  <div className="bg-white rounded-xl shadow-md p-4 mt-4 border border-gray-200 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t("product_detail_page.ad_id_label")}:</span>
                      <span className="text-gray-900">{product._id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {relatedProducts.length > 0 && (
                <div className="max-w-6xl mx-auto mt-8 px-4">
                  <h2 className="text-xl font-semibold mb-6">
                    {t("product_detail_page.might_also_interest_you")}
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    {relatedProducts.map((item) => (
                      <div
                        key={item._id}
                        onClick={() =>
                          navigate(`/products/product/${item._id}`) // Navigate without language prefix
                        }
                        className="flex gap-4 bg-white shadow p-4 rounded-md hover:bg-gray-50 cursor-pointer transition"
                      >
                        <img
                          src={`http://localhost:8080/${
                            item.pictures?.[0]?.replace(/\\/g, "/") ||
                            "uploads/placeholder.jpg"
                          }`}
                          alt={getLocalizedText(item.title, displayLanguage)}
                          className="w-32 h-24 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 flex items-center justify-between">
                            <span>
                              📍 {item.postalCode || item.location?.postalCode || t("common.unknown")}{" "}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString(
                                i18n.language
                              )}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800 mt-1 mb-1 line-clamp-1">
                            {getLocalizedText(item.title, displayLanguage)}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {getLocalizedText(item.description, displayLanguage)}
                          </p>
                          <div className="flex gap-4 text-sm font-semibold text-green-700">
                            <span>{item.price?.toLocaleString("en-IN")}€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Ad */}
            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={rightadImage}
                alt={t("home_page.right_ad_alt_text")}
                className="w-full h-[550px] object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {showPaymentDialog && dialogUser && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          product={product}
          user={dialogUser}
          owner={ownerId}
          onPaymentSuccess={() => {
            console.log(t("payment_dialog.payment_success_log"));
          }}
        />
      )}
      {showShareModal && (
        <ShareModal
          product={product}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <Footer />
    </>
  );
};

export default ProductDetail;