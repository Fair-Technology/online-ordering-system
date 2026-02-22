import { baseApi as api } from './baseApi';
export const addTagTypes = ['Shops', 'Categories', 'Products'] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      postShops: build.mutation<PostShopsApiResponse, PostShopsApiArg>({
        query: (queryArg) => ({
          url: `/shops`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Shops'],
      }),
      getShopsSlugBySlug: build.query<
        GetShopsSlugBySlugApiResponse,
        GetShopsSlugBySlugApiArg
      >({
        query: (queryArg) => ({ url: `/shops/slug/${queryArg}` }),
        providesTags: ['Shops'],
      }),
      getShopsByShopId: build.query<
        GetShopsByShopIdApiResponse,
        GetShopsByShopIdApiArg
      >({
        query: (queryArg) => ({ url: `/shops/${queryArg}` }),
        providesTags: ['Shops'],
      }),
      patchShopsByShopId: build.mutation<
        PatchShopsByShopIdApiResponse,
        PatchShopsByShopIdApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}`,
          method: 'PATCH',
          body: queryArg.updateShopRequest,
        }),
        invalidatesTags: ['Shops'],
      }),
      deleteShopsByShopId: build.mutation<
        DeleteShopsByShopIdApiResponse,
        DeleteShopsByShopIdApiArg
      >({
        query: (queryArg) => ({ url: `/shops/${queryArg}`, method: 'DELETE' }),
        invalidatesTags: ['Shops'],
      }),
      getShopsByShopIdCategories: build.query<
        GetShopsByShopIdCategoriesApiResponse,
        GetShopsByShopIdCategoriesApiArg
      >({
        query: (queryArg) => ({ url: `/shops/${queryArg}/categories` }),
        providesTags: ['Categories'],
      }),
      postShopsByShopIdCategories: build.mutation<
        PostShopsByShopIdCategoriesApiResponse,
        PostShopsByShopIdCategoriesApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/categories`,
          method: 'POST',
          body: queryArg.createCategoryRequest,
        }),
        invalidatesTags: ['Categories'],
      }),
      getShopsByShopIdCategoriesAndCategoryId: build.query<
        GetShopsByShopIdCategoriesAndCategoryIdApiResponse,
        GetShopsByShopIdCategoriesAndCategoryIdApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/categories/${queryArg.categoryId}`,
        }),
        providesTags: ['Categories'],
      }),
      patchShopsByShopIdCategoriesAndCategoryId: build.mutation<
        PatchShopsByShopIdCategoriesAndCategoryIdApiResponse,
        PatchShopsByShopIdCategoriesAndCategoryIdApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/categories/${queryArg.categoryId}`,
          method: 'PATCH',
          body: queryArg.updateCategoryRequest,
        }),
        invalidatesTags: ['Categories'],
      }),
      deleteShopsByShopIdCategoriesAndCategoryId: build.mutation<
        DeleteShopsByShopIdCategoriesAndCategoryIdApiResponse,
        DeleteShopsByShopIdCategoriesAndCategoryIdApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/categories/${queryArg.categoryId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Categories'],
      }),
      getProducts: build.query<GetProductsApiResponse, GetProductsApiArg>({
        query: (queryArg) => ({
          url: `/products`,
          params: {
            shopId: queryArg,
          },
        }),
        providesTags: ['Products'],
      }),
      postProducts: build.mutation<PostProductsApiResponse, PostProductsApiArg>(
        {
          query: (queryArg) => ({
            url: `/products`,
            method: 'POST',
            body: queryArg,
          }),
          invalidatesTags: ['Products'],
        },
      ),
      getProductsByProductId: build.query<
        GetProductsByProductIdApiResponse,
        GetProductsByProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/products/${queryArg.productId}`,
          params: {
            shopId: queryArg.shopId,
          },
        }),
        providesTags: ['Products'],
      }),
      patchProductsByProductId: build.mutation<
        PatchProductsByProductIdApiResponse,
        PatchProductsByProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/products/${queryArg.productId}`,
          method: 'PATCH',
          body: queryArg.updateProductRequest,
        }),
        invalidatesTags: ['Products'],
      }),
      deleteProductsByProductId: build.mutation<
        DeleteProductsByProductIdApiResponse,
        DeleteProductsByProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/products/${queryArg.productId}`,
          method: 'DELETE',
          params: {
            shopId: queryArg.shopId,
          },
        }),
        invalidatesTags: ['Products'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type PostShopsApiResponse =
  /** status 200 Shop created successfully */ ShopResponse;
export type PostShopsApiArg = CreateShopRequest;
export type GetShopsSlugBySlugApiResponse =
  /** status 200 Shop retrieved successfully */ ShopResponse;
export type GetShopsSlugBySlugApiArg =
  /** Shop slug (public identifier) */ string;
export type GetShopsByShopIdApiResponse =
  /** status 200 Shop retrieved successfully */ ShopResponse;
export type GetShopsByShopIdApiArg = /** Shop ID */ string;
export type PatchShopsByShopIdApiResponse =
  /** status 200 Shop updated successfully */ ShopResponse;
export type PatchShopsByShopIdApiArg = {
  /** Shop ID */
  shopId: string;
  updateShopRequest: UpdateShopRequest;
};
export type DeleteShopsByShopIdApiResponse =
  /** status 200 Shop deleted successfully */ DeleteResponse;
export type DeleteShopsByShopIdApiArg = /** Shop ID */ string;
export type GetShopsByShopIdCategoriesApiResponse =
  /** status 200 Categories retrieved successfully */ CategoriesResponse;
export type GetShopsByShopIdCategoriesApiArg = /** Shop ID */ string;
export type PostShopsByShopIdCategoriesApiResponse =
  /** status 200 Category created successfully */ CategoryResponse;
export type PostShopsByShopIdCategoriesApiArg = {
  /** Shop ID */
  shopId: string;
  createCategoryRequest: CreateCategoryRequest;
};
export type GetShopsByShopIdCategoriesAndCategoryIdApiResponse =
  /** status 200 Category retrieved successfully */ CategoryResponse;
export type GetShopsByShopIdCategoriesAndCategoryIdApiArg = {
  /** Shop ID */
  shopId: string;
  /** Category ID */
  categoryId: string;
};
export type PatchShopsByShopIdCategoriesAndCategoryIdApiResponse =
  /** status 200 Category updated successfully */ CategoryResponse;
export type PatchShopsByShopIdCategoriesAndCategoryIdApiArg = {
  /** Shop ID */
  shopId: string;
  /** Category ID */
  categoryId: string;
  updateCategoryRequest: UpdateCategoryRequest;
};
export type DeleteShopsByShopIdCategoriesAndCategoryIdApiResponse =
  /** status 200 Category deleted successfully */ CategoryResponse;
export type DeleteShopsByShopIdCategoriesAndCategoryIdApiArg = {
  /** Shop ID */
  shopId: string;
  /** Category ID */
  categoryId: string;
};
export type GetProductsApiResponse =
  /** status 200 Products retrieved successfully */ ProductsResponse;
export type GetProductsApiArg = /** Shop ID to filter products */ string;
export type PostProductsApiResponse =
  /** status 200 Product created successfully */ ProductResponse;
export type PostProductsApiArg = CreateProductRequest;
export type GetProductsByProductIdApiResponse =
  /** status 200 Product retrieved successfully */ ProductResponse;
export type GetProductsByProductIdApiArg = {
  /** Product ID */
  productId: string;
  /** Shop ID (required for partition key) */
  shopId: string;
};
export type PatchProductsByProductIdApiResponse =
  /** status 200 Product updated successfully */ ProductResponse;
export type PatchProductsByProductIdApiArg = {
  /** Product ID */
  productId: string;
  updateProductRequest: UpdateProductRequest;
};
export type DeleteProductsByProductIdApiResponse =
  /** status 200 Product deleted successfully */ DeleteResponse;
export type DeleteProductsByProductIdApiArg = {
  /** Product ID */
  productId: string;
  /** Shop ID (required for partition key) */
  shopId: string;
};
export type ShopResponse = {
  /** Shop ID */
  id?: string;
  /** Shop slug */
  slug?: string;
  /** Shop name */
  name?: string;
  /** Whether shop is deleted */
  isDeleted?: boolean;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
};
export type CreateShopRequest = {
  /** Unique shop identifier */
  slug: string;
  /** Shop name */
  name: string;
  /** Whether shop is deleted */
  isDeleted?: boolean;
  /** Whether shop is accepting orders */
  acceptingOrders?: boolean;
  /** Whether shop is paused */
  isPaused?: boolean;
  /** Message when shop is paused */
  pausedMessage?: string;
  /** Shop currency */
  currency: string;
  /** Shop timezone */
  timezone: string;
  /** Minimum order amount in cents */
  minOrderAmountCents: number;
  /** Payment policy */
  paymentPolicy: 'pay_online';
  /** Order acceptance mode */
  orderAcceptanceMode?: 'auto';
  /** Allow guest checkout */
  allowGuestCheckout: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  openingHours?: {
    mon?: {
      open?: string;
      close?: string;
    }[];
    tue?: {
      open?: string;
      close?: string;
    }[];
    wed?: {
      open?: string;
      close?: string;
    }[];
    thu?: {
      open?: string;
      close?: string;
    }[];
    fri?: {
      open?: string;
      close?: string;
    }[];
    sat?: {
      open?: string;
      close?: string;
    }[];
    sun?: {
      open?: string;
      close?: string;
    }[];
  };
  closures?: {
    id?: string;
    start?: string;
    end?: string;
    reason?: string;
  }[];
  members?: {
    userId?: string;
    role?: 'owner' | 'staff';
    isActive?: boolean;
  }[];
};
export type UpdateShopRequest = {
  /** Shop name */
  name?: string;
  /** Whether shop is accepting orders */
  acceptingOrders?: boolean;
  /** Whether shop is paused */
  isPaused?: boolean;
  /** Message when shop is paused */
  pausedMessage?: string;
  /** Payment policy */
  paymentPolicy?: 'pay_online';
  /** Allow guest checkout */
  allowGuestCheckout?: boolean;
  /** Shop currency */
  currency?: string;
  /** Shop timezone */
  timezone?: string;
  /** Minimum order amount in cents */
  minOrderAmountCents?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};
export type DeleteResponse = {
  /** Whether deletion was successful */
  success?: boolean;
};
export type CategoryResponse = {
  /** Category ID */
  id?: string;
  /** Shop ID */
  shopId?: string;
  /** Category name */
  name?: string;
  /** Category slug */
  slug?: string;
  /** Sort order for display */
  sortOrder?: number;
  /** Whether category is deleted */
  isDeleted?: boolean;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
};
export type CategoriesResponse = CategoryResponse[];
export type CreateCategoryRequest = {
  /** Category name */
  name: string;
  /** Unique category identifier within shop */
  slug: string;
  /** Sort order for display */
  sortOrder?: number;
};
export type UpdateCategoryRequest = {
  /** Category name */
  name?: string;
  /** Unique category identifier within shop */
  slug?: string;
  /** Sort order for display */
  sortOrder?: number;
};
export type ProductResponse = {
  /** Product ID */
  id?: string;
  /** Shop ID */
  shopId?: string;
  /** Product name */
  name?: string;
  /** Product description */
  description?: string;
  /** Sort order for display */
  sortOrder?: number;
  /** Product price in cents */
  price?: number;
  /** Product categories with full details */
  categories?: {
    /** Category ID */
    id?: string;
    /** Category name */
    name?: string;
    /** Category slug */
    slug?: string;
    /** Category sort order */
    sortOrder?: number;
  }[];
  /** Product images */
  images?: {
    /** Image ID */
    id?: string;
    /** Image URL */
    url?: string;
    /** Whether this is the primary image */
    isPrimary?: boolean;
  }[];
  /** Allergy information */
  allergyInfo?: string[];
  /** Product variant groups (optional) */
  variantGroups?: {
    /** Variant group ID */
    id?: string;
    /** Variant group name */
    name?: string;
    options?: {
      /** Option ID */
      id?: string;
      /** Option name */
      name?: string;
      /** Price difference in cents */
      priceDelta?: number;
      /** Whether option is available */
      isAvailable?: boolean;
    }[];
  }[];
  /** Product addon groups (optional) */
  addonGroups?: {
    /** Addon group ID */
    id?: string;
    /** Addon group name */
    name?: string;
    /** Minimum selectable options */
    minSelectable?: number;
    /** Maximum selectable options */
    maxSelectable?: number;
    options?: {
      /** Option ID */
      id?: string;
      /** Option name */
      name?: string;
      /** Price difference in cents */
      priceDelta?: number;
      /** Whether option is available */
      isAvailable?: boolean;
    }[];
  }[];
  /** Whether product is available */
  isAvailable?: boolean;
  /** Whether product is deleted */
  isDeleted?: boolean;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
};
export type ProductsResponse = ProductResponse[];
export type CreateProductRequest = {
  /** Shop ID that owns this product */
  shopId: string;
  /** Product name */
  name: string;
  /** Product description */
  description: string;
  /** Product price in cents */
  price: number;
  /** Sort order for display */
  sortOrder?: number;
  /** Category IDs */
  categoryIds?: string[];
  images?: {
    id?: string;
    url?: string;
    isPrimary?: boolean;
  }[];
  /** Allergy information */
  allergyInfo?: string[];
  /** Whether product is available */
  isAvailable?: boolean;
};
export type UpdateProductRequest = {
  /** Shop ID (required for partition key) */
  shopId?: string;
  /** Product name */
  name?: string;
  /** Product description */
  description?: string;
  /** Product price in cents */
  price?: number;
  /** Sort order for display */
  sortOrder?: number;
  /** Category IDs */
  categoryIds?: string[];
  images?: {
    id?: string;
    url?: string;
    isPrimary?: boolean;
  }[];
  /** Allergy information */
  allergyInfo?: string[];
  /** Whether product is available */
  isAvailable?: boolean;
};
export const {
  usePostShopsMutation,
  useGetShopsSlugBySlugQuery,
  useGetShopsByShopIdQuery,
  usePatchShopsByShopIdMutation,
  useDeleteShopsByShopIdMutation,
  useGetShopsByShopIdCategoriesQuery,
  usePostShopsByShopIdCategoriesMutation,
  useGetShopsByShopIdCategoriesAndCategoryIdQuery,
  usePatchShopsByShopIdCategoriesAndCategoryIdMutation,
  useDeleteShopsByShopIdCategoriesAndCategoryIdMutation,
  useGetProductsQuery,
  usePostProductsMutation,
  useGetProductsByProductIdQuery,
  usePatchProductsByProductIdMutation,
  useDeleteProductsByProductIdMutation,
} = injectedRtkApi;
