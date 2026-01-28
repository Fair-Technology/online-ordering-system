import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ShopState {
  activeShopId: string | null;
}

const initialState: ShopState = {
  activeShopId: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setActiveShop(state, action: PayloadAction<{ shopId: string }>) {
      state.activeShopId = action.payload.shopId;
    },
    clearActiveShop(state) {
      state.activeShopId = null;
    },
  },
});

export const { setActiveShop, clearActiveShop } = shopSlice.actions;
export const shopReducer = shopSlice.reducer;
