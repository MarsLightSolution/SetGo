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
  setLocation,
  resetFilters
} from '../../slices/FilterSlice';
import "rc-slider/assets/index.css";

// NEW: Helper function to get location using a Promise for async/await
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported."));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};


const ProductFilters = ({ isOpen, onClose, onApply }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const { priceRange, condition, radius, city, searchQuery, location } = useSelector((state) => state.filter);
  
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  const [localCondition, setLocalCondition] = useState(condition);
  const [localRadius, setLocalRadius] = useState(radius);
  const [localCity, setLocalCity] = useState(city);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // NEW: State to handle loading spinner on the apply button
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setLocalPriceRange(priceRange);
    setLocalCondition(condition);
    setLocalRadius(radius);
    setLocalCity(city);
    setLocalSearchQuery(searchQuery);
  }, [priceRange, condition, radius, city, searchQuery]);

  // MODIFIED: This function now contains all the logic
  const handleApplyFilters = async () => {
    setIsApplying(true); // Show loading spinner

    try {
      // Check if radius is set (>0) and if we don't already have a location
      if (localRadius > 0 && !location.latitude) {
        try {
          const position = await getCurrentLocation();
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // Update the location in Redux state
          dispatch(setLocation(newLocation));
        } catch (error) {
          alert(t("unableToFetchLocation"));
          console.error(error);
          setIsApplying(false); // Stop loading if location fails
          return; // Exit the function
        }
      }

      // Dispatch all the other filters
      dispatch(setPriceRange(localPriceRange));
      dispatch(setCondition(localCondition));
      dispatch(setRadius(localRadius));
      dispatch(setCity(localCity));
      dispatch(setSearchQuery(localSearchQuery));
      
      if (onApply) onApply();
      if (onClose) onClose();

    } finally {
      setIsApplying(false); // Hide loading spinner when done
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

  // REMOVED: The old handleGetLocation function is no longer needed

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t("navbar.filterListings")}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        {/* All your input fields remain the same */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t("navbar.search")}</label>
          <input type="text" value={localSearchQuery} onChange={(e) => setLocalSearchQuery(e.target.value)} placeholder={t("navbar.searchPlaceholder")} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t("navbar.priceRange")}: €{localPriceRange[0]} – €{localPriceRange[1]}</label>
          <Slider range min={0} max={10000} step={100} value={localPriceRange} onChange={setLocalPriceRange} trackStyle={[{ backgroundColor: "#84cc16" }]} handleStyle={[{ borderColor: "#84cc16" }, { borderColor: "#84cc16" }]} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t("navbar.condition")}</label>
          <select value={localCondition} onChange={(e) => setLocalCondition(e.target.value)} className="w-full border rounded px-3 py-2 text-sm cursor-pointer">
            <option value="">{t("navbar.select")}</option>
            <option value="New">{t("navbar.conditionNew")}</option>
            <option value="Like New">{t("navbar.conditionLikeNew")}</option>
            <option value="Used">{t("navbar.conditionUsed")}</option>
            <option value="Defective / Needs Repair">{t("navbar.conditionDefective")}</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t("navbar.radius")}: {localRadius} km</label>
          <input type="range" min="0" max="400" step="10" value={localRadius} onChange={(e) => setLocalRadius(Number(e.target.value))} className="w-full accent-lime-500 cursor-pointer" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t("navbar.city")}</label>
          <select value={localCity} onChange={(e) => setLocalCity(e.target.value)} className="w-full border rounded px-3 py-2 text-sm cursor-pointer">
            <option value="">{t("navbar.selectCity")}</option>
            <option value="baku">{t("navbar.cityBaku")}</option>
            <option value="ganja">{t("navbar.cityGanja")}</option>
            <option value="sumqayit">{t("navbar.citySumqayit")}</option>
            <option value="mingachevir">{t("navbar.cityMingachevir")}</option>
            <option value="shaki">{t("navbar.cityShaki")}</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleClearFilters} className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300" disabled={isApplying}>
            {t("navbar.clearFilters")}
          </button>
          <button onClick={handleApplyFilters} className="flex-grow px-4 py-2 text-sm bg-lime-500 text-white rounded hover:bg-lime-600 flex items-center justify-center" disabled={isApplying}>
            {isApplying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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