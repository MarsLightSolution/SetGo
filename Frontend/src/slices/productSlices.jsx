import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  latestAds: [],
  recommendedAds: [],
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      // This allows you to set either latestAds or recommendedAds
      // by dispatching { latestAds: [...] } or { recommendedAds: [...] }
      Object.assign(state, action.payload);
    },
    // You can add more reducers here if needed, e.g., to clear products
    clearProducts: (state) => {
      state.latestAds = [];
      state.recommendedAds = [];
    },
  },
});

export const { setProducts, clearProducts } = productSlice.actions;

export default productSlice.reducer;