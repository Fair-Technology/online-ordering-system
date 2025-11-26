import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from './backend-generated/apiClient';
import { callApi } from './clientUtils';

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
      queryFn: (params, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.listProducts(params ?? undefined)
        ),
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
      queryFn: (productId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.getProduct(productId)),
      providesTags: (_result, _error, productId) => [
        { type: 'Products', id: productId },
      ],
    }),
    createProduct: builder.mutation<ProductResponse, CreateProductPayload>({
      queryFn: (body, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.createProduct(body)),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<
      ProductResponse,
      { productId: string; body: UpdateProductPayload }
    >({
      queryFn: ({ productId, body }, apiCtx) =>
        callApi(apiCtx.getState, (client) =>
          client.updateProduct(productId, body)
        ),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Products', id: productId },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      queryFn: (productId, apiCtx) =>
        callApi(apiCtx.getState, (client) => client.deleteProduct(productId)),
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
