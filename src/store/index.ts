import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './authSlice';
import { usersApi } from './api/usersApi';
import { shopsApi } from './api/shopsApi';
import { productsApi } from './api/productsApi';
import { categoriesApi } from './api/categoriesApi';
import { ordersApi } from './api/ordersApi';

export const store = configureStore({
  reducer: {
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
