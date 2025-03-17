import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { apiSlice } from "./api/apiSlice";
import authReducer from './features/auth/authSlice'
import favoriteReducer from "./features/favourites/favoriteSlice"
import { getFavoritesFromLocalStorage } from "../Utils/localStorage";
import cartSliceReducer from "../redux/features/cart/cartSlice"
import shopSliceReducer from "../redux/features/shop/shopSlice"
import shippingSliceReducer from '../redux/features/shipping/shippingSlice'
import backupSliceReducer from '../redux/features/backup/backupSlice'

const initialFavorites = getFavoritesFromLocalStorage() || []

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    favorites: favoriteReducer,
    cart: cartSliceReducer,
    shop: shopSliceReducer,
    shipping: shippingSliceReducer,
    backup: backupSliceReducer
  },

  preloadedState: {
    favorites: initialFavorites,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

setupListeners(store.dispatch);
export default store;