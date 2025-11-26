import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './backend-generated/apiClient';
import { client } from './clientUtils';
import { getAccessToken } from './getAccessToken';
import type { RootState, AppDispatch } from '..';

export type ProductListResponse = ProductResponse[];
export type CreateProductPayload = CreateProductRequest;
export type UpdateProductPayload = UpdateProductRequest;

type ListProductsParams = {
  shopId?: string;
  ownerUserId?: string;
};

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    listProducts: builder.query<ProductListResponse, ListProductsParams | void>({
      queryFn: async (params, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.listProducts(token, params ?? {});
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
        const listTag = { type: 'Products' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map((product) => ({
            type: 'Products' as const,
            id: product.id,
          })),
          listTag,
        ];
      },
    }),
    getProduct: builder.query<ProductResponse, string>({
      queryFn: async (productId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.getProduct(token, productId);
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
      providesTags: (_result, _error, productId) => [
        { type: 'Products', id: productId },
      ],
    }),
    createProduct: builder.mutation<ProductResponse, CreateProductPayload>({
      queryFn: async (body, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.createProduct(token, body);
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
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<
      ProductResponse,
      { productId: string; body: UpdateProductPayload }
    >({
      queryFn: async ({ productId, body }, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.updateProduct(token, productId, body);
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
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Products', id: productId },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      queryFn: async (productId, { getState, dispatch }) => {
        const state = getState() as RootState;
        const token = await getAccessToken(state, dispatch as AppDispatch);

        if (!token) {
          return { error: { status: 401, data: 'No access token available' } };
        }

        try {
          const response = await client.deleteProduct(token, productId);
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
      invalidatesTags: (_result, _error, productId) => [
        { type: 'Products', id: productId },
        { type: 'Products', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
