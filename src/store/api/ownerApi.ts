import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CartResponse,
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
  UserRole,
  UserShopsResponse,
  UpdateCartRequest,
} from '../../types/apiTypes';

type ShopScopedBody<T> = { shopId: string; body: T };
type ShopScopedQuery = { shopId: string };
type ShopScopedQueryWithParams<T> = { shopId: string; params?: T };
type ShopResourceUpdate<Body, Key extends string> = ShopScopedBody<Body> &
  Record<Key, string>;

type CreateUserRequest = {
  entraId: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
};

type UserResponse = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
};

type UserListResponse = UserResponse[];

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071';

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
    'Cart',
    'Category',
    'Order',
    'Product',
    'ProductInShop',
    'Shop',
    'ShopHours',
    'ShopMember',
    'User',
    'UserShop',
  ],
  endpoints: (builder) => ({
    cartGet: builder.query<
      CartResponse,
      { shopId: string; userId: string; params?: Record<string, string> }
    >({
      query: ({ shopId, userId, params }) => ({
        url: `/api/shops/${shopId}/cart`,
        params: { userId, ...params },
      }),
      providesTags: (_result, _error, { shopId, userId }) => [
        { type: 'Cart', id: `${shopId}-${userId}` },
      ],
    }),

    cartPut: builder.mutation<CartResponse, ShopScopedBody<UpdateCartRequest>>({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/cart`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId, body }) => [
        { type: 'Cart', id: `${shopId}-${body.userId}` },
      ],
    }),

    categoriesCreate: builder.mutation<
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

    categoriesList: builder.query<
      ListCategoriesResponse,
      ShopScopedQueryWithParams<Record<string, string | number | boolean>>
    >({
      query: ({ shopId, params }) => ({
        url: `/api/shops/${shopId}/categories`,
        params,
      }),
      providesTags: (result, _error, { shopId }) => {
        const listTag = { type: 'Category' as const, id: `${shopId}-LIST` };
        if (!result) return [listTag];
        return [
          ...result.map(({ id }) => ({ type: 'Category' as const, id })),
          listTag,
        ];
      },
    }),

    categoriesUpdate: builder.mutation<
      CategoryResponse,
      ShopResourceUpdate<UpdateCategoryRequest, 'categoryId'>
    >({
      query: ({ shopId, categoryId, body }) => ({
        url: `/api/shops/${shopId}/categories/${categoryId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId, categoryId }) => [
        { type: 'Category', id: categoryId },
        { type: 'Category', id: `${shopId}-LIST` },
      ],
    }),

    ordersCreate: builder.mutation<
      CreateOrderResponse,
      ShopScopedBody<CreateOrderRequest>
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}/orders`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'Order', id: `${shopId}-LIST` },
      ],
    }),

    ordersList: builder.query<
      ListOrdersResponse,
      ShopScopedQueryWithParams<ListOrdersQuery | undefined>
    >({
      query: ({ shopId, params }) => ({
        url: `/api/shops/${shopId}/orders`,
        params,
      }),
      providesTags: (result, _error, { shopId }) => {
        const listTag = { type: 'Order' as const, id: `${shopId}-LIST` };
        if (!result) return [listTag];
        return [
          ...result.map(({ id }) => ({ type: 'Order' as const, id })),
          listTag,
        ];
      },
    }),

    ordersUpdateStatus: builder.mutation<
      UpdateOrderStatusResponse,
      ShopResourceUpdate<UpdateOrderStatusRequest, 'orderId'>
    >({
      query: ({ shopId, orderId, body }) => ({
        url: `/api/shops/${shopId}/orders/${orderId}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId, orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: `${shopId}-LIST` },
      ],
    }),

    productsCreate: builder.mutation<ProductResponse, CreateProductRequest>({
      query: (body) => ({
        url: '/api/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    productsUpdate: builder.mutation<
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

    productsInShopCreate: builder.mutation<
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

    productsInShopUpdate: builder.mutation<
      ProductInShopResponse,
      ShopResourceUpdate<UpdateProductInShopRequest, 'productInShopId'>
    >({
      query: ({ shopId, productInShopId, body }) => ({
        url: `/api/shops/${shopId}/products/${productInShopId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId, productInShopId }) => [
        { type: 'ProductInShop', id: productInShopId },
        { type: 'ProductInShop', id: `${shopId}-LIST` },
      ],
    }),

    shopHoursGet: builder.query<GetShopHoursResponse, ShopScopedQuery>({
      query: ({ shopId }) => `/api/shops/${shopId}/hours`,
      providesTags: (_result, _error, { shopId }) => [
        { type: 'ShopHours', id: shopId },
      ],
    }),

    shopHoursUpsert: builder.mutation<
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

    shopMembersCreate: builder.mutation<
      ShopMemberResponse,
      ShopScopedBody<CreateShopMemberRequest>
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

    shopMembersList: builder.query<ListShopMembersResponse, ShopScopedQuery>({
      query: ({ shopId }) => `/api/shops/${shopId}/members`,
      providesTags: (result, _error, { shopId }) => {
        const listTag = { type: 'ShopMember' as const, id: `${shopId}-LIST` };
        if (!result) return [listTag];
        return [
          ...result.map(({ id }) => ({ type: 'ShopMember' as const, id })),
          listTag,
        ];
      },
    }),

    shopMembersUpdate: builder.mutation<
      ShopMemberResponse,
      ShopResourceUpdate<UpdateShopMemberRequest, 'memberId'>
    >({
      query: ({ shopId, memberId, body }) => ({
        url: `/api/shops/${shopId}/members/${memberId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId, memberId }) => [
        { type: 'ShopMember', id: memberId },
        { type: 'ShopMember', id: `${shopId}-LIST` },
      ],
    }),

    shopsCreate: builder.mutation<CreateShopResponse, CreateShopRequest>({
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

    shopsGetById: builder.query<ShopSummary, string>({
      query: (shopId) => `/api/shops/${shopId}`,
      providesTags: (_result, _error, shopId) => [{ type: 'Shop', id: shopId }],
    }),

    shopsMenu: builder.query<ShopMenuResponse, string>({
      query: (shopId) => `/api/shops/${shopId}/menu`,
    }),

    shopsUpdate: builder.mutation<
      UpdateShopResponse,
      { shopId: string; body: ShopSettingsUpdateRequest }
    >({
      query: ({ shopId, body }) => ({
        url: `/api/shops/${shopId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { shopId }) => [
        { type: 'Shop', id: shopId },
        { type: 'Shop', id: 'LIST' },
      ],
    }),
    shopsDelete: builder.mutation<void, string>({
      query: (shopId) => ({
        url: `/api/shops/${shopId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, shopId) => [
        { type: 'Shop', id: shopId },
        { type: 'Shop', id: 'LIST' },
        { type: 'UserShop', id: 'LIST' },
      ],
    }),

    usersCreate: builder.mutation<UserResponse, CreateUserRequest>({
      query: (body) => ({
        url: '/api/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    usersList: builder.query<UserListResponse, void>({
      query: () => '/api/users',
      providesTags: (result) => {
        const listTag = { type: 'User' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map(({ id }) => ({ type: 'User' as const, id })),
          listTag,
        ];
      },
    }),

    usersGetShops: builder.query<UserShopsResponse, { userId: string }>({
      query: ({ userId }) => `/api/users/${userId}/shops`,
      providesTags: (result) => {
        const listTag = { type: 'UserShop' as const, id: 'LIST' };
        if (!result) return [listTag];
        return [
          ...result.map(({ shopId }) => ({
            type: 'UserShop' as const,
            id: shopId,
          })),
          listTag,
        ];
      },
    }),
  }),
});

export const {
  useCartGetQuery,
  useCartPutMutation,
  useCategoriesCreateMutation,
  useCategoriesListQuery,
  useCategoriesUpdateMutation,
  useOrdersCreateMutation,
  useOrdersListQuery,
  useOrdersUpdateStatusMutation,
  useProductsCreateMutation,
  useProductsUpdateMutation,
  useProductsInShopCreateMutation,
  useProductsInShopUpdateMutation,
  useShopHoursGetQuery,
  useShopHoursUpsertMutation,
  useShopMembersCreateMutation,
  useShopMembersListQuery,
  useShopMembersUpdateMutation,
  useShopsCreateMutation,
  useShopsDeleteMutation,
  useShopsGetByIdQuery,
  useShopsMenuQuery,
  useShopsUpdateMutation,
  useUsersCreateMutation,
  useUsersListQuery,
  useUsersGetShopsQuery,
} = ownerApi;
