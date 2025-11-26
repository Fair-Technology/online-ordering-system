import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateCategoryRequest,
  ProductCategory,
  UpdateCategoryRequest,
} from './backend-generated/apiClient';
import { client } from './clientUtils';
import { getAccessToken } from './getAccessToken';
import type { RootState, AppDispatch } from '..';

export type CategoryResponse = ProductCategory;
export type CategoryListResponse = ProductCategory[];
export type CreateCategoryPayload = CreateCategoryRequest;
export type UpdateCategoryPayload = UpdateCategoryRequest;

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Categories'],
  endpoints: (builder) => ({
    listCategories: builder.query<CategoryListResponse, void>({
      queryFn: async (_arg, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listCategories(token);
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
        const listTag = { type: 'Categories' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map((category) => ({
            type: 'Categories' as const,
            id: category.id,
          })),
          listTag,
        ];
      },
    }),
    getCategory: builder.query<CategoryResponse, string>({
      queryFn: async (categoryId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getCategory(token, categoryId);
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
      providesTags: (_result, _error, categoryId) => [
        { type: 'Categories', id: categoryId },
      ],
    }),
    createCategory: builder.mutation<CategoryResponse, CreateCategoryPayload>({
      queryFn: async (body, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.createCategory(token, body);
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
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<
      CategoryResponse,
      { categoryId: string; body: UpdateCategoryPayload }
    >({
      queryFn: async ({ categoryId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateCategory(token, categoryId, body);
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
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: 'Categories', id: categoryId },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
    deleteCategory: builder.mutation<void, string>({
      queryFn: async (categoryId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.deleteCategory(token, categoryId);
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
      invalidatesTags: (_result, _error, categoryId) => [
        { type: 'Categories', id: categoryId },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
