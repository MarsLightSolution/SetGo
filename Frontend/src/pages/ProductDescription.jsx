"use client";

import { useEffect, useState } from "react";
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



const ProductDetail = () => {
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

const handleAddToWatchlist = (e) => {
  e.stopPropagation();

  if (!token) {
    alert("Please login to add to watchlist.");
    return;
  }

  if (isWishlisted) {
    dispatch(unlike(product));
    toast.info("Removed from your watchlist");
  } else {
    dispatch(like(product));
    toast.success("Added to your watchlist");
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
  }, [id]);

  const fetchProductById = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/products/product/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
        }
      );
      const result = await res.json();
      setProduct(result.data);
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (category) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/products/category/${category}`
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
  }, [product]);

  const handleBuyNow = async () => {
    const userId = user?._id;
    const ownerId = product?.user?._id || product?.owner;
    if (!userId || !ownerId) {
      alert("User or owner not loaded yet.");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8080/users/get-users/${userId}`
      );
      const json = await res.json();
      if (json?.data) {
        setDialogUser(json.data);
        setShowPaymentDialog(true);
      } else {
        alert("Failed to load user data.");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert("Error loading user data.");
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      alert("Please login to send messages.");
      return;
    }
    if (!product?.user?.username && !product?.owner) {
      alert("Product owner information not available.");
      return;
    }

    const ownerUsername = product.user?.username || product.owner;
    navigate("/chat");

    setTimeout(() => {
      if (window.startChatConversation) {
        const productInfo = {
          title: product.title,
          price: product.price,
          id: product._id,
        };
        window.startChatConversation(ownerUsername, productInfo);
      }
    }, 1000);
  };

  const ownerId = product?.user?._id || product?.owner || null;

  useEffect(() => {
    if (user && ownerId) {
      checkFollowStatus(user._id, ownerId);
    }
  }, [user, ownerId]);

  const checkFollowStatus = async (followerId, followingId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/check/${followerId}/${followingId}`
      );
      const data = await res.json();
      setIsFollowing(data?.isFollowing);
    } catch (err) {
      console.error("Error checking follow status", err);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !ownerId) return;
    setFollowLoading(true);

    try {
      const endpoint = isFollowing
        ? `http://localhost:8080/unfollow/${ownerId}`
        : `http://localhost:8080/follow/${ownerId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ followerId: user._id }),
      });

      const result = await res.json();

      if (res.ok && result.success !== false) {
        await checkFollowStatus(user._id, ownerId);
      } else {
        alert("Follow/unfollow failed. Try again.");
      }
    } catch (err) {
      console.error("Follow/Unfollow error:", err);
      alert("An error occurred.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-10">Loading…</div>;
  if (!product)
    return (
      <div className="text-center text-red-500 mt-10">Product not found</div>
    );

  const ownerName = product.user?.name || product.name || "Unknown Seller";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <>
      <div className="min-h-screen bg-white-100 pt-3">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-screen-xl px-4 flex flex-wrap gap-4 items-start">
            <div className="hidden lg:block w-[160px] sticky top-[90px] h-fit z-30">
              <img
                src={leftadImage}
                alt="Left Ad"
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
                        alt={product.title}
                        className="max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* DETAILS CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {product.title || "Product Title"}
                    </h1>
                    <p className="text-green-700 text-xl font-bold mb-3">
                      {product.price?.toLocaleString("en-IN")}€{" "}
                      <span className="text-sm">VB</span>
                    </p>

                    <div className="text-sm text-gray-600 flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <LocationOn fontSize="small" />
                        {product.location?.postalCode || "Unknown"} –{" "}
                        {product.location?.city || "Unknown"}
                      </div>

                      <div className="flex items-center gap-1">
                        <CalendarToday fontSize="small" />
                        {new Date(product.createdAt).toLocaleDateString(
                          "en-GB"
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <img src={EyeIcon} alt="Views" className="w-5 h-5" />
                        {product.views || 0}
                      </div>
                    </div>
                    {/* 
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {product.description || "Keine Beschreibung verfügbar."}
                    </div> */}

                    {/* Make button smaller (not full-width) */}
                    <button
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-semibold text-sm"
                      onClick={handleBuyNow}
                    >
                      Buy Now
                    </button>
                  </div>

                  {/* EXTRA INFO CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4 mt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                      <div>
                        <div className="font-semibold text-gray-800">Type</div>
                        <div>{product.type || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Brand</div>
                        <div>{product.brand || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Size</div>
                        <div>{product.size || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Color</div>
                        <div>{product.color || "NA"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          Condition
                        </div>
                        <div>{product.condition || "NA"}</div>
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      Description
                    </h2>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {product.description || "Keine Beschreibung verfügbar."}
                    </p>
                  </div>

                  {/* WRITE A MESSAGE CONTAINER */}
                  <div className="bg-white rounded-md shadow p-4 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Write a message
                    </h2>

                    <div className="mb-4">
                      <label className="block font-medium text-gray-700 mb-1">
                        News
                      </label>
                      <textarea
                        className="w-full border rounded-md p-2 text-sm text-gray-800"
                        placeholder="Write a friendly message to the seller and get more attention!"
                        rows={4}
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <label className="block font-medium text-gray-700 mb-1">
                        Profile name
                      </label>
                      <div className="w-full border rounded-md p-2 bg-gray-100 text-sm text-gray-800">
                        {user?.name || "NA"}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">
                      Your data will be transmitted to the provider and
                      automatically pre-filled for future requests.{" "}
                      <a href="#" className="text-green-700 underline">
                        More information
                      </a>
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      We review messages for violations of our{" "}
                      <a href="#" className="text-green-700 underline">
                        Terms of Use
                      </a>
                      . For more information, see our{" "}
                      <a href="#" className="text-green-700 underline">
                        Privacy Policy
                      </a>
                      .
                    </p>

                    <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-full font-semibold text-sm cursor-pointer">
                      Send Message
                    </button>
                  </div>
                </div>

                <div>
                  {/* Main Sidebar Section */}
                  <div className="bg-white rounded-xl shadow-md p-5 h-fit border border-gray-200 space-y-4">
                    {/* Green Rounded "Make an offer" */}
                    <button
                      onClick={handleSendMessage}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      Write a message
                    </button>

                    {/* Outlined Buttons */}
                  <button
  onClick={handleAddToWatchlist}
  className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
>
  {isWishlisted ? "Remove from watchlist" : "Add to watchlist"}
</button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full border border-gray-400 text-sm font-medium text-gray-700 hover:bg-gray-100 py-2 rounded-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Share ad
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
                          alt="User Icon"
                          className="w-5 h-5"
                        />
                        <p>Private user</p>
                      </div>

                      {/* Active since row */}
                      <div className="flex items-center gap-2">
                        <img
                          src={SaveIcon}
                          alt="Active since icon"
                          className="w-5 h-5"
                        />
                        <p>
                          Active since{" "}
                          {new Date(product.createdAt).toLocaleDateString(
                            "en-GB"
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
                          ? "Loading..."
                          : isFollowing
                          ? "🚫 Unfollow"
                          : "➕ Follow"}
                      </button>
                    )}
                  </div>

                  {/* Ad ID Section Below */}
                  <div className="bg-white rounded-xl shadow-md p-4 mt-4 border border-gray-200 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Ad ID:</span>
                      <span className="text-gray-900">{product._id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {relatedProducts.length > 0 && (
                <div className="max-w-6xl mx-auto mt-8 px-4">
                  <h2 className="text-xl font-semibold mb-6">
                    This might also interest you
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    {relatedProducts.map((item) => (
                      <div
                        key={item._id}
                        onClick={() =>
                          (window.location.href = `/products/product/${item._id}`)
                        }
                        className="flex gap-4 bg-white shadow p-4 rounded-md hover:bg-gray-50 cursor-pointer transition"
                      >
                        <img
                          src={`http://localhost:8080/${
                            item.pictures?.[0]?.replace(/\\/g, "/") ||
                            "uploads/placeholder.jpg"
                          }`}
                          alt={item.title}
                          className="w-32 h-24 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 flex items-center justify-between">
                            <span>
                              📍 {item.location?.postalCode || "Unknown"}{" "}
                              {item.location?.city || ""}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString(
                                "en-GB"
                              )}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-800 mt-1 mb-1 line-clamp-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {item.description}
                          </p>
                          <div className="flex gap-4 text-sm font-semibold text-green-700">
                            <span>{item.price?.toLocaleString("en-IN")}€</span>
                            {/* <span className="text-gray-500">
                              {item.area || "—"} m²
                            </span>
                            <span className="text-gray-500">
                              {item.rooms || "—"} rooms
                            </span> */}
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
                alt="Right Ad"
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
            console.log("Payment success");
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
