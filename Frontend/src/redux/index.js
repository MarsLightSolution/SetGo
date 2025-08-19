import { combineReducers } from "@reduxjs/toolkit";
import wishReducer from "../slices/wishSlice";
import filterReducer from "../slices/FilterSlice";
import productsReducer from "../slices/productSlices";

export const rootReducer = combineReducers({
  wishlist: wishReducer,
  filter: filterReducer,
  products: productsReducer,
});