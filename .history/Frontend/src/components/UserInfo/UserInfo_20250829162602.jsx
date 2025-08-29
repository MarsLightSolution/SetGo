  "use client"
  import { useEffect, useState, useRef } from "react"
  import { useNavigate } from "react-router-dom"
  import axios from "axios" // axios is correctly imported and used
  import bannerImage from "../../assets/images/banner1.png"
  import nodataImage from "../../assets/images/nodata.png"
  import Footer from "../common/Footer"
  import { FaEdit, FaEye, FaPause, FaRocket, FaTrash, FaPlay } from "react-icons/fa" // Added FaPlay import for paused state
  import { toast, ToastContainer } from "react-toastify"
  import "react-toastify/dist/ReactToastify.css"
  import PaymentDialogboast from "../../pages/PaymentDialogboast"
  // i18n import
  import { useTranslation } from "react-i18next"

  // Custom confirmation modal component
  const ConfirmDialog = ({ onConfirm, onCancel, action = "pause", adIsSellStatus = false }) => {
    const { t } = useTranslation()
    const isBoost = action === "boost"
    const isPause = action === "pause"
    const isDelete = action === "delete"

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
        <div className="bg-white rounded-xl p-6 shadow-2xl w-[350px] text-center border border-gray-200">
          <h2 className="text-lg font-bold mb-3">
            {isBoost
              ? "Confirm Boost Ad"
              : isPause
                ? adIsSellStatus
                  ? "Resume Listing"
                  : "Pause Listing"
                : "Confirm Delete Ad"}
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            {isBoost
              ? "Are you sure you want to boost this ad? This will increase its visibility."
              : isPause
                ? adIsSellStatus
                  ? "Do you want to resume listing? This will make your ad visible again."
                  : "Are you sure you want to pause this listing? It will be hidden from listings."
                : "Are you sure you want to delete this ad? This action cannot be undone."}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 border border-gray-400 text-gray-700 rounded hover:bg-gray-100 text-sm"
            >
              {t("userInfo.cancelButton")}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-1.5 text-white rounded text-sm ${
                isBoost
                  ? "bg-blue-600 hover:bg-blue-700"
                  : isPause
                    ? adIsSellStatus
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isBoost ? "Yes, Boost" : isPause ? (adIsSellStatus ? "Yes, Resume" : "Yes, Pause") : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getLocalizedText = (field, currentLanguage) => {
    if (!field) return ""
    if (typeof field === "string") return field
    return field[currentLanguage] || field.en || ""
  }

  const UserIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )

  const ClockIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )

  const CheckIcon = () => (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )

  export default function UserInfo() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [ads, setAds] = useState([])
    const [expandedAdId, setExpandedAdId] = useState(null)
    const [confirmAdId, setConfirmAdId] = useState(null)
    const [confirmAction, setConfirmAction] = useState("pause")
    const userId = localStorage.getItem("userId")
    const accessToken = localStorage.getItem("accessToken")
    const sliderRef = useRef(null)
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [dialogProduct, setDialogProduct] = useState(null);
    const [dialogUser, setDialogUser] = useState(null);
    const [ownerId, setOwnerId] = useState(null);
    const [productOwnerId, setProductOwnerId] = useState(null);
    const scrollSlider = (direction) => {
      if (!sliderRef.current) return
      const amount = direction === "left" ? -300 : 300
      sliderRef.current.scrollBy({ left: amount, behavior: "smooth" })
    }

    useEffect(() => {
      const fetchUserAds = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_SERVER}/api/products/user/${userId}/ads`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          })

          if (response.data && Array.isArray(response.data.data)) {
            setAds(response.data.data)
          } else {
            setAds([])
          }
        } catch (err) {
          setAds([])
          if (err.response && err.response.status === 401) {
            toast.error("You are not authorized. Please log in again.")
            navigate("/login")
          } else {
            toast.error("Failed to load your products.")
          }
        }
      }

      if (userId && accessToken) {
        fetchUserAds()
      } else {
        console.log("DEBUG: Conditions NOT met for fetching ads.")
        if (!userId) console.log("DEBUG: Reason: userId is null or undefined.")
        if (!accessToken) console.log("DEBUG: Reason: Access token is missing from localStorage.")
        setAds([])
      }
    }, [userId, accessToken, navigate])

    const pauseAd = async (id) => {
      try {
        const currentAd = ads.find((ad) => ad._id === id)
        const wasPaused = currentAd?.isSell === true

        await axios.patch(
          `${import.meta.env.VITE_SERVER}/api/products/mark-sold/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          },
        )

        setAds((prev) => prev.map((ad) => (ad._id === id ? { ...ad, isSell: !ad.isSell } : ad)))

        toast.success(wasPaused ? "Listing resumed!" : "Listing paused!")
      } catch (err) {
        console.error("ERROR: Failed to toggle product status:", err.response ? err.response.data : err.message)
        toast.error("Failed to update ad status. Please try again.")
        if (err.response && err.response.status === 401) {
          navigate("/login")
        }
      } finally {
        setConfirmAdId(null)
      }
    }

    const boostAd = async (id) => {
      try {
        await axios.put(
          `${import.meta.env.VITE_SERVER}/api/products/priority/${id}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          },
        )
        setAds((prev) =>
          prev.map((ad) =>
            ad._id === id ? { ...ad, priority: true, boostExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } : ad,
          ),
        )
        toast.success("Ad boosted successfully! Priority increased for better visibility.")
      } catch (err) {
        console.error("ERROR: Failed to boost product:", err.response ? err.response.data : err.message)
        toast.error("Failed to boost ad. Please try again.")
        if (err.response && err.response.status === 401) {
          navigate("/login")
        }
      } finally {
        setConfirmAdId(null)
      }
    }
        const handleBoost = (ad) => {
        setDialogProduct(ad);
        setDialogUser({
          _id: localStorage.getItem("userId"),
          walletBalance: 100, // you can fetch real wallet balance
          fullName: localStorage.getItem("userName"),
          email: localStorage.getItem("userEmail"),
          city: localStorage.getItem("userCity"),
          address: localStorage.getItem("userAddress"),
          postalCode: localStorage.getItem("userPostalCode"),
        });
        setOwnerId(ad.ownerId); // backend seller/receiver
        setProductOwnerId(ad.ownerId);
        setShowPaymentDialog(true);
      };

    const deleteAd = async (id) => {
      try {
        await axios.delete(`${import.meta.env.VITE_SERVER}/api/products/product/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        })
        setAds((prev) => prev.filter((ad) => ad._id !== id))
        toast.success("Ad deleted successfully!")
      } catch (err) {
        console.error("ERROR: Failed to delete product:", err.response ? err.response.data : err.message)
        toast.error("Failed to delete ad. Please try again.")
        if (err.response && err.response.status === 401) {
          navigate("/login")
        }
      } finally {
        setConfirmAdId(null)
      }
    }

    const handleEdit = (id) => {
      navigate(`/editform/${id}`)
    }

    const handlePause = (id) => {
      setConfirmAction("pause")
      setConfirmAdId(id)
    }
    const handleDelete = (id) => {
      setConfirmAction("delete")
      setConfirmAdId(id)
    }

    const handlePreview = (id) => {
      navigate(`/product/${id}`)
    }

    const toggleExpand = (id) => {
      setExpandedAdId(expandedAdId === id ? null : id)
    }

    const formatUserSinceDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString(i18n.language === "az" ? "az-AZ" : i18n.language === "ru" ? "ru-RU" : "en-GB", {
        year: "numeric",
        month: "long",
      })
    }

    return (
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <ToastContainer />
        {confirmAdId && (
          <ConfirmDialog
            onConfirm={() =>
              confirmAction === "boost"
                ? boostAd(confirmAdId)
                : confirmAction === "pause"
                  ? pauseAd(confirmAdId)
                  : deleteAd(confirmAdId)
            }
            onCancel={() => setConfirmAdId(null)}
            action={confirmAction}
            adIsSellStatus={ads.find((ad) => ad._id === confirmAdId)?.isSell || false} // Pass the isSell status to dialog
          />
        )}

        {/* Banner section */}
        <section className="py-6">
          <div className="max-w-4xl mx-auto px-4 relative">
            <img
              src={bannerImage || "/placeholder.svg"}
              alt={t("userInfo.userBannerAlt")}
              className="w-full h-[233px] object-cover rounded-xl shadow"
            />
            <div className="absolute bottom-6 left-10">
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg">
                {t("userInfo.joinNowButton")}
              </button>
            </div>
          </div>
        </section>

        {/* Profile Section */}
        <section className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600">
                {localStorage.getItem("userName")?.charAt(0).toUpperCase() || "N"}
                {localStorage.getItem("userName")?.charAt(1).toUpperCase() || "A"}
              </div>
              <div>
                <h2 className="text-xl font-bold">{localStorage.getItem("userName") || t("userInfo.unknownUser")}</h2>
                <p className="text-sm text-gray-500">{t("userInfo.adsAvailable", { count: ads.length })}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <UserIcon />
                <span>{t("userInfo.privateUser")}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon />
                <span>
                  {t("userInfo.activeSince")} {formatUserSinceDate(localStorage.getItem("userCreatedAt") || new Date())}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckIcon />
                <span>{t("userInfo.verifiedProfile")}</span>
              </div>
            </div>
          </div>
        </section>
        {ads.length === 0 ? (
          <section className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-white rounded-xl shadow p-5 text-center">
              <div className="mb-4">
                <img src={nodataImage || "/placeholder.svg"} alt={t("userInfo.noDataAlt")} className="mx-auto" />
              </div>
              <h4 className="text-lg font-semibold mb-1">{t("userInfo.treasureInBasementTitle")}</h4>
              <p className="text-gray-600 mb-1">{t("userInfo.manageAdsHere")}</p>
              <p className="text-gray-600 mb-4">{t("userInfo.startAdvertisingEasily")}</p>
              <button
                onClick={() => navigate("/form")}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow cursor-pointer"
              >
                {t("userInfo.placeAnAdButton")}
              </button>
            </div>
          </section>
        ) : (
          <section className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t("userInfo.myPublishedAdsTitle")}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollSlider("left")}
                    className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    title={t("home.scrollLeft")}
                  >
                    &#8592;
                  </button>
                  <button
                    onClick={() => scrollSlider("right")}
                    className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    title={t("home.scrollRight")}
                  >
                    &#8594;
                  </button>
                </div>
              </div>

              <div ref={sliderRef} className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar">
                {ads.map((ad) => {
                  const displayTitle = getLocalizedText(ad.title, i18n.language) || t("wishlist.untitledProduct")
                  const displayDescription =
                    getLocalizedText(ad.description, i18n.language) || t("wishlist.noDescription")

                  return (
                    <div
                      key={ad._id}
                      className="min-w-[260px] max-w-[260px] h-[320px] border border-gray-200 rounded-lg bg-white shadow-md hover:shadow-xl hover:scale-105 hover:z-10 transition duration-300 ease-in flex-shrink-0 flex flex-col overflow-hidden cursor-pointer"
                      onClick={() => handlePreview(ad._id)} // Added click handler to entire card for preview redirect
                    >
                      {/* Image */}
                      <div className="h-44 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {ad.pictures?.[0] ? (
                          <img
                            src={`${import.meta.env.VITE_SERVER}/${
                              ad.pictures?.[0]?.replace(/\\/g, "/") || "uploads/placeholder.jpg"
                            }`}
                            alt={displayTitle}
                            className="h-full w-full object-cover rounded-t-lg" // Removed click handler and hover effects from image
                          />
                        ) : (
                          t("userInfo.noImageAvailable")
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col justify-between flex-grow p-4">
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">{displayTitle}</h3>
                          <p className="text-sm text-gray-500 break-words">
                            {displayDescription.length > 80
                              ? expandedAdId === ad._id
                                ? displayDescription
                                : `${displayDescription.slice(0, 80)}...`
                              : displayDescription}
                            {displayDescription.length > 80 && (
                              <span
                                onClick={(e) => {
                                  // Added event.stopPropagation to prevent card click
                                  e.stopPropagation()
                                  toggleExpand(ad._id)
                                }}
                                className="text-blue-600 cursor-pointer ml-1 hover:underline"
                              >
                                {expandedAdId === ad._id ? t("userInfo.showLess") : t("userInfo.showMore")}
                              </span>
                            )}
                          </p>
                          <p className="text-green-700 font-semibold text-base mt-1">{ad.price} ₼</p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 mt-4 justify-center">
                          <button
                            onClick={(e) => {
                              // Added event.stopPropagation to all buttons to prevent card click
                              e.stopPropagation()
                              handleEdit(ad._id)
                            }}
                            className="text-green-600 bg-white border hover:bg-green-600 hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition"
                            title={t("userInfo.editAdTitle")}
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePause(ad._id)
                            }}
                            className={`${ad.isSell ? "text-green-600 hover:bg-green-600" : "text-yellow-600 hover:bg-yellow-600"} bg-white border hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition`}
                            title={ad.isSell ? "Resume Listing" : "Pause Listing"}
                          >
                            {ad.isSell ? <FaPlay className="w-4 h-4" /> : <FaPause className="w-4 h-4" />}
                          </button>
                          <button
                              onClick={(e) => {
                                handleBoost(ad); // pass full ad object
                              }}
                              disabled={ad.priority === true}
                              className={`${
                                ad.priority === true
                                  ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                                  : "text-blue-600 bg-white border hover:bg-blue-600 hover:text-white"
                              } px-3 py-1.5 text-sm rounded-md shadow-sm transition`}
                              title={ad.priority === true ? "Already Boosted" : "Boost Ad"}
                            >
                              <FaRocket className="w-4 h-4" />
                            </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(ad._id)
                            }}
                            className="text-red-600 bg-white border hover:bg-red-600 hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition"
                            title="Delete Ad"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePreview(ad._id)
                            }}
                            className="text-gray-600 bg-white border hover:bg-gray-600 hover:text-white px-3 py-1.5 text-sm rounded-md shadow-sm transition"
                            title={t("userInfo.previewAdTitle")}
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
          
        )
        }
          {showPaymentDialog && dialogUser && dialogProduct && (
            <PaymentDialogboast
              onClose={() => setShowPaymentDialog(false)}
              product={dialogProduct}
              user={dialogUser}
              owner={ownerId}
              productOwner={productOwnerId}
              onPaymentSuccess={async () => {
                console.log("✅ Payment success, now boosting ad...");
                await boostAd(dialogProduct._id); // call boost API only after payment
                setShowPaymentDialog(false);
              }}
            />
          )}
        <Footer />
      </div>
    )
  }
 