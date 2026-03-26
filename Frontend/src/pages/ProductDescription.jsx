"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CalendarToday, LocationOn } from "@mui/icons-material";
import {
  Store as StoreIcon,
  Verified as VerifiedIcon,
  Inventory as InventoryIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import UserIcon from "../assets/icons/user.svg";
import SaveIcon from "../assets/icons/save.svg";
import EyeIcon from "../assets/icons/eye.svg";
import { useDispatch, useSelector } from "react-redux";
import { like, unlike } from "../slices/wishSlice";
import { toast } from "react-toastify";
import { GoogleMap, MarkerF, InfoWindowF } from "@react-google-maps/api";
import { GoogleMapsLoader } from "../components/common/GoogleMap";
import ShareModal from "../components/Popups/ShareModal";
import SafeImage from "../components/common/SafeImage";

// i18n import
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

// Helper for multilingual fields
const getLocalizedText = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[i18n.language] || field.en || "";
};

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("userId");
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarAds, setSidebarAds] = useState({ left: [], right: [], banner: [], inline: [] });

  // ============= REVIEW STATES =============
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState(null);
  const [sortBy, setSortBy] = useState("recent");
  const reviewsPerPage = 10;

  const nextImage = () => {
    if (!product?.pictures) return;
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % product.pictures.length
    );
  };

  const prevImage = () => {
    if (!product?.pictures) return;
    setCurrentImageIndex(
      (prevIndex) =>
        (prevIndex - 1 + product.pictures.length) % product.pictures.length
    );
  };

  const handleAddToWatchlist = (e) => {
    e.stopPropagation();

    if (!user) {
      alert(t("productDetail.loginToWatchlist"));
      return;
    }

    if (isWishlisted) {
      dispatch(unlike(product));
      toast.info(t("productDetail.removedFromWatchlist"));
    } else {
      dispatch(like(product));
      toast.success(t("productDetail.addedToWatchlist"));
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_SERVER}/api/ads/public`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSidebarAds(d.ads) })
      .catch(() => {})
  }, [])

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
  }, [id, i18n.language]);

  useEffect(() => {
    if (product?._id) {
      console.log("🔍 Fetching reviews for product:", product._id);
      fetchReviewSummary();
      fetchReviews();
    }
  }, [product?._id, currentPage, filterRating, sortBy]);

  const fetchProductById = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/products/product/${id}?lang=${
          i18n.language
        }`,
        {
          credentials: "include",
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
    const categoryName = getLocalizedText(categoryObj);
    if (!categoryName) return;

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_SERVER
        }/api/products/category/${encodeURIComponent(categoryName)}?lang=${
          i18n.language
        }`
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

  // ============= REVIEW FETCH FUNCTIONS =============
  const fetchReviewSummary = async () => {
    try {
      const url = `${import.meta.env.VITE_SERVER}/reviews/product/${id}/summary`;
      console.log("📊 Fetching review summary from:", url);
      
      const res = await fetch(url, {
        credentials: "include",
      });

      console.log("📊 Review summary response status:", res.status);

      if (!res.ok) {
        console.error("❌ Failed to fetch review summary:", res.status);
        return;
      }

      const result = await res.json();
      console.log("📊 Review summary full response:", result);
      
      if (result.success && result.data) {
        // Transform the distribution from controller format to frontend format
        const transformedSummary = {
          averageRating: result.data.averageRating || 0,
          totalReviews: result.data.totalReviews || 0,
          ratingBreakdown: {
            5: result.data.distribution?.fiveStar || 0,
            4: result.data.distribution?.fourStar || 0,
            3: result.data.distribution?.threeStar || 0,
            2: result.data.distribution?.twoStar || 0,
            1: result.data.distribution?.oneStar || 0,
          }
        };
        console.log("📊 Transformed summary:", transformedSummary);
        setReviewSummary(transformedSummary);
      }
    } catch (error) {
      console.error("❌ Error fetching review summary:", error);
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      let url = `${import.meta.env.VITE_SERVER}/reviews/product/${id}?page=${currentPage}&limit=${reviewsPerPage}&sortBy=${sortBy}`;
      
      if (filterRating) {
        url += `&rating=${filterRating}`;
      }

      console.log("📝 Fetching reviews from:", url);

      const res = await fetch(url, {
        credentials: "include",
      });

      console.log("📝 Reviews response status:", res.status);

      if (!res.ok) {
        console.error("❌ Failed to fetch reviews:", res.status);
        return;
      }

      const result = await res.json();
      console.log("📝 Reviews full response:", result);
      
      if (result.success) {
        // The controller returns reviews directly in 'data', not 'data.reviews'
        const reviewsData = result.data || [];
        
        // Transform reviews to include buyer name
        const transformedReviews = reviewsData.map(review => ({
          ...review,
          buyerName: review.buyerId?.username || review.buyerId?.profileName || "Anonymous",
          verified: review.isVerifiedPurchase || false,
          sellerResponse: review.sellerResponse ? {
            responseText: review.sellerResponse.text,
            respondedAt: review.sellerResponse.respondedAt
          } : null
        }));
        
        console.log("📝 Transformed reviews:", transformedReviews);
        setReviews(transformedReviews);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!user?._id) {
      toast.error("Please login to mark reviews as helpful");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/reviews/${reviewId}/helpful`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ userId: user._id }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message?.includes("already marked")) {
          toast.info("You've already marked this as helpful");
        } else {
          throw new Error("Failed to mark review as helpful");
        }
        return;
      }

      toast.success("Review marked as helpful!");
      fetchReviews();
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      toast.error("Failed to mark review as helpful");
    }
  };

  const renderStars = (rating, size = "text-base") => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className={`${size} text-yellow-500`}>
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className={`${size} text-yellow-500`}>
          ⯨
        </span>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className={`${size} text-gray-300`}>
          ★
        </span>
      );
    }

    return <div className="flex items-center">{stars}</div>;
  };

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
      alert(t("productDetail.loginToMessage"));
      return;
    }

    const ownerId = product?.owner?._id || product?.owner;
    if (!ownerId) {
      alert(t("productDetail.ownerInfoMissingMessaging"));
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/api/chat/conversation/get-or-create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            senderId: user._id,
            receiverId: ownerId,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message || t("productDetail.failedToStartConversation"));
        return;
      }

      const conversationId = data.conversation._id;

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
  }, [user, ownerId]);

  const checkFollowStatus = async (followerId, followingId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/check/${followerId}/${followingId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setIsFollowing(data?.isFollowing);
    } catch (err) {
      console.error("Error checking follow status", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !ownerId) {
      alert(t("productDetail.authRequiredFollow"));
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
        },
        body: JSON.stringify({ followerId: user._id }),
        credentials: "include",
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        await checkFollowStatus(user._id, ownerId);
        toast.success(
          isFollowing
            ? t("productDetail.unfollowed")
            : t("productDetail.followed")
        );
      } else {
        const errorMsg =
          result.message || t("productDetail.followUnfollowFailed");
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      alert(t("productDetail.anErrorOccurred"));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-10">
        {t("productDetail.loadingProduct")}
      </div>
    );
  if (!product)
    return (
      <div className="text-center text-red-500 mt-10">
        {t("productDetail.productNotFound")}
      </div>
    );

  const ownerRawName = product.owner?.name || product.name;
  const ownerName =
    typeof ownerRawName === "object"
      ? getLocalizedText(ownerRawName)
      : ownerRawName || t("productDetail.unknownSeller");
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const displayPostalCode =
    product.postalCode ||
    product.location?.postalCode ||
    t("home.unknownLocation");

  return (
    <>
      <div className="min-h-screen bg-white-100 pt-3">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
            {/* Left Ad (Desktop only) */}
            {sidebarAds.left.length > 0 && (
              <div className="hidden lg:block w-[160px] flex-shrink-0 self-stretch">
                <div className="sticky top-[180px] flex flex-col gap-3 z-30">
                  {sidebarAds.left.map((ad) =>
                    ad.link ? (
                      <a key={ad._id} href={ad.link} target={ad.linkTarget || "_blank"} rel="noopener noreferrer"
                        onClick={() => fetch(`${import.meta.env.VITE_SERVER}/api/ads/${ad._id}/click`, { method: "POST" })}>
                        <img src={`${import.meta.env.VITE_SERVER}${ad.image}`} alt={ad.title}
                          className="w-full h-[550px] object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
                          onLoad={() => fetch(`${import.meta.env.VITE_SERVER}/api/ads/${ad._id}/impression`, { method: "POST" })} />
                      </a>
                    ) : (
                      <img key={ad._id} src={`${import.meta.env.VITE_SERVER}${ad.image}`} alt={ad.title}
                        className="w-full h-[550px] object-cover rounded-xl shadow-md"
                        onLoad={() => fetch(`${import.meta.env.VITE_SERVER}/api/ads/${ad._id}/impression`, { method: "POST" })} />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-4 p-4">
                <div className="md:col-span-2 space-y-6">
                  {/* IMAGE CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="relative w-full h-[220px] sm:h-[300px] md:h-[350px] lg:h-[350px] bg-gray-50 flex justify-center items-center rounded-md overflow-hidden">
                      {product?.pictures?.length > 0 ? (
                        <>
                          <SafeImage
                            src={`${
                              import.meta.env.VITE_SERVER
                            }/${product.pictures[currentImageIndex].replace(
                              /\\/g,
                              "/"
                            )}`}
                            alt={`Product image ${currentImageIndex + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />

                          {product.pictures.length > 1 && (
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl transition"
                              aria-label="Previous Image"
                            >
                              &#10094;
                            </button>
                          )}

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
                        <SafeImage
                          src={`${
                            import.meta.env.VITE_SERVER
                          }/uploads/placeholder.jpg`}
                          alt="Placeholder"
                          className="max-h-full object-contain"
                        />
                      )}
                    </div>

                    {product.pictures?.length > 1 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto">
                        {product.pictures.map((pic, idx) => (
                          <SafeImage
                            key={idx}
                            src={`${import.meta.env.VITE_SERVER}/${pic.replace(
                              /\\/g,
                              "/"
                            )}`}
                            alt={`Thumbnail ${idx + 1}`}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                              idx === currentImageIndex
                                ? "border-green-600"
                                : "border-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ✅ SHOP BANNER - Show if product belongs to a shop */}
                  {product.shop && product.listingType === "shop" && (
                    <Link
                      to={`/shop/${product.shop.slug || product.shop._id}`}
                      className="block"
                    >
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Shop Logo */}
                            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center overflow-hidden border-2 border-white shadow">
                              {product.shop.logo ? (
                                <SafeImage
                                  src={`${import.meta.env.VITE_SERVER}${product.shop.logo}`}
                                  alt="Shop logo"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <StoreIcon className="text-white" />
                              )}
                            </div>

                            {/* Shop Info */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-800">
                                  {getLocalizedText(product.shop.shopName)}
                                </span>
                                {product.shop.isVerified && (
                                  <VerifiedIcon
                                    sx={{ color: "#1976d2", fontSize: 16 }}
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="text-green-600 font-medium">
                                  {t("productDetail.soldByShop") || "Sold by this shop"}
                                </span>
                                <span>•</span>
                                <span>{product.shop.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Visit Shop Arrow */}
                          <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                            <span>{t("productDetail.visitShop") || "Visit Shop"}</span>
                            <ChevronRightIcon fontSize="small" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* DETAILS CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {getLocalizedText(product.title) ||
                        t("productDetail.productTitlePlaceholder")}
                    </h1>
                    <p className="text-green-700 text-xl font-bold mb-3">
                      ₼{" "}
                      {product.price?.toLocaleString(
                        i18n.language === "az"
                          ? "az-AZ"
                          : i18n.language === "ru"
                          ? "ru-RU"
                          : "en-IN"
                      )}{" "}
                      <span className="text-sm">
                        {t("productDetail.negotiableAbbr")}
                      </span>
                    </p>

                    <div className="text-sm text-gray-600 flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <LocationOn fontSize="small" />
                        {displayPostalCode}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarToday fontSize="small" />
                        {new Date(product.createdAt).toLocaleDateString(
                          i18n.language === "az"
                            ? "az-AZ"
                            : i18n.language === "ru"
                            ? "ru-RU"
                            : "en-GB"
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <img
                          src={EyeIcon}
                          alt={t("productDetail.viewsAlt")}
                          className="w-5 h-5"
                        />
                        {product.views || 0}
                      </div>
                      {/* Show listing type badge */}
                      {product.listingType === "shop" && (
                        <div className="flex items-center gap-1 text-green-600">
                          <StoreIcon fontSize="small" />
                          <span className="text-xs font-medium">
                            {t("productDetail.shopListing") || "Shop Listing"}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-semibold text-sm cursor-pointer"
                      onClick={handleBuyNow}
                    >
                      {t("productDetail.buyNowButton")}
                    </button>
                  </div>

                  {/* EXTRA INFO + MAP */}
                  <div className="bg-white rounded-md shadow p-4 mt-6 relative">
                    {product.location?.coordinates &&
                      product.location.coordinates.length === 2 && (
                        <div className="bg-white rounded-md shadow p-4 mb-6">
                          <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Location
                          </h2>
                          <div className="w-full overflow-hidden rounded-md h-[220px] sm:h-[300px]">
                            <GoogleMapsLoader>
                              <GoogleMap
                                center={{
                                  lat: product.location.coordinates[1],
                                  lng: product.location.coordinates[0],
                                }}
                                zoom={13}
                                mapContainerStyle={{
                                  height: "100%",
                                  width: "100%",
                                }}
                                options={{
                                  scrollwheel: false,
                                  zoomControl: true,
                                  streetViewControl: false,
                                  mapTypeControl: false,
                                  fullscreenControl: false,
                                }}
                              >
                                <MarkerF
                                  position={{
                                    lat: product.location.coordinates[1],
                                    lng: product.location.coordinates[0],
                                  }}
                                  title={
                                    getLocalizedText(product.title) ||
                                    t("productDetail.productLocation")
                                  }
                                />
                              </GoogleMap>
                            </GoogleMapsLoader>
                          </div>
                        </div>
                      )}

                    {/* ✅ Available Units Badge */}
                    {product.quantity && product.quantity > 0 && (
                      <div className="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-2.5 rounded-lg">
                        <InventoryIcon className="text-green-600" fontSize="small" />
                        <div>
                          <span className="text-sm font-semibold text-gray-800">
                            {product.quantity} {product.quantity === 1 ? 'Unit' : 'Units'} Available
                          </span>
                          {product.quantity <= 5 && product.quantity > 1 && (
                            <span className="ml-2 text-xs text-orange-600 font-medium">
                              • Only {product.quantity} left in stock!
                            </span>
                          )}
                          {product.quantity === 1 && (
                            <span className="ml-2 text-xs text-red-600 font-medium">
                              • Last one available!
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Specs */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {t("productDetail.typeLabel")}
                        </div>
                        <div>
                          {product.type || t("productDetail.notAvailableAbbr")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {t("productDetail.brandLabel")}
                        </div>
                        <div>
                          {product.brand || t("productDetail.notAvailableAbbr")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {t("productDetail.sizeLabel")}
                        </div>
                        <div>
                          {product.size || t("productDetail.notAvailableAbbr")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {t("productDetail.colorLabel")}
                        </div>
                        <div>
                          {product.color || t("productDetail.notAvailableAbbr")}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {t("productDetail.conditionLabel")}
                        </div>
                        <div>
                          {product.condition ||
                            t("productDetail.notAvailableAbbr")}
                        </div>
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      {t("productDetail.descriptionSectionTitle")}
                    </h2>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {getLocalizedText(product.description) ||
                        t("productDetail.noDescriptionAvailable")}
                    </p>
                  </div>

                  {/* WRITE A MESSAGE */}
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
                        {getLocalizedText(user?.name) ||
                          t("productDetail.notAvailableAbbr")}
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
                      className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-semibold text-sm cursor-pointer"
                    >
                      {t("productDetail.sendMessageButton")}
                    </button>
                  </div>

                  {/* ============= CUSTOMER REVIEWS SECTION ============= */}
                  <div className="bg-white rounded-md shadow p-4 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Customer Reviews
                    </h2>

                    {reviewSummary && reviewSummary.totalReviews > 0 ? (
                      <>
                        {/* Average Rating Summary */}
                        <div className="flex items-center gap-6 mb-6 pb-6 border-b">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-gray-900 mb-1">
                              {reviewSummary.averageRating.toFixed(1)}
                            </div>
                            {renderStars(reviewSummary.averageRating, "text-xl")}
                            <p className="text-sm text-gray-600 mt-1">
                              {reviewSummary.totalReviews} reviews
                            </p>
                          </div>

                          {/* Rating Breakdown */}
                          <div className="flex-1 space-y-1">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = reviewSummary.ratingBreakdown?.[star] || 0;
                              const percentage =
                                reviewSummary.totalReviews > 0
                                  ? (count / reviewSummary.totalReviews) * 100
                                  : 0;

                              return (
                                <div
                                  key={star}
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                                  onClick={() => {
                                    setFilterRating(
                                      filterRating === star ? null : star
                                    );
                                    setCurrentPage(1);
                                  }}
                                >
                                  <span className="text-gray-700 w-8">
                                    {star} ★
                                  </span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-yellow-500 h-full rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-600 w-8 text-right">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <button
                            onClick={() => {
                              setFilterRating(null);
                              setCurrentPage(1);
                            }}
                            className={`px-3 py-1 rounded-full text-sm ${
                              filterRating === null
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            All
                          </button>
                          {[5, 4, 3, 2, 1].map((star) => (
                            <button
                              key={star}
                              onClick={() => {
                                setFilterRating(star);
                                setCurrentPage(1);
                              }}
                              className={`px-3 py-1 rounded-full text-sm ${
                                filterRating === star
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {star} ★
                            </button>
                          ))}

                          <select
                            value={sortBy}
                            onChange={(e) => {
                              setSortBy(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="ml-auto px-3 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="recent">Most Recent</option>
                            <option value="helpful">Most Helpful</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                          </select>
                        </div>

                        {/* Reviews List */}
                        {reviewsLoading ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-green-600"></div>
                          </div>
                        ) : reviews.length > 0 ? (
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <div
                                key={review._id}
                                className="border-b pb-4 last:border-0"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <div className="bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {review.buyerName?.charAt(0).toUpperCase() ||
                                      "U"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="font-semibold text-gray-900">
                                        {review.buyerName || "Anonymous"}
                                      </h4>
                                      {review.verified && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                          ✓ Verified
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      {renderStars(review.rating, "text-sm")}
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          review.createdAt
                                        ).toLocaleDateString(
                                          i18n.language === "az"
                                            ? "az-AZ"
                                            : i18n.language === "ru"
                                            ? "ru-RU"
                                            : "en-GB"
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 text-sm mb-2">
                                      {review.reviewText}
                                    </p>

                                    {review.sellerResponse && (
                                      <div className="bg-gray-50 rounded p-3 mb-2 border-l-2 border-green-600">
                                        <p className="text-xs font-semibold text-gray-900 mb-1">
                                          Seller Response:
                                        </p>
                                        <p className="text-xs text-gray-700">
                                          {review.sellerResponse.responseText}
                                        </p>
                                      </div>
                                    )}

                                    <button
                                      onClick={() =>
                                        handleMarkHelpful(review._id)
                                      }
                                      className="text-xs text-gray-600 hover:text-green-600"
                                    >
                                      👍 Helpful ({review.helpfulCount || 0})
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                              <div className="flex justify-center gap-2 mt-4">
                                <button
                                  onClick={() =>
                                    setCurrentPage((prev) => Math.max(1, prev - 1))
                                  }
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                >
                                  Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                  Page {currentPage} of {totalPages}
                                </span>
                                <button
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(totalPages, prev + 1)
                                    )
                                  }
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-4">
                            No reviews match your filter.
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">
                          No reviews yet for this product.
                        </p>
                        <p className="text-sm text-gray-400">
                          Be the first to review!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-1">
                  <div className="sticky top-[170px] w-full sm:max-w-[280px] mx-auto space-y-4">
                    <div className="bg-white rounded-md shadow p-4 border border-gray-200 space-y-3">
                      <button
                        onClick={handleSendMessage}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-full text-sm cursor-pointer"
                      >
                        Write a message
                      </button>

                      <button
                        onClick={handleAddToWatchlist}
                        className={`w-full text-sm font-medium py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer 
          ${
            isWishlisted
              ? "bg-green-600 text-white hover:bg-green-700"
              : "border border-gray-400 text-gray-700 hover:bg-gray-100"
          }`}
                      >
                        {isWishlisted
                          ? t("productDetail.removeFromWatchlistButton")
                          : t("productDetail.addToWatchlistButton")}
                      </button>

                      <button
                        onClick={() => setShowShareModal(true)}
                        className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {t("productDetail.shareAdButton")}
                      </button>

                      {/* ✅ SHOP INFO IN SIDEBAR - Show if product is from shop */}
                      {product.shop && product.listingType === "shop" ? (
                        <Link
                          to={`/shop/${product.shop.slug || product.shop._id}`}
                          className="block"
                        >
                          <div className="bg-green-50 rounded-lg p-3 hover:bg-green-100 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center overflow-hidden">
                                {product.shop.logo ? (
                                  <SafeImage
                                    src={`${import.meta.env.VITE_SERVER}${product.shop.logo}`}
                                    alt="Shop"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <StoreIcon className="text-white text-lg" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="font-semibold text-sm text-gray-900 truncate">
                                    {getLocalizedText(product.shop.shopName)}
                                  </p>
                                  {product.shop.isVerified && (
                                    <VerifiedIcon
                                      sx={{ color: "#1976d2", fontSize: 14 }}
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-green-600">
                                  {t("productDetail.viewShopProducts") || "View all shop products"}
                                </p>
                              </div>
                              <ChevronRightIcon className="text-gray-400" fontSize="small" />
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <>
                          {/* Individual seller info */}
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center text-white text-sm font-bold">
                              {ownerInitial}
                            </div>
                            <p className="font-semibold text-sm text-gray-900">
                              {ownerName}
                            </p>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1 pl-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                                👤
                              </span>
                              <p>{t("productDetail.privateUser")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                                📅
                              </span>
                              <p>
                                {t("productDetail.activeSince")}{" "}
                                {new Date(product.createdAt).toLocaleDateString(
                                  i18n.language === "az"
                                    ? "az-AZ"
                                    : i18n.language === "ru"
                                    ? "ru-RU"
                                    : "en-GB"
                                )}
                              </p>
                            </div>
                          </div>

                          {user?._id !== ownerId && (
                            <button
                              onClick={handleFollowToggle}
                              disabled={followLoading}
                              className={`w-full border text-sm font-medium cursor-pointer py-2 rounded-full flex justify-center items-center gap-2 
                ${
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
                        </>
                      )}
                    </div>

                    {/* Ad ID Section */}
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {t("productDetail.adIdLabel")}:
                        </span>
                        <span className="text-gray-900">{product._id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="max-w-6xl mx-auto mt-8 px-4">
                  <h2 className="text-xl font-semibold mb-6">
                    {t("productDetail.mightAlsoInterestYouTitle")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {relatedProducts.map((item) => (
                      <div
                        key={item._id}
                        onClick={() =>
                          navigate(`/products/product/${item._id}`)
                        }
                        className="flex gap-4 bg-white shadow p-4 rounded-md hover:bg-gray-50 cursor-pointer transition"
                      >
                        <SafeImage
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
                              📍{" "}
                              {item.postalCode ||
                                item.location?.postalCode ||
                                t("home.unknownLocation")}{" "}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString(
                                i18n.language === "az"
                                  ? "az-AZ"
                                  : i18n.language === "ru"
                                  ? "ru-RU"
                                  : "en-GB"
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
                            <span>
                              {item.price?.toLocaleString(
                                i18n.language === "az"
                                  ? "az-AZ"
                                  : i18n.language === "ru"
                                  ? "ru-RU"
                                  : "en-IN"
                              )}
                              ₼{" "}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showShareModal && (
                <ShareModal
                  onClose={() => setShowShareModal(false)}
                  product={product}
                />
              )}
            </div>

            {/* Right Ad (Desktop only) */}
            {sidebarAds.right.length > 0 && (
              <div className="hidden lg:block w-[160px] flex-shrink-0 self-stretch">
                <div className="sticky top-[180px] flex flex-col gap-3 z-30">
                  {sidebarAds.right.map((ad) =>
                    ad.link ? (
                      <a key={ad._id} href={ad.link} target={ad.linkTarget || "_blank"} rel="noopener noreferrer"
                        onClick={() => fetch(`${import.meta.env.VITE_SERVER}/api/ads/${ad._id}/click`, { method: "POST" })}>
                        <img src={`${import.meta.env.VITE_SERVER}${ad.image}`} alt={ad.title}
                          className="w-full h-[550px] object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow"
                          onLoad={() => fetch(`${import.meta.env.VITE_SERVER}/api/ads/${ad._id}/impression`, { method: "POST" })} />
                      </a>
                    ) : (
                      <img key={ad._id} src={`${import.meta.env.VITE_SERVER}${ad.image}`} alt={ad.title}
                        className="w-full h-[550px] object-cover rounded-xl shadow-md"
                        onLoad={() => fetch(`${import.meta.env.VITE_SERVER}/api/ads/${ad._id}/impression`, { method: "POST" })} />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;