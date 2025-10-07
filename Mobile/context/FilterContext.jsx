import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: '',
    minPrice: null,
    maxPrice: null,
    condition: '',
    city: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    radius: 0,
  });

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      minPrice: null,
      maxPrice: null,
      condition: '',
      city: '',
      postalCode: '',
      latitude: null,
      longitude: null,
      radius: 0,
    });
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};