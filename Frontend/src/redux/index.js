import { combineReducers } from "@reduxjs/toolkit";
import wishReducer from "../slices/wishSlice"
export const rootReducer=combineReducers({
    wishlist:wishReducer,
});
