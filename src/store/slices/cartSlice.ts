import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// shop-scoped storage key helper
const BASE_CART_KEY = 'mewmew_cart_v1';
const cartKey = (shopId?: string) => `${BASE_CART_KEY}:${shopId ?? 'global'}`;

export type CartItem = {
  key: string; // signature id::variant::addons
  id: string;
  name: string;
  imageUrl?: string;
  price: number; // unit price
  quantity: number;
  variantId?: string;
  addonOptionIds?: string[];
};

interface CartState {
  shopId?: string;
  items: CartItem[];
}

const initialState: CartState = {
  shopId: undefined,
  items: [],
};

function makeSignature(payload: {
  id: string;
  variantId?: string;
  addonOptionIds?: string[];
}) {
  const addons = (payload.addonOptionIds || []).slice().sort().join(',');
  return `${payload.id}::${payload.variantId ?? ''}::${addons}`;
}

function persist(state: CartState) {
  try {
    localStorage.setItem(cartKey(state.shopId), JSON.stringify(state.items));
  } catch {}
}

function loadFromStorage(shopId?: string): CartItem[] {
  try {
    const raw = localStorage.getItem(cartKey(shopId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // load cart for a shop (reads localStorage scoped key)
    loadCart(state, action: PayloadAction<{ shopId?: string }>) {
      const { shopId } = action.payload;
      state.shopId = shopId;
      state.items = loadFromStorage(shopId);
    },
    addItem(
      state,
      action: PayloadAction<{
        shopId?: string;
        item: {
          id: string;
          name: string;
          imageUrl?: string;
          price: number;
          quantity?: number;
          variantId?: string;
          addonOptionIds?: string[];
        };
      }>
    ) {
      const { shopId, item } = action.payload;
      if (state.shopId !== shopId) {
        state.shopId = shopId;
        state.items = [];
      }
      const signature = makeSignature(item);
      const idx = state.items.findIndex((it) => it.key === signature);
      if (idx >= 0) {
        state.items[idx].quantity += item.quantity ?? 1;
      } else {
        state.items.push({
          key: signature,
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          price: item.price,
          quantity: item.quantity ?? 1,
          variantId: item.variantId,
          addonOptionIds: item.addonOptionIds,
        });
      }
      persist(state);
    },
    removeItem(state, action: PayloadAction<{ key: string }>) {
      state.items = state.items.filter((it) => it.key !== action.payload.key);
      persist(state);
    },
    incrementItem(state, action: PayloadAction<{ key: string; by?: number }>) {
      const { key, by = 1 } = action.payload;
      const it = state.items.find((i) => i.key === key);
      if (it) {
        it.quantity += by;
        persist(state);
      }
    },
    decrementItem(state, action: PayloadAction<{ key: string; by?: number }>) {
      const { key, by = 1 } = action.payload;
      const it = state.items.find((i) => i.key === key);
      if (it) {
        it.quantity = Math.max(0, it.quantity - by);
        if (it.quantity === 0)
          state.items = state.items.filter((i) => i.key !== key);
        persist(state);
      }
    },
    setQuantity(
      state,
      action: PayloadAction<{ key: string; quantity: number }>
    ) {
      const { key, quantity } = action.payload;
      const it = state.items.find((i) => i.key === key);
      if (it) {
        it.quantity = Math.max(0, quantity);
        if (it.quantity === 0)
          state.items = state.items.filter((i) => i.key !== key);
        persist(state);
      }
    },
    clearCart(state) {
      state.items = [];
      persist(state);
    },
  },
});

export const {
  loadCart,
  addItem,
  removeItem,
  incrementItem,
  decrementItem,
  setQuantity,
  clearCart,
} = cartSlice.actions;

// selectors
export const selectCartItems = (root: { cart: CartState }) => root.cart.items;
export const selectCartCount = (root: { cart: CartState }) =>
  root.cart.items.reduce((s, it) => s + it.quantity, 0);
export const selectCartTotal = (root: { cart: CartState }) =>
  root.cart.items.reduce((s, it) => s + it.price * it.quantity, 0);

export default cartSlice.reducer;
