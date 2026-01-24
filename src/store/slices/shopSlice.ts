import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ShopState {
  activeShopId: string | null;
  activeShopSlug: string | null;
}

const initialState: ShopState = {
  activeShopId: null,
  activeShopSlug: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setActiveShop(
      state,
      action: PayloadAction<{ shopId: string; slug?: string | null }>
    ) {
      state.activeShopId = action.payload.shopId;
      state.activeShopSlug = action.payload.slug ?? state.activeShopSlug;
    },
    clearActiveShop(state) {
      state.activeShopId = null;
      state.activeShopSlug = null;
    },
  },
});

export const { setActiveShop, clearActiveShop } = shopSlice.actions;
export const shopReducer = shopSlice.reducer;
