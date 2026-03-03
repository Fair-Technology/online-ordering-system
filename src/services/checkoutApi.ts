import { baseApi } from './baseApi';

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
  selectedVariantOptionId?: string;
  selectedAddonOptionIds?: string[];
}

export interface CheckoutRequest {
  shopId: string;
  items: CheckoutItemRequest[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes?: string;
}

export interface CheckoutResponse {
  sessionId: string;
  clientSecret: string;
  subtotalCents: number;
  currency: string;
}

export const checkoutApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    initiateCheckout: build.mutation<CheckoutResponse, CheckoutRequest>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const { useInitiateCheckoutMutation } = checkoutApi;
