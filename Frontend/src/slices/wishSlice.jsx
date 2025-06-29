import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";

const initialState = {
  wishlist: localStorage.getItem("wishlist")
    ? JSON.parse(localStorage.getItem("wishlist"))
    : [],
  total: localStorage.getItem("total")
    ? JSON.parse(localStorage.getItem("total"))
    : 0,
  totalItems: localStorage.getItem("totalItems")
    ? JSON.parse(localStorage.getItem("totalItems"))
    : 0,
};

const wishSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    like: (state, action) => {
      const ad = action.payload;
      const exists = state.wishlist.find((item) => item._id === ad._id);

      if (exists) {
        toast.error("Ad is already in wishlist");
        return;
      }

      state.wishlist.push(ad);
      state.total += ad.price || 0; 
      state.totalItems++;

      localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
      localStorage.setItem("total", JSON.stringify(state.total));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));

      toast.success("Ad added to wishlist");
    },

    unlike: (state, action) => {
      const ad = action.payload;
      const index = state.wishlist.findIndex((item) => item._id === ad._id);

      if (index >= 0) {
        const removedAd = state.wishlist[index];
        state.wishlist.splice(index, 1);
        state.totalItems--;
        state.total -= removedAd.price || 0; 

        if (state.total < 0) state.total = 0;

        localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
        localStorage.setItem("total", JSON.stringify(state.total)); // ✅ Was missing before
        localStorage.setItem("totalItems", JSON.stringify(state.totalItems));

        toast.success("Ad removed from wishlist");
      }
    },
    resetWishlist: (state) => {
      state.wishlist = [];
      state.total = 0;
      state.totalItems = 0;

      localStorage.removeItem("wishlist");
      localStorage.removeItem("total");
      localStorage.removeItem("totalItems");
    },
  },
});

export const { like, unlike, resetWishlist } = wishSlice.actions;
export default wishSlice.reducer;
