import { configureStore } from '@reduxjs/toolkit';
import { ownerApi } from './api/ownerApi';

export const store = configureStore({
  reducer: {
    [ownerApi.reducerPath]: ownerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ownerApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
