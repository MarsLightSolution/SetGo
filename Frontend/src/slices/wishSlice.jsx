import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";

const initialState = {
  wishlist: localStorage.getItem("wishlist")
    ? JSON.parse(localStorage.getItem("wishlist"))
    : [],
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
      const exists = state.wishlist.find(item => item._id === ad._id);
      if (exists) {
        toast.error("Ad is already in wishlist");
        return;
      }
      state.wishlist.push(ad);
      state.totalItems++;
      localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
      toast.success("Ad added to wishlist");
    },

    unlike: (state, action) => {
      const ad = action.payload;
      const index = state.wishlist.findIndex(item => item._id === ad._id);
      if (index >= 0) {
        state.wishlist.splice(index, 1);
        state.totalItems--;
        localStorage.setItem("wishlist", JSON.stringify(state.wishlist));
        localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
        toast.success("Ad removed from wishlist");
      }
    },
  },
});

export const { like, unlike } = wishSlice.actions;
export default wishSlice.reducer;
