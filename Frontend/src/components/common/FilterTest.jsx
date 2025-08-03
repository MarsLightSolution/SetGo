import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRadius, setLocationFilter } from '../slices/FilterSlice';

const FilterTest = () => {
  const filterState = useSelector((state) => state.filter);
  const dispatch = useDispatch();
  
  const testRadiusFilter = () => {
    // Set a test location (New York coordinates)
    dispatch(setLocationFilter({ latitude: 40.7128, longitude: -74.0060 }));
    dispatch(setRadius(5)); // 5km radius
  };
  
  const clearLocation = () => {
    dispatch(setLocationFilter({ latitude: null, longitude: null }));
    dispatch(setRadius(0));
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-bold mb-2">Filter Debug</h3>
      <div className="text-xs space-y-1 mb-3">
        <div>Price Range: {JSON.stringify(filterState.priceRange)}</div>
        <div>Condition: {filterState.condition || 'none'}</div>
        <div>City: {filterState.city || 'none'}</div>
        <div>Postal Code: {filterState.postalCode || 'none'}</div>
        <div>Search: {filterState.searchQuery || 'none'}</div>
        <div>Category: {filterState.selectedCategory || 'none'}</div>
        <div>Radius: {filterState.radius}km</div>
        <div>Location: {filterState.location?.latitude && filterState.location?.longitude ? 'set' : 'none'}</div>
      </div>
      <div className="space-y-1">
        <button 
          onClick={testRadiusFilter}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Test Radius Filter (5km NYC)
        </button>
        <button 
          onClick={clearLocation}
          className="w-full bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Clear Location
        </button>
      </div>
    </div>
  );
};

export default FilterTest;