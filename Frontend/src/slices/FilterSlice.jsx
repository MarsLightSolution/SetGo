import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  priceRange: [0, 10000],
  condition: "",
  radius: 0,
  city: "",
  searchQuery: "",
  location: {
    latitude: null,
    longitude: null,
  },
};

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setPriceRange: (state, action) => {
      state.priceRange = action.payload;
    },
    setCondition: (state, action) => {
      state.condition = action.payload;
    },
    setRadius: (state, action) => {
      state.radius = action.payload;
    },
    setCity: (state, action) => {
      state.city = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload; // Expects { latitude, longitude }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    resetFilters: (state) => {
      // This uses Object.assign to reset to the initial state cleanly
      Object.assign(state, initialState);
    },
  },
});

export const {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
  setLocation,
  setSearchQuery,
  resetFilters,
} = filterSlice.actions;

export default filterSlice.reducer;