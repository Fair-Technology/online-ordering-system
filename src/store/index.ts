import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import { shopReducer } from './slices/shopSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    shop: shopReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
