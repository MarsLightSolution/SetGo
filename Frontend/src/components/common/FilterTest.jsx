import React from 'react';
import { useSelector } from 'react-redux';

const FilterTest = () => {
  const filterState = useSelector((state) => state.filter);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm z-50">
      <h3 className="font-bold mb-2">Filter Debug</h3>
      <div className="text-xs space-y-1">
        <div>Price Range: {JSON.stringify(filterState.priceRange)}</div>
        <div>Condition: {filterState.condition || 'none'}</div>
        <div>City: {filterState.city || 'none'}</div>
        <div>Postal Code: {filterState.postalCode || 'none'}</div>
        <div>Search: {filterState.searchQuery || 'none'}</div>
        <div>Category: {filterState.selectedCategory || 'none'}</div>
        <div>Radius: {filterState.radius}km</div>
        <div>Location: {filterState.latitude && filterState.longitude ? 'set' : 'none'}</div>
      </div>
    </div>
  );
};

export default FilterTest;