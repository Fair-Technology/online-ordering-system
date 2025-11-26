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
import { client } from './clientUtils';
import { getAccessToken } from './getAccessToken';
import type { RootState, AppDispatch } from '..';

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
      queryFn: async (params, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listShops(token, params ?? undefined);
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
        const listTag = { type: 'Shops' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map((shop) => ({ type: 'Shops' as const, id: shop.id })),
          listTag,
        ];
      },
    }),
    getShop: builder.query<ShopResponse, string>({
      queryFn: async (shopId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getShop(token, shopId);
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
      providesTags: (_result, _error, shopId) => [
        { type: 'Shops', id: shopId },
      ],
    }),
    createShop: builder.mutation<ShopResponse, CreateShopPayload>({
      queryFn: async (body, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.createShop(token, body);
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
      invalidatesTags: [{ type: 'Shops', id: 'LIST' }],
    }),
    updateShop: builder.mutation<
      ShopResponse,
      { shopId: string; body: UpdateShopPayload }
    >({
      queryFn: async ({ shopId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateShop(token, shopId, body);
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
        { type: 'Shops', id: shopId },
        { type: 'Shops', id: 'LIST' },
      ],
    }),
    deleteShop: builder.mutation<void, string>({
      queryFn: async (shopId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.deleteShop(token, shopId);
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
      invalidatesTags: (_result, _error, shopId) => [
        { type: 'Shops', id: shopId },
        { type: 'Shops', id: 'LIST' },
      ],
    }),
    getShopMenu: builder.query<ShopMenuPayload, string>({
      queryFn: async (shopId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getShopMenu(token, shopId);
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
      providesTags: (_result, _error, shopId) => [
        { type: 'ShopMenu', id: shopId },
      ],
    }),
    getShopHours: builder.query<ShopHours, string>({
      queryFn: async (shopId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getShopHours(token, shopId);
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
      providesTags: (_result, _error, shopId) => [
        { type: 'ShopHours', id: shopId },
      ],
    }),
    upsertShopHours: builder.mutation<
      ShopHours,
      { shopId: string; body: ShopHoursPayload }
    >({
      queryFn: async ({ shopId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.upsertShopHours(token, shopId, body);
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
        { type: 'ShopHours', id: shopId },
      ],
    }),
    listShopMembers: builder.query<ShopMember[], string>({
      queryFn: async (shopId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listShopMembers(token, shopId);
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
      queryFn: async ({ shopId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.createShopMember(token, shopId, body);
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
        { type: 'ShopMembers', id: `${shopId}-LIST` },
      ],
    }),
    updateShopMember: builder.mutation<
      ShopMember,
      { shopId: string; memberId: string; body: ShopMemberUpdatePayload }
    >({
      queryFn: async ({ shopId, memberId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateShopMember(
            token,
            shopId,
            memberId,
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
