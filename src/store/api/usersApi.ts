import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ManagedShopView,
  User,
  UserCreatePayload,
} from './backend-generated/apiClient';
import { callApi } from './clientUtils';

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
      queryFn: (_arg, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.listUsers()),
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
      queryFn: (body, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.createUser(body)),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: builder.query<UserRecord, string>({
      queryFn: (userId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.getUser(userId)),
      providesTags: (_result, _error, userId) => [
        { type: 'Users', id: userId },
      ],
    }),
    updateUser: builder.mutation<
      UserRecord,
      { userId: string; body: Partial<UserRecord> }
    >({
      queryFn: ({ userId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateUser(userId, body)
        ),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      queryFn: (userId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.deleteUser(userId)),
      invalidatesTags: (_result, _error, userId) => [
        { type: 'Users', id: userId },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    listManagedShops: builder.query<ManagedShopView[], string>({
      queryFn: (userId, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.listManagedShops(userId)
        ),
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
