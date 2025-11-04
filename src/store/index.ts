import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import { ownerApi } from './api/ownerApi';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    [ownerApi.reducerPath]: ownerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ownerApi.middleware),
});

// types + hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
