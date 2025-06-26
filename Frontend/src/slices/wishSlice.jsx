import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
const initialState = {
  wishlist: localStorage.getItem("wishlist")
    ? JSON.parse(localStorage.getItem("wishlist"))
    : [],
  totalItems: localStorage.getItem("totalItems")
    ? JSON.parse(localStorage.getItem("wishlist"))
    : 0,
};
const wishSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    like: (state, action) => {
      const ad = action.payload;
      const index = state.wishlist.findIndex((item) => item._id === ad._id);
      if (index >= 0) {
        toast.error("Ad is already present");
        return;
      }
      state.wishlist.push(ad);
      state.totalItems++;
      localStorage.setItem("cart", JSON.stringify(state.cart));
      localStorage.setItem("totalItems", JSON.stringify(state.totalItems));
      toast.success("Ad added to cart")
    },
  },
});

export const{like}=wishSlice.actions;
export default wishSlice.reducer;