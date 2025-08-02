import { createSlice } from "@reduxjs/toolkit";

const filterSlice = createSlice({
  name: "filters",
initialState: {
  priceRange: [0, 10000],
  condition: "",
  radius: 0, // radius in km
  city: "", // optional - manual input by user
  searchQuery: "", // search query
  location: {
    latitude: null,
    longitude: null,
  },
},

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
    state.location = action.payload; // { latitude, longitude }
  },
  setLocationFilter: (state, action) => {
  state.latitude = action.payload.latitude;
  state.longitude = action.payload.longitude;
},
  setSearchQuery: (state, action) => {
    state.searchQuery = action.payload;
  },
  resetFilters: (state) => {
    state.priceRange = [0, 10000];
    state.condition = "";
    state.radius = 0;
    state.city = "";
    state.searchQuery = "";
    state.location = { latitude: null, longitude: null };
  },
  },
});

export const {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
  setLocation,
  setLocationFilter,
  setSearchQuery,
  resetFilters
} = filterSlice.actions;

export default filterSlice.reducer;
