import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ManagedShopView,
  User,
  UserCreatePayload,
} from './backend-generated/apiClient';
import { client } from './clientUtils';
import { getAccessToken } from './getAccessToken';
import type { RootState, AppDispatch } from '..';

export type UserRecord = User;
export type UserListResponse = User[];
export type CreateUserPayload = UserCreatePayload;
export type ManagedShopSummary = ManagedShopView;

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Users', 'ManagedShops'],
  endpoints: (builder) => ({
    listUsers: builder.query<UserListResponse, void>({
      queryFn: async (_arg, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listUsers(token);
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
        const listTag = { type: 'Users' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map((user) => ({ type: 'Users' as const, id: user.id })),
          listTag,
        ];
      },
    }),
    createUser: builder.mutation<UserRecord, CreateUserPayload>({
      queryFn: async (body, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.createUser(token, body);
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
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: builder.query<UserRecord, string>({
      queryFn: async (userId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getUser(token, userId);
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
      providesTags: (_result, _error, userId) => [
        { type: 'Users', id: userId },
      ],
    }),
    updateUser: builder.mutation<
      UserRecord,
      { userId: string; body: Partial<UserRecord> }
    >({
      queryFn: async ({ userId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateUser(token, userId, body);
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
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      queryFn: async (userId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.deleteUser(token, userId);
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
      invalidatesTags: (_result, _error, userId) => [
        { type: 'Users', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    listManagedShops: builder.query<ManagedShopView[], string>({
      queryFn: async (userId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listManagedShops(token, userId);
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
        const listTag = { type: 'ManagedShops' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map(({ shopId }) => ({
            type: 'ManagedShops' as const,
            id: shopId,
          })),
          listTag,
        ];
      },
    }),
  }),
});

export const {
  useListUsersQuery,
  useCreateUserMutation,
  useGetUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useListManagedShopsQuery,
} = usersApi;
