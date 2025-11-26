import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { authReducer } from './authSlice';
import { usersApi } from './api/usersApi';
import { shopsApi } from './api/shopsApi';
import { productsApi } from './api/productsApi';
import { categoriesApi } from './api/categoriesApi';
import { ordersApi } from './api/ordersApi';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [shopsApi.reducerPath]: shopsApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      usersApi.middleware,
      shopsApi.middleware,
      productsApi.middleware,
      categoriesApi.middleware,
      ordersApi.middleware
    ),
});

// types + hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
