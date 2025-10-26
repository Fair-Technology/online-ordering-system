import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CategoryResponse,
  CreateCategoryRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  CreateProductInShopRequest,
  CreateProductRequest,
  CreateShopMemberRequest,
  CreateShopRequest,
  CreateShopResponse,
  GetShopHoursResponse,
  ListCategoriesResponse,
  ListOrdersQuery,
  ListOrdersResponse,
  ListShopMembersResponse,
  ProductInShopResponse,
  ProductResponse,
  ShopMemberResponse,
  ShopMenuResponse,
  ShopSettingsUpdateRequest,
  ShopSummary,
  UpdateCategoryRequest,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
  UpdateProductInShopRequest,
  UpdateProductRequest,
  UpdateShopMemberRequest,
  UpdateShopResponse,
  UpsertShopHoursRequest,
  UpsertShopHoursResponse,
  UserShopsResponse,
} from '../../types/apiTypes';

type ShopScopedBody<T> = { shopId: string; body: T };
type ShopAndMemberUpdate = {
  shopId: string;
  memberId: string;
  body: UpdateShopMemberRequest;
};
type ShopScopedQuery = { shopId: string };
type ShopScopedQueryWithParams<T> = { shopId: string; params?: T };

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export const ownerApi = createApi({
  reducerPath: 'ownerApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: [
    'Shop',
    'UserShop',
    'ShopMember',
    'ShopHours',
    'Category',
    'Product',
    'ProductInShop',
    'Order',
  ],
  endpoints: (builder) => ({
    getUserShops: builder.query<UserShopsResponse, void>({
      query: () => '/api/user/shops',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ shopId }) => ({
                type: 'UserShop' as const,
                id: shopId,
              })),
              { type: 'UserShop' as const, id: 'LIST' },
            ]
          : [{ type: 'UserShop' as const, id: 'LIST' }],
    }),

    getShops: builder.query<ShopSummary[], void>({
      query: () => '/api/shops',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'Shop' as const,
                id,
              })),
              { type: 'Shop' as const, id: 'LIST' },
            ]
          : [{ type: 'Shop' as const, id: 'LIST' }],
    }),

    getShopById: builder.query<ShopSummary, string>({
      query: (shopId) => `/api/shops/${shopId}`,
      providesTags: (_result, _error, shopId) => [{ type: 'Shop', id: shopId }],
    }),

    createShop: builder.mutation<CreateShopResponse, CreateShopRequest>({
      query: (body) => ({
        url: '/api/shops',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Shop', id: 'LIST' },
        { type: 'UserShop', id: 'LIST' },
      ],
    }),

    updateShopSettings: builder.mutation<
      UpdateShopResponse,
      ShopScopedBody<ShopSettingsUpdateRequest>
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/settings`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'Shop', id: shopId },
        { type: 'UserShop', id: shopId },
      ],
    }),

    getShopMembers: builder.query<ListShopMembersResponse, ShopScopedQuery>({
      query: ({ shopId }) => `/api/shops/${shopId}/members`,
      providesTags: (result, _error, { shopId }) => {
        const base = [{ type: 'ShopMember' as const, id: `${shopId}-LIST` }];
        if (!result) return base;
        return [
          ...result.map((member) => ({
            type: 'ShopMember' as const,
            id: member.id,
          })),
          ...base,
        ];
      },
    }),

    createShopMember: builder.mutation<
      ShopMemberResponse,
      { shopId: string; body: CreateShopMemberRequest }
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/members`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ShopMember', id: `${shopId}-LIST` },
      ],
    }),

    updateShopMember: builder.mutation<ShopMemberResponse, ShopAndMemberUpdate>(
      {
        query: ({ shopId, memberId, body }) => ({
          url: `/api/shops/${shopId}/members/${memberId}`,
          method: 'PATCH',
          body,
        }),
        invalidatesTags: (_result, _error, { memberId, shopId }) => [
          { type: 'ShopMember', id: memberId },
          { type: 'ShopMember', id: `${shopId}-LIST` },
        ],
      }
    ),

    removeShopMember: builder.mutation<
      { success: boolean },
      { shopId: string; memberId: string }
    >({
      query: ({ shopId, memberId }) => ({
        url: `/api/shops/${shopId}/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { memberId, shopId }) => [
        { type: 'ShopMember', id: memberId },
        { type: 'ShopMember', id: `${shopId}-LIST` },
      ],
    }),

    getShopHours: builder.query<GetShopHoursResponse, ShopScopedQuery>({
      query: ({ shopId }) => `/api/shops/${shopId}/hours`,
      providesTags: (_result, _error, { shopId }) => [
        { type: 'ShopHours', id: shopId },
      ],
    }),

    upsertShopHours: builder.mutation<
      UpsertShopHoursResponse,
      ShopScopedBody<UpsertShopHoursRequest>
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/hours`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ShopHours', id: shopId },
      ],
    }),

    getCategories: builder.query<
      ListCategoriesResponse,
      ShopScopedQueryWithParams<Record<string, string | number | boolean>>
    >({
      query: ({ shopId, params }) => ({
        url: `/api/shops/${shopId}/categories`,
        params,
      }),
      providesTags: (result, _error, { shopId }) => {
        const base = [{ type: 'Category' as const, id: `${shopId}-LIST` }];
        if (!result) return base;
        return [
          ...result.map(({ id }) => ({ type: 'Category' as const, id })),
          ...base,
        ];
      },
    }),

    createCategory: builder.mutation<
      CategoryResponse,
      ShopScopedBody<CreateCategoryRequest>
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/categories`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'Category', id: `${shopId}-LIST` },
      ],
    }),

    updateCategory: builder.mutation<
      CategoryResponse,
      { shopId: string; categoryId: string; body: UpdateCategoryRequest }
    >({
      query: ({ shopId, categoryId, body }) => ({
        url: `/api/shops/${shopId}/categories/${categoryId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { categoryId, shopId }) => [
        { type: 'Category', id: categoryId },
        { type: 'Category', id: `${shopId}-LIST` },
      ],
    }),

    deleteCategory: builder.mutation<
      { success: boolean },
      { shopId: string; categoryId: string }
    >({
      query: ({ shopId, categoryId }) => ({
        url: `/api/shops/${shopId}/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { categoryId, shopId }) => [
        { type: 'Category', id: categoryId },
        { type: 'Category', id: `${shopId}-LIST` },
      ],
    }),

    getProducts: builder.query<ProductResponse[], void>({
      query: () => '/api/products',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'Product' as const,
                id,
              })),
              { type: 'Product' as const, id: 'LIST' },
            ]
          : [{ type: 'Product' as const, id: 'LIST' }],
    }),

    createProduct: builder.mutation<ProductResponse, CreateProductRequest>({
      query: (body) => ({
        url: '/api/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<
      ProductResponse,
      { productId: string; body: UpdateProductRequest }
    >({
      query: ({ productId, body }) => ({
        url: `/api/products/${productId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation<{ success: boolean }, string>({
      query: (productId) => ({
        url: `/api/products/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, productId) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    getProductsInShop: builder.query<ProductInShopResponse[], string>({
      query: (shopId) => `/api/shops/${shopId}/products`,
      providesTags: (result, _error, shopId) => {
        const base = [{ type: 'ProductInShop' as const, id: `${shopId}-LIST` }];
        if (!result) return base;
        return [
          ...result.map(({ id }) => ({
            type: 'ProductInShop' as const,
            id,
          })),
          ...base,
        ];
      },
    }),

    createProductInShop: builder.mutation<
      ProductInShopResponse,
      ShopScopedBody<CreateProductInShopRequest>
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/products`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'ProductInShop', id: `${shopId}-LIST` },
      ],
    }),

    updateProductInShop: builder.mutation<
      ProductInShopResponse,
      {
        shopId: string;
        productInShopId: string;
        body: UpdateProductInShopRequest;
      }
    >({
      query: ({ shopId, productInShopId, body }) => ({
        url: `/api/shops/${shopId}/products/${productInShopId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { productInShopId, shopId }) => [
        { type: 'ProductInShop', id: productInShopId },
        { type: 'ProductInShop', id: `${shopId}-LIST` },
      ],
    }),

    deleteProductInShop: builder.mutation<
      { success: boolean },
      { shopId: string; productInShopId: string }
    >({
      query: ({ shopId, productInShopId }) => ({
        url: `/api/shops/${shopId}/products/${productInShopId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { productInShopId, shopId }) => [
        { type: 'ProductInShop', id: productInShopId },
        { type: 'ProductInShop', id: `${shopId}-LIST` },
      ],
    }),

    getMenu: builder.query<ShopMenuResponse, string>({
      query: (shopId) => `/api/shops/${shopId}/menu`,
    }),

    listOrders: builder.query<ListOrdersResponse, ListOrdersQuery | void>({
      query: (params) => ({
        url: '/api/orders',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'Order' as const,
                id,
              })),
              { type: 'Order' as const, id: 'LIST' },
            ]
          : [{ type: 'Order' as const, id: 'LIST' }],
    }),

    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: '/api/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    updateOrderStatus: builder.mutation<
      UpdateOrderStatusResponse,
      { orderId: string; body: UpdateOrderStatusRequest }
    >({
      query: ({ orderId, body }) => ({
        url: `/api/orders/${orderId}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUserShopsQuery,
  useGetShopsQuery,
  useGetShopByIdQuery,
  useCreateShopMutation,
  useUpdateShopSettingsMutation,
  useGetShopMembersQuery,
  useCreateShopMemberMutation,
  useUpdateShopMemberMutation,
  useRemoveShopMemberMutation,
  useGetShopHoursQuery,
  useUpsertShopHoursMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetProductsInShopQuery,
  useCreateProductInShopMutation,
  useUpdateProductInShopMutation,
  useDeleteProductInShopMutation,
  useGetMenuQuery,
  useListOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} = ownerApi;
