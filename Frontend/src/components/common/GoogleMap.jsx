import React from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

export const useGoogleMaps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  return { isLoaded, loadError };
};

export const GoogleMapsLoader = ({ children, fallback }) => {
  const { isLoaded, loadError } = useGoogleMaps();

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-md text-sm text-gray-500">
        Failed to load map
      </div>
    );
  }

  if (!isLoaded) {
    return fallback || (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-md">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  return children;
};
