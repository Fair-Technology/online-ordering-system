import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateCategoryRequest,
  ProductCategory,
  UpdateCategoryRequest,
} from './backend-generated/apiClient';
import { callApi } from './clientUtils';

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
      queryFn: (_arg, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.listCategories()),
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
      queryFn: (categoryId, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.getCategory(categoryId)
        ),
      providesTags: (_result, _error, categoryId) => [
        { type: 'Categories', id: categoryId },
      ],
    }),
    createCategory: builder.mutation<CategoryResponse, CreateCategoryPayload>({
      queryFn: (body, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.createCategory(body)
        ),
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<
      CategoryResponse,
      { categoryId: string; body: UpdateCategoryPayload }
    >({
      queryFn: ({ categoryId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateCategory(categoryId, body)
        ),
      invalidatesTags: (_result, _error, { categoryId }) => [
        { type: 'Categories', id: categoryId },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
    deleteCategory: builder.mutation<void, string>({
      queryFn: (categoryId, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.deleteCategory(categoryId)
        ),
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
