import { combineReducers } from "@reduxjs/toolkit";
import wishReducer from "../slices/wishSlice"
import FilterSlice from "../slices/FilterSlice";
export const rootReducer=combineReducers({
    wishlist:wishReducer,
    filter:FilterSlice
});
