import { createSlice } from "@reduxjs/toolkit";

const filterSlice = createSlice({
  name: "filters",
  initialState: {
    priceRange: [0, 10000],
    condition: "",
    radius: 0,
    city: "",
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
  },
});

export const {
  setPriceRange,
  setCondition,
  setRadius,
  setCity,
} = filterSlice.actions;

export default filterSlice.reducer;
