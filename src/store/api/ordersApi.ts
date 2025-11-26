import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderStatusRequest,
} from './backend-generated/apiClient';
import { callApi } from './clientUtils';

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
      queryFn: ({ shopId, params }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.listShopOrders(shopId, params)
        ),
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
      queryFn: (params, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.listOrders(params ?? undefined)
        ),
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
      queryFn: ({ shopId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.createOrder(shopId, body)
        ),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ShopOrders', id: `${shopId}-LIST` },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    updateOrderStatus: builder.mutation<
      OrderResponse,
      { shopId: string; orderId: string; body: UpdateOrderStatusPayload }
    >({
      queryFn: ({ shopId, orderId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateOrderStatus(shopId, orderId, body)
        ),
      invalidatesTags: (_result, _error, { shopId, orderId }) => [
        { type: 'ShopOrders', id: orderId },
        { type: 'ShopOrders', id: `${shopId}-LIST` },
        { type: 'Orders', id: orderId },
      ],
    }),
    getOrder: builder.query<OrderResponse, string>({
      queryFn: (orderId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.getOrder(orderId)),
      providesTags: (_result, _error, orderId) => [
        { type: 'Orders', id: orderId },
      ],
    }),
    updateOrder: builder.mutation<
      OrderResponse,
      { orderId: string; body: Partial<OrderResponse> }
    >({
      queryFn: ({ orderId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateOrder(orderId, body)
        ),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Orders', id: orderId },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    deleteOrder: builder.mutation<void, string>({
      queryFn: (orderId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.deleteOrder(orderId)),
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
