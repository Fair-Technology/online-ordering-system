import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  type CreateShopRequest,
  type Shop,
  type ShopMenuResponse,
  type ShopHours,
  type ShopHoursPayload,
  type UpdateShopRequest,
  type ShopMember,
  type ShopMemberInvitePayload,
  type ShopMemberUpdatePayload,
} from './backend-generated/apiClient';
import { callApi } from './clientUtils';

export type ShopResponse = Shop;
export type ShopListResponse = Shop[];
export type CreateShopPayload = CreateShopRequest;
export type UpdateShopPayload = UpdateShopRequest;
export type ShopMenuPayload = ShopMenuResponse;
export type ShopHoursResponse = ShopHours | null;

type ListShopsParams = {
  status?: Shop['status'];
  acceptingOrders?: boolean;
};

export const shopsApi = createApi({
  reducerPath: 'shopsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Shops', 'ShopMenu', 'ShopHours', 'ShopMembers'],
  endpoints: (builder) => ({
    listShops: builder.query<ShopListResponse, ListShopsParams | void>({
      queryFn: (params, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.listShops(params ?? undefined)
        ),
      providesTags: (result) => {
        const listTag = { type: 'Shops' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map((shop) => ({ type: 'Shops' as const, id: shop.id })),
          listTag,
        ];
      },
    }),
    getShop: builder.query<ShopResponse, string>({
      queryFn: (shopId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.getShop(shopId)),
      providesTags: (_result, _error, shopId) => [
        { type: 'Shops', id: shopId },
      ],
    }),
    createShop: builder.mutation<ShopResponse, CreateShopPayload>({
      queryFn: (body, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.createShop(body)),
      invalidatesTags: [{ type: 'Shops', id: 'LIST' }],
    }),
    updateShop: builder.mutation<
      ShopResponse,
      { shopId: string; body: UpdateShopPayload }
    >({
      queryFn: ({ shopId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateShop(shopId, body)
        ),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'Shops', id: shopId },
        { type: 'Shops', id: 'LIST' },
      ],
    }),
    deleteShop: builder.mutation<void, string>({
      queryFn: (shopId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.deleteShop(shopId)),
      invalidatesTags: (_result, _error, shopId) => [
        { type: 'Shops', id: shopId },
        { type: 'Shops', id: 'LIST' },
      ],
    }),
    getShopMenu: builder.query<ShopMenuPayload, string>({
      queryFn: (shopId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.getShopMenu(shopId)),
      providesTags: (_result, _error, shopId) => [
        { type: 'ShopMenu', id: shopId },
      ],
    }),
    getShopHours: builder.query<ShopHours, string>({
      queryFn: (shopId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.getShopHours(shopId)),
      providesTags: (_result, _error, shopId) => [
        { type: 'ShopHours', id: shopId },
      ],
    }),
    upsertShopHours: builder.mutation<
      ShopHours,
      { shopId: string; body: ShopHoursPayload }
    >({
      queryFn: ({ shopId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.upsertShopHours(shopId, body)
        ),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ShopHours', id: shopId },
      ],
    }),
    listShopMembers: builder.query<ShopMember[], string>({
      queryFn: (shopId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.listShopMembers(shopId)),
      providesTags: (result, _error, shopId) => {
        const listTag = { type: 'ShopMembers' as const, id: `${shopId}-LIST` };
        if (!result) return [listTag];
        return [
          ...result.map((member) => ({
            type: 'ShopMembers' as const,
            id: member.id,
          })),
          listTag,
        ];
      },
    }),
    createShopMember: builder.mutation<
      ShopMember,
      { shopId: string; body: ShopMemberInvitePayload }
    >({
      queryFn: ({ shopId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.createShopMember(shopId, body)
        ),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ShopMembers', id: `${shopId}-LIST` },
      ],
    }),
    updateShopMember: builder.mutation<
      ShopMember,
      { shopId: string; memberId: string; body: ShopMemberUpdatePayload }
    >({
      queryFn: ({ shopId, memberId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateShopMember(shopId, memberId, body)
        ),
      invalidatesTags: (_result, _error, { shopId, memberId }) => [
        { type: 'ShopMembers', id: memberId },
        { type: 'ShopMembers', id: `${shopId}-LIST` },
      ],
    }),
  }),
});

export const {
  useListShopsQuery,
  useGetShopQuery,
  useLazyGetShopQuery,
  useCreateShopMutation,
  useUpdateShopMutation,
  useDeleteShopMutation,
  useGetShopMenuQuery,
  useGetShopHoursQuery,
  useUpsertShopHoursMutation,
  useListShopMembersQuery,
  useCreateShopMemberMutation,
  useUpdateShopMemberMutation,
} = shopsApi;
