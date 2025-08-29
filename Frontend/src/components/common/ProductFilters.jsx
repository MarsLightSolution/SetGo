import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Slider from "rc-slider";
import {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
  setSearchQuery,
  setLocation,
  resetFilters,
} from "../../slices/FilterSlice";
import "rc-slider/assets/index.css";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

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

// Create a custom red icon for the user's location
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported."));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

const ProductFilters = ({ isOpen, onClose, onApply }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { filter, products } = useSelector((state) => state);
  const { latestAds = [] } = products || {};
  const { priceRange, condition, radius, city, searchQuery, location } = filter;
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [localCondition, setLocalCondition] = useState(condition);
  const [localRadius, setLocalRadius] = useState(radius);
  const [localCity, setLocalCity] = useState(city);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isApplying, setIsApplying] = useState(false);
  const [mapCenter, setMapCenter] = useState(
    location.latitude ? [location.latitude, location.longitude] : null
  );

  useEffect(() => {
    setLocalPriceRange(priceRange);
    setLocalCondition(condition);
    setLocalRadius(radius);
    setLocalCity(city);
    setLocalSearchQuery(searchQuery);

    if (isOpen && !location.latitude) {
      getCurrentLocation()
        .then((position) => {
          const newLocation = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setMapCenter(newLocation);
          dispatch(
            setLocation({ latitude: newLocation[0], longitude: newLocation[1] })
          );
        })
        .catch((error) => {
          console.error("Location error:", error);
          setMapCenter([50.9375, 6.9603]);
          alert(t("navbar.unableToFetchLocation"));
        });
    }
  }, [
    isOpen,
    priceRange,
    condition,
    radius,
    city,
    searchQuery,
    location,
    t,
    dispatch,
  ]);

  const handleApplyFilters = async () => {
    setIsApplying(true);

    try {
      if (localRadius > 0 && !location.latitude) {
        try {
          const position = await getCurrentLocation();
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          dispatch(setLocation(newLocation));
        } catch (error) {
          alert(t("navbar.unableToFetchLocation"));
          console.error(error);
          setIsApplying(false);
          return;
        }
      }
      dispatch(setPriceRange(localPriceRange));
      dispatch(setCondition(localCondition));
      dispatch(setRadius(localRadius));
      dispatch(setCity(localCity));
      dispatch(setSearchQuery(localSearchQuery));

      if (onApply) onApply();
      if (onClose) onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setLocalPriceRange([0, 10000]);
    setLocalCondition("");
    setLocalRadius(0);
    setLocalCity("");
    setLocalSearchQuery("");
    setMapCenter(null);
  };

  if (!isOpen) return null;

  const getLocalizedTitle = (product) => {
    if (typeof product.title === "object" && product.title !== null) {
      return product.title[i18n.language] || product.title.en || "Untitled";
    }
    return product.title || "Untitled";
  };

  return (
<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
  <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 relative">
    {/* Header */}
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">{t("navbar.filterListings")}</h2>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 text-xl cursor-pointer"
      >
        ×
      </button>
    </div>

    {/* Search */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{t("navbar.search")}</label>
      <input
        type="text"
        value={localSearchQuery}
        onChange={(e) => setLocalSearchQuery(e.target.value)}
        placeholder={t("navbar.searchPlaceholder")}
        className="w-full border rounded px-3 py-2 text-sm"
      />
    </div>

    {/* Price Range */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        {t("navbar.priceRange")}: ₼ {localPriceRange[0]} – ₼ {localPriceRange[1]}
      </label>
      <Slider
        range
        min={0}
        max={10000}
        step={100}
        value={localPriceRange}
        onChange={setLocalPriceRange}
        trackStyle={[{ backgroundColor: "#84cc16" }]}
        handleStyle={[{ borderColor: "#84cc16" }, { borderColor: "#84cc16" }]}
      />
    </div>

    {/* Condition */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{t("navbar.condition")}</label>
      <select
        value={localCondition}
        onChange={(e) => setLocalCondition(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm cursor-pointer"
      >
        <option value="">{t("navbar.select")}</option>
        <option value="New">{t("navbar.conditionNew")}</option>
        <option value="Like New">{t("navbar.conditionLikeNew")}</option>
        <option value="Used">{t("navbar.conditionUsed")}</option>
        <option value="Defective / Needs Repair">{t("navbar.conditionDefective")}</option>
      </select>
    </div>

    {/* Radius */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{t("navbar.radius")}: {localRadius} km</label>
      {mapCenter && (
        <div className="h-48 rounded-md overflow-hidden shadow-sm border border-gray-300 mb-2">
          <MapContainer
            center={mapCenter}
            zoom={localRadius > 0 ? 12 - Math.min(Math.floor(localRadius / 50), 6) : 9}
            scrollWheelZoom={false}
            className="w-full h-full"
            key={JSON.stringify(mapCenter)}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={mapCenter} radius={localRadius * 1000} pathOptions={{ color: 'lime', fillOpacity: 0.2 }} />
            <Marker position={mapCenter} icon={redIcon}>
              <Popup>{t("navbar.yourLocation")}</Popup>
            </Marker>
            {latestAds.map(product => product.location?.coordinates && (
              <Marker key={product._id} position={[product.location.coordinates[1], product.location.coordinates[0]]}>
                <Popup>
                  <div>
                    <b>{getLocalizedTitle(product)}</b><br/>
                    <span>₼ {product.price}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      <input
        type="range"
        min="0"
        max="400"
        step="1"
        value={localRadius}
        onChange={(e) => setLocalRadius(Number(e.target.value))}
        className="w-full accent-lime-500 cursor-pointer"
      />
    </div>

    {/* City */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{t("navbar.city")}</label>
      <select
        value={localCity}
        onChange={(e) => setLocalCity(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm cursor-pointer"
      >
        <option value="">{t("navbar.selectCity")}</option>
        <option value="baku">{t("navbar.cityBaku")}</option>
        <option value="ganja">{t("navbar.cityGanja")}</option>
        <option value="sumqayit">{t("navbar.citySumqayit")}</option>
        <option value="mingachevir">{t("navbar.cityMingachevir")}</option>
        <option value="shaki">{t("navbar.cityShaki")}</option>
      </select>
    </div>

    {/* Buttons */}
    <div className="flex gap-2 justify-end">
      <button
        onClick={handleClearFilters}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
        disabled={isApplying}
      >
        {t("navbar.clearFilters")}
      </button>
      <button
        onClick={handleApplyFilters}
        className="px-6 py-2 text-sm bg-lime-500 text-white rounded hover:bg-lime-600 flex items-center justify-center"
        disabled={isApplying}
      >
        {isApplying ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            {t("navbar.applying")}
          </>
        ) : (
          t("navbar.applyFilters")
        )}
      </button>
    </div>
  </div>
</div>

  );
};

export default ProductFilters;
