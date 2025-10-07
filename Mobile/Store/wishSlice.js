import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    wishlist: [],
  },
  reducers: {
    like: (state, action) => {
      const exists = state.wishlist.find(item => item._id === action.payload._id);
      if (!exists) {
        state.wishlist.push(action.payload);
      }
    },
    unlike: (state, action) => {
      state.wishlist = state.wishlist.filter(item => item._id !== action.payload._id);
    },
    clearWishlist: (state) => {
      state.wishlist = [];
    }
  }
});

export const { like, unlike, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;