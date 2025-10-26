import { configureStore } from '@reduxjs/toolkit';
import { itemApi } from './api/itemApi';
import { ownerApi } from './api/ownerApi';

export const store = configureStore({
  reducer: {
    [itemApi.reducerPath]: itemApi.reducer,
    [ownerApi.reducerPath]: ownerApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(itemApi.middleware, ownerApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
