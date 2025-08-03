import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Slider from 'rc-slider';
import {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
  setSearchQuery,
  resetFilters
} from '../../slices/FilterSlice';
import "rc-slider/assets/index.css";

const ProductFilters = ({ isOpen, onClose, onApply }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Get current filter state
  const { priceRange, condition, radius, city, searchQuery } = useSelector((state) => state.filter);
  
  // Local state for filter form
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [localCondition, setLocalCondition] = useState(condition);
  const [localRadius, setLocalRadius] = useState(radius);
  const [localCity, setLocalCity] = useState(city);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Update local state when Redux state changes
  useEffect(() => {
    setLocalPriceRange(priceRange);
    setLocalCondition(condition);
    setLocalRadius(radius);
    setLocalCity(city);
    setLocalSearchQuery(searchQuery);
  }, [priceRange, condition, radius, city, searchQuery]);

  const handleApplyFilters = () => {
    dispatch(setPriceRange(localPriceRange));
    dispatch(setCondition(localCondition));
    dispatch(setRadius(localRadius));
    dispatch(setCity(localCity));
    dispatch(setSearchQuery(localSearchQuery));
    
    if (onApply) {
      onApply();
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setLocalPriceRange([0, 10000]);
    setLocalCondition("");
    setLocalRadius(0);
    setLocalCity("");
    setLocalSearchQuery("");
  };

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      alert(t("geolocationNotSupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        // This will be handled by the existing location filter logic
        console.log("Location set:", latitude, longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert(t("allowLocationAccess"));
        } else {
          alert(t("unableToFetchLocation"));
        }
        console.error(error);
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("navbar.filterListings")}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Search Query */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t("navbar.search")}
          </label>
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder={t("navbar.searchPlaceholder")}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        {/* Price Range Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t("navbar.priceRange")}: €{localPriceRange[0]} – €{localPriceRange[1]}
          </label>
          <Slider
            range
            min={0}
            max={10000}
            step={100}
            value={localPriceRange}
            onChange={setLocalPriceRange}
            trackStyle={[{ backgroundColor: "#84cc16" }]}
            handleStyle={[
              { borderColor: "#84cc16", backgroundColor: "#84cc16" },
              { borderColor: "#84cc16", backgroundColor: "#84cc16" },
            ]}
            railStyle={{ backgroundColor: "#d1d5db" }}
          />
        </div>

        {/* Condition Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t("navbar.condition")}
          </label>
          <select
            value={localCondition}
            onChange={(e) => setLocalCondition(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm cursor-pointer"
          >
            <option value="">{t("navbar.select")}</option>
            <option value="new">{t("navbar.conditionNew")}</option>
            <option value="like-new">{t("navbar.conditionLikeNew")}</option>
            <option value="used">{t("navbar.conditionUsed")}</option>
            <option value="defective">{t("navbar.conditionDefective")}</option>
          </select>
        </div>

        {/* Radius Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {t("navbar.radius")}: {localRadius} km
          </label>
          <input
            type="range"
            min="0"
            max="400"
            step="10"
            value={localRadius}
            onChange={(e) => setLocalRadius(Number(e.target.value))}
            className="w-full accent-lime-500 cursor-pointer"
          />
        </div>

        {/* City Selector */}
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            {t("navbar.clearFilters")}
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm bg-lime-500 text-white rounded hover:bg-lime-600 transition-colors"
          >
            {t("navbar.applyFilters")}
          </button>
          <button
            onClick={handleNearbyClick}
            className="px-4 py-2 text-sm bg-lime-600 text-white rounded hover:bg-lime-700 transition-colors"
          >
            {t("navbar.nearbyProducts")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;