import { baseApi as api } from './baseApi';
export const addTagTypes = [
  'Shops',
  'Categories',
  'Products',
  'Product Images',
  'Orders',
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getShops: build.query<GetShopsApiResponse, GetShopsApiArg>({
        query: () => ({ url: `/shops` }),
        providesTags: ['Shops'],
      }),
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
      getShopsMe: build.query<GetShopsMeApiResponse, GetShopsMeApiArg>({
        query: () => ({ url: `/shops/me` }),
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
      postShopsByShopIdProductsAndProductIdImagesUploadUrl: build.mutation<
        PostShopsByShopIdProductsAndProductIdImagesUploadUrlApiResponse,
        PostShopsByShopIdProductsAndProductIdImagesUploadUrlApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/products/${queryArg.productId}/images/upload-url`,
          method: 'POST',
          body: queryArg.generateImageUploadUrlRequest,
        }),
        invalidatesTags: ['Product Images'],
      }),
      postShopsByShopIdProductsAndProductIdImages: build.mutation<
        PostShopsByShopIdProductsAndProductIdImagesApiResponse,
        PostShopsByShopIdProductsAndProductIdImagesApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/products/${queryArg.productId}/images`,
          method: 'POST',
          body: queryArg.addProductImageRequest,
        }),
        invalidatesTags: ['Product Images'],
      }),
      postOrders: build.mutation<PostOrdersApiResponse, PostOrdersApiArg>({
        query: (queryArg) => ({
          url: `/orders`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Orders'],
      }),
      postWebhooksStripe: build.mutation<
        PostWebhooksStripeApiResponse,
        PostWebhooksStripeApiArg
      >({
        query: (queryArg) => ({
          url: `/webhooks/stripe`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Orders'],
      }),
      getOrdersByPaymentIntentByPaymentIntentId: build.query<
        GetOrdersByPaymentIntentByPaymentIntentIdApiResponse,
        GetOrdersByPaymentIntentByPaymentIntentIdApiArg
      >({
        query: (queryArg) => ({ url: `/orders/by-payment-intent/${queryArg}` }),
        providesTags: ['Orders'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type GetShopsApiResponse =
  /** status 200 List of all shops retrieved successfully */ GetAllShopsResponse;
export type GetShopsApiArg = void;
export type PostShopsApiResponse =
  /** status 200 Shop created successfully */ ShopResponse;
export type PostShopsApiArg = CreateShopRequest;
export type GetShopsSlugBySlugApiResponse =
  /** status 200 Shop retrieved successfully */ ShopResponse;
export type GetShopsSlugBySlugApiArg =
  /** Shop slug (public identifier) */ string;
export type GetShopsMeApiResponse =
  /** status 200 Shops where the user is an active owner member */ GetAllShopsResponse;
export type GetShopsMeApiArg = void;
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
export type PostShopsByShopIdProductsAndProductIdImagesUploadUrlApiResponse =
  /** status 200 Upload URL generated successfully */ GenerateImageUploadUrlResponse;
export type PostShopsByShopIdProductsAndProductIdImagesUploadUrlApiArg = {
  /** Shop ID */
  shopId: string;
  /** Product ID */
  productId: string;
  generateImageUploadUrlRequest: GenerateImageUploadUrlRequest;
};
export type PostShopsByShopIdProductsAndProductIdImagesApiResponse =
  /** status 200 Product image added successfully */ ProductImageResponse;
export type PostShopsByShopIdProductsAndProductIdImagesApiArg = {
  /** Shop ID */
  shopId: string;
  /** Product ID */
  productId: string;
  addProductImageRequest: AddProductImageRequest;
};
export type PostOrdersApiResponse =
  /** status 200 Order created and PaymentIntent initiated */ CheckoutResponse;
export type PostOrdersApiArg = CheckoutRequest;
export type PostWebhooksStripeApiResponse = /** status 200 Event received */ {
  received?: boolean;
};
export type PostWebhooksStripeApiArg = object;
export type GetOrdersByPaymentIntentByPaymentIntentIdApiResponse =
  /** status 200 Order found */ OrderByPaymentIntentResponse;
export type GetOrdersByPaymentIntentByPaymentIntentIdApiArg =
  /** Stripe PaymentIntent ID (starts with pi_) */ string;
export type ShopBranding = {
  /** Logo URL (must start with https://) */
  logoUrl?: string | null;
  /** Hero image URL (must start with https://) */
  heroImageUrl?: string | null;
  colors: {
    /** Primary brand color (hex) */
    primary: string;
    /** Secondary brand color (hex) */
    secondary: string;
    /** Tertiary brand color (hex) */
    tertiary: string;
    /** Background color (hex) */
    background: string;
  };
} | null;
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
  /** Shop branding configuration, or null if not configured. */
  branding?: ShopBranding;
};
export type GetAllShopsResponse = {
  /** Array of shops */
  shops: ShopResponse[];
  /** Total number of shops */
  total: number;
};
export type CreateShopRequest = {
  /** Shop name (slug will be auto-generated from this) */
  name: string;
  /** Shop currency (ISO code) */
  currency: string;
  /** Shop timezone */
  timezone: string;
  /** Minimum order amount in cents */
  minOrderAmountCents: number;
  /** Payment policy */
  paymentPolicy: 'pay_online';
  address: {
    /** Street address */
    street: string;
    /** City */
    city: string;
    /** State or territory */
    state: string;
    /** Postal code */
    postcode: string;
    /** Country */
    country: string;
  };
  /** Message when shop is paused (optional) */
  pausedMessage?: string;
  /** Order acceptance mode (optional, defaults to auto) */
  orderAcceptanceMode?: 'auto';
  /** Shop opening hours for each day of the week. At least one day must have opening hours. */
  openingHours: {
    /** Monday opening hours */
    mon?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
      close?: string;
    }[];
    /** Tuesday opening hours */
    tue?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
      close?: string;
    }[];
    /** Wednesday opening hours */
    wed?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
      close?: string;
    }[];
    /** Thursday opening hours */
    thu?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
      close?: string;
    }[];
    /** Friday opening hours */
    fri?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
      close?: string;
    }[];
    /** Saturday opening hours */
    sat?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
      close?: string;
    }[];
    /** Sunday opening hours */
    sun?: {
      /** Opening time in 24-hour format (HH:MM) */
      open?: string;
      /** Closing time in 24-hour format (HH:MM) */
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
  /** Shop branding configuration (optional). Set to null to disable branding. */
  branding?: ShopBranding;
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
  /** Shop branding configuration. Set to null to clear branding. */
  branding?: ShopBranding;
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
  /** Sort order for display */
  sortOrder?: number;
};
export type UpdateCategoryRequest = {
  /** Category name */
  name?: string;
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
export type GenerateImageUploadUrlResponse = {
  /** Unique identifier for the image */
  imageId: string;
  /** Pre-signed URL for uploading the image to Azure Blob Storage */
  uploadUrl: string;
  /** Permanent URL of the blob (without SAS token) */
  blobUrl: string;
  /** Expiration time of the upload URL */
  expiresAt: string;
};
export type GenerateImageUploadUrlRequest = {
  /** MIME type of the image to upload */
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Optional filename for the image */
  fileName?: string;
  /** Optional maximum file size in bytes */
  maxSizeBytes?: number;
};
export type ProductImageResponse = {
  /** Image ID */
  id: string;
  /** Image URL */
  url: string;
  /** Alternative text for the image */
  alt?: string;
  /** Sort order for displaying images */
  sortOrder: number;
  /** Whether this is the primary product image */
  isPrimary: boolean;
};
export type AddProductImageRequest = {
  /** Image ID returned from the upload URL generation */
  imageId: string;
  /** Blob URL of the uploaded image */
  url: string;
  /** Alternative text for the image */
  alt?: string;
  /** Sort order for displaying images */
  sortOrder?: number;
};
export type CheckoutResponse = {
  /** Checkout session ID */
  sessionId: string;
  /** Stripe PaymentIntent client secret. Pass this to stripe.confirmPayment() on the frontend. */
  clientSecret: string;
  /** Server-computed order total in cents */
  subtotalCents: number;
  /** ISO currency code from the shop */
  currency: string;
};
export type CheckoutItem = {
  /** Product ID */
  productId: string;
  /** Quantity to order */
  quantity: number;
  /** ID of the selected variant option (e.g. size) */
  selectedVariantOptionId?: string;
  /** IDs of selected addon options */
  selectedAddonOptionIds?: string[];
};
export type CheckoutRequest = {
  /** ID of the shop to order from */
  shopId: string;
  /** Items to order */
  items: CheckoutItem[];
  /** Customer name */
  customerName: string;
  /** Customer email */
  customerEmail: string;
  /** Customer phone number */
  customerPhone: string;
  /** Optional notes for the order */
  customerNotes?: string;
};
export type OrderItemResponse = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  selectedVariantOptionId?: string | null;
  selectedAddonOptionIds?: string[] | null;
  lineTotalCents: number;
};
export type OrderByPaymentIntentResponse = {
  orderId: string;
  orderRef: string;
  status: 'pending_payment' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  items: OrderItemResponse[];
  subtotalCents: number;
  currency: string;
  customerName: string;
  createdAt: string;
};
export const {
  useGetShopsQuery,
  usePostShopsMutation,
  useGetShopsSlugBySlugQuery,
  useGetShopsMeQuery,
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
  usePostShopsByShopIdProductsAndProductIdImagesUploadUrlMutation,
  usePostShopsByShopIdProductsAndProductIdImagesMutation,
  usePostOrdersMutation,
  usePostWebhooksStripeMutation,
  useGetOrdersByPaymentIntentByPaymentIntentIdQuery,
} = injectedRtkApi;
