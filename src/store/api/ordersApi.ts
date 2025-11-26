import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderStatusRequest,
} from './backend-generated/apiClient';
import { client } from './clientUtils';
import { getAccessToken } from './getAccessToken';
import type { RootState, AppDispatch } from '..';

export type OrderResponse = Order;
export type ShopOrderList = Order[];
export type OrderList = Order[];
export type CreateOrderPayload = CreateOrderRequest;
export type UpdateOrderStatusPayload = UpdateOrderStatusRequest;

type ListShopOrdersParams = {
  status?: string;
};

type ListOrdersParams = {
  shopId?: string;
  userId?: string;
};

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Orders', 'ShopOrders'],
  endpoints: (builder) => ({
    listShopOrders: builder.query<
      ShopOrderList,
      { shopId: string; params?: ListShopOrdersParams }
    >({
      queryFn: async ({ shopId, params }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listShopOrders(
            token,
            shopId,
            params
          );
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      providesTags: (result, _error, { shopId }) => {
        const listTag = { type: 'ShopOrders' as const, id: `${shopId}-LIST` };
        if (!result) return [listTag];
        return [
          ...result.map((order) => ({
            type: 'ShopOrders' as const,
            id: order.id,
          })),
          listTag,
        ];
      },
    }),
    listOrders: builder.query<OrderList, ListOrdersParams | void>({
      queryFn: async (params, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listOrders(token, params ?? undefined);
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      providesTags: (result) => {
        const listTag = { type: 'Orders' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map((order) => ({ type: 'Orders' as const, id: order.id })),
          listTag,
        ];
      },
    }),
    createOrder: builder.mutation<
      OrderResponse,
      { shopId: string; body: CreateOrderPayload }
    >({
      queryFn: async ({ shopId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.createOrder(token, shopId, body);
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ShopOrders', id: `${shopId}-LIST` },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    updateOrderStatus: builder.mutation<
      OrderResponse,
      { shopId: string; orderId: string; body: UpdateOrderStatusPayload }
    >({
      queryFn: async ({ shopId, orderId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateOrderStatus(
            token,
            shopId,
            orderId,
            body
          );
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      invalidatesTags: (_result, _error, { shopId, orderId }) => [
        { type: 'ShopOrders', id: orderId },
        { type: 'ShopOrders', id: `${shopId}-LIST` },
        { type: 'Orders', id: orderId },
      ],
    }),
    getOrder: builder.query<OrderResponse, string>({
      queryFn: async (orderId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getOrder(token, orderId);
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      providesTags: (_result, _error, orderId) => [
        { type: 'Orders', id: orderId },
      ],
    }),
    updateOrder: builder.mutation<
      OrderResponse,
      { orderId: string; body: Partial<OrderResponse> }
    >({
      queryFn: async ({ orderId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateOrder(token, orderId, body);
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Orders', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    deleteOrder: builder.mutation<void, string>({
      queryFn: async (orderId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.deleteOrder(token, orderId);
          return { data: response };
        } catch (error) {
          const err = error as {
            response?: { status?: number; data?: any };
          };
          return {
            error: {
              status: err.response?.status ?? 500,
              data: err.response?.data ?? 'Unknown error occurred',
            },
          };
        }
      },
      invalidatesTags: (_result, _error, orderId) => [
        { type: 'Orders', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListShopOrdersQuery,
  useListOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useGetOrderQuery,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;
