import { emptyApi as api } from './emptyApi';
export const addTagTypes = [
  'Shops',
  'Shop Members',
  'Products',
  'Categories',
  'Orders',
  'Users',
  'Shop Hours',
  'Audit Logs',
  'Docs',
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      shopsList: build.query<ShopsListApiResponse, ShopsListApiArg>({
        query: () => ({ url: `/shops` }),
        providesTags: ['Shops'],
      }),
      shopsCreate: build.mutation<ShopsCreateApiResponse, ShopsCreateApiArg>({
        query: (queryArg) => ({
          url: `/shops`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Shops'],
      }),
      shopsGet: build.query<ShopsGetApiResponse, ShopsGetApiArg>({
        query: (queryArg) => ({ url: `/shops/${queryArg}` }),
        providesTags: ['Shops'],
      }),
      shopsUpdate: build.mutation<ShopsUpdateApiResponse, ShopsUpdateApiArg>({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}`,
          method: 'PATCH',
          body: queryArg.shopUpdateInput,
        }),
        invalidatesTags: ['Shops'],
      }),
      shopsDelete: build.mutation<ShopsDeleteApiResponse, ShopsDeleteApiArg>({
        query: (queryArg) => ({ url: `/shops/${queryArg}`, method: 'DELETE' }),
        invalidatesTags: ['Shops'],
      }),
      shopMembersList: build.query<
        ShopMembersListApiResponse,
        ShopMembersListApiArg
      >({
        query: (queryArg) => ({ url: `/shops/${queryArg}/members` }),
        providesTags: ['Shop Members'],
      }),
      shopMembersCreate: build.mutation<
        ShopMembersCreateApiResponse,
        ShopMembersCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/members`,
          method: 'POST',
          body: queryArg.shopMemberInviteInput,
        }),
        invalidatesTags: ['Shop Members'],
      }),
      shopMembersUpdate: build.mutation<
        ShopMembersUpdateApiResponse,
        ShopMembersUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/members/${queryArg.memberId}`,
          method: 'PATCH',
          body: queryArg.shopMemberUpdateInput,
        }),
        invalidatesTags: ['Shop Members'],
      }),
      usersListManagedShops: build.query<
        UsersListManagedShopsApiResponse,
        UsersListManagedShopsApiArg
      >({
        query: (queryArg) => ({ url: `/users/${queryArg}/shops` }),
        providesTags: ['Shops'],
      }),
      shopsMenu: build.query<ShopsMenuApiResponse, ShopsMenuApiArg>({
        query: (queryArg) => ({ url: `/shops/${queryArg}/menu` }),
        providesTags: ['Shops'],
      }),
      shopsGetBySlug: build.query<
        ShopsGetBySlugApiResponse,
        ShopsGetBySlugApiArg
      >({
        query: (queryArg) => ({ url: `/shops/slug/${queryArg}` }),
        providesTags: ['Shops'],
      }),
      shopMembersListAll: build.query<
        ShopMembersListAllApiResponse,
        ShopMembersListAllApiArg
      >({
        query: (queryArg) => ({
          url: `/shopMembers`,
          params: {
            shopId: queryArg,
          },
        }),
        providesTags: ['Shop Members'],
      }),
      shopMembersCreateGeneral: build.mutation<
        ShopMembersCreateGeneralApiResponse,
        ShopMembersCreateGeneralApiArg
      >({
        query: (queryArg) => ({
          url: `/shopMembers`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Shop Members'],
      }),
      shopMembersGet: build.query<
        ShopMembersGetApiResponse,
        ShopMembersGetApiArg
      >({
        query: (queryArg) => ({ url: `/shopMembers/${queryArg}` }),
        providesTags: ['Shop Members'],
      }),
      shopMembersUpdateGeneral: build.mutation<
        ShopMembersUpdateGeneralApiResponse,
        ShopMembersUpdateGeneralApiArg
      >({
        query: (queryArg) => ({
          url: `/shopMembers/${queryArg.memberId}`,
          method: 'PATCH',
          body: queryArg.shopMemberGeneralUpdateInput,
        }),
        invalidatesTags: ['Shop Members'],
      }),
      shopMembersDeleteGeneral: build.mutation<
        ShopMembersDeleteGeneralApiResponse,
        ShopMembersDeleteGeneralApiArg
      >({
        query: (queryArg) => ({
          url: `/shopMembers/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Shop Members'],
      }),
      productsListByShop: build.query<
        ProductsListByShopApiResponse,
        ProductsListByShopApiArg
      >({
        query: (queryArg) => ({
          url: `/products`,
          params: {
            shopId: queryArg,
          },
        }),
        providesTags: ['Products'],
      }),
      productsCreate: build.mutation<
        ProductsCreateApiResponse,
        ProductsCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/products`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Products'],
      }),
      productsGet: build.query<ProductsGetApiResponse, ProductsGetApiArg>({
        query: (queryArg) => ({ url: `/products/${queryArg}` }),
        providesTags: ['Products'],
      }),
      productsUpdate: build.mutation<
        ProductsUpdateApiResponse,
        ProductsUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/products/${queryArg.productId}`,
          method: 'PATCH',
          body: queryArg.productUpdateInput,
        }),
        invalidatesTags: ['Products'],
      }),
      productsDelete: build.mutation<
        ProductsDeleteApiResponse,
        ProductsDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/products/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Products'],
      }),
      categoriesList: build.query<
        CategoriesListApiResponse,
        CategoriesListApiArg
      >({
        query: () => ({ url: `/categories` }),
        providesTags: ['Categories'],
      }),
      categoriesCreate: build.mutation<
        CategoriesCreateApiResponse,
        CategoriesCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/categories`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Categories'],
      }),
      categoriesGet: build.query<CategoriesGetApiResponse, CategoriesGetApiArg>(
        {
          query: (queryArg) => ({ url: `/categories/${queryArg}` }),
          providesTags: ['Categories'],
        },
      ),
      categoriesUpdate: build.mutation<
        CategoriesUpdateApiResponse,
        CategoriesUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/categories/${queryArg.categoryId}`,
          method: 'PATCH',
          body: queryArg.categoryInput,
        }),
        invalidatesTags: ['Categories'],
      }),
      categoriesDelete: build.mutation<
        CategoriesDeleteApiResponse,
        CategoriesDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/categories/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Categories'],
      }),
      ordersCreate: build.mutation<OrdersCreateApiResponse, OrdersCreateApiArg>(
        {
          query: (queryArg) => ({
            url: `/shops/${queryArg.shopId}/orders`,
            method: 'POST',
            body: queryArg.createOrderInput,
          }),
          invalidatesTags: ['Orders'],
        },
      ),
      ordersListByShop: build.query<
        OrdersListByShopApiResponse,
        OrdersListByShopApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/orders`,
          params: {
            status: queryArg.status,
          },
        }),
        providesTags: ['Orders'],
      }),
      ordersUpdateStatus: build.mutation<
        OrdersUpdateStatusApiResponse,
        OrdersUpdateStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/shops/${queryArg.shopId}/orders/${queryArg.orderId}/status`,
          method: 'PATCH',
          body: queryArg.updateOrderStatusInput,
        }),
        invalidatesTags: ['Orders'],
      }),
      ordersListAll: build.query<OrdersListAllApiResponse, OrdersListAllApiArg>(
        {
          query: (queryArg) => ({
            url: `/orders`,
            params: {
              shopId: queryArg.shopId,
              userId: queryArg.userId,
            },
          }),
          providesTags: ['Orders'],
        },
      ),
      ordersGet: build.query<OrdersGetApiResponse, OrdersGetApiArg>({
        query: (queryArg) => ({ url: `/orders/${queryArg}` }),
        providesTags: ['Orders'],
      }),
      ordersUpdate: build.mutation<OrdersUpdateApiResponse, OrdersUpdateApiArg>(
        {
          query: (queryArg) => ({
            url: `/orders/${queryArg.orderId}`,
            method: 'PATCH',
            body: queryArg.order,
          }),
          invalidatesTags: ['Orders'],
        },
      ),
      ordersDelete: build.mutation<OrdersDeleteApiResponse, OrdersDeleteApiArg>(
        {
          query: (queryArg) => ({
            url: `/orders/${queryArg}`,
            method: 'DELETE',
          }),
          invalidatesTags: ['Orders'],
        },
      ),
      usersList: build.query<UsersListApiResponse, UsersListApiArg>({
        query: () => ({ url: `/users` }),
        providesTags: ['Users'],
      }),
      usersCreate: build.mutation<UsersCreateApiResponse, UsersCreateApiArg>({
        query: (queryArg) => ({
          url: `/users`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Users'],
      }),
      usersGet: build.query<UsersGetApiResponse, UsersGetApiArg>({
        query: (queryArg) => ({ url: `/users/${queryArg}` }),
        providesTags: ['Users'],
      }),
      usersUpdate: build.mutation<UsersUpdateApiResponse, UsersUpdateApiArg>({
        query: (queryArg) => ({
          url: `/users/${queryArg.userId}`,
          method: 'PATCH',
          body: queryArg.user,
        }),
        invalidatesTags: ['Users'],
      }),
      usersDelete: build.mutation<UsersDeleteApiResponse, UsersDeleteApiArg>({
        query: (queryArg) => ({ url: `/users/${queryArg}`, method: 'DELETE' }),
        invalidatesTags: ['Users'],
      }),
      shopHoursList: build.query<ShopHoursListApiResponse, ShopHoursListApiArg>(
        {
          query: (queryArg) => ({
            url: `/shopHours`,
            params: {
              shopId: queryArg,
            },
          }),
          providesTags: ['Shop Hours'],
        },
      ),
      shopHoursCreate: build.mutation<
        ShopHoursCreateApiResponse,
        ShopHoursCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/shopHours`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Shop Hours'],
      }),
      shopHoursGet: build.query<ShopHoursGetApiResponse, ShopHoursGetApiArg>({
        query: (queryArg) => ({ url: `/shopHours/${queryArg}` }),
        providesTags: ['Shop Hours'],
      }),
      shopHoursUpdate: build.mutation<
        ShopHoursUpdateApiResponse,
        ShopHoursUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/shopHours/${queryArg.recordId}`,
          method: 'PATCH',
          body: queryArg.shopHoursPayload,
        }),
        invalidatesTags: ['Shop Hours'],
      }),
      shopHoursDelete: build.mutation<
        ShopHoursDeleteApiResponse,
        ShopHoursDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/shopHours/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Shop Hours'],
      }),
      auditLogsList: build.query<AuditLogsListApiResponse, AuditLogsListApiArg>(
        {
          query: (queryArg) => ({
            url: `/auditLogs`,
            params: {
              shopId: queryArg.shopId,
              entityType: queryArg.entityType,
              entityId: queryArg.entityId,
            },
          }),
          providesTags: ['Audit Logs'],
        },
      ),
      auditLogsCreate: build.mutation<
        AuditLogsCreateApiResponse,
        AuditLogsCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/auditLogs`,
          method: 'POST',
          body: queryArg,
        }),
        invalidatesTags: ['Audit Logs'],
      }),
      auditLogsGet: build.query<AuditLogsGetApiResponse, AuditLogsGetApiArg>({
        query: (queryArg) => ({ url: `/auditLogs/${queryArg}` }),
        providesTags: ['Audit Logs'],
      }),
      auditLogsUpdate: build.mutation<
        AuditLogsUpdateApiResponse,
        AuditLogsUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/auditLogs/${queryArg.logId}`,
          method: 'PATCH',
          body: queryArg.auditLogCreateInput,
        }),
        invalidatesTags: ['Audit Logs'],
      }),
      auditLogsDelete: build.mutation<
        AuditLogsDeleteApiResponse,
        AuditLogsDeleteApiArg
      >({
        query: (queryArg) => ({
          url: `/auditLogs/${queryArg}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Audit Logs'],
      }),
      swaggerJson: build.query<SwaggerJsonApiResponse, SwaggerJsonApiArg>({
        query: () => ({ url: `/swagger.json` }),
        providesTags: ['Docs'],
      }),
      swaggerUi: build.query<SwaggerUiApiResponse, SwaggerUiApiArg>({
        query: () => ({ url: `/swagger` }),
        providesTags: ['Docs'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type ShopsListApiResponse = /** status 200 Array of shops */ Shop[];
export type ShopsListApiArg = void;
export type ShopsCreateApiResponse = /** status 201 Created shop */ Shop;
export type ShopsCreateApiArg = ShopInput;
export type ShopsGetApiResponse = /** status 200 Shop details */ Shop;
export type ShopsGetApiArg = string;
export type ShopsUpdateApiResponse = /** status 200 Updated shop */ Shop;
export type ShopsUpdateApiArg = {
  shopId: string;
  shopUpdateInput: ShopUpdateInput;
};
export type ShopsDeleteApiResponse = unknown;
export type ShopsDeleteApiArg = string;
export type ShopMembersListApiResponse = /** status 200 Members */ ShopMember[];
export type ShopMembersListApiArg = string;
export type ShopMembersCreateApiResponse =
  /** status 201 Created member */ ShopMember;
export type ShopMembersCreateApiArg = {
  shopId: string;
  shopMemberInviteInput: ShopMemberInviteInput;
};
export type ShopMembersUpdateApiResponse =
  /** status 200 Updated member */ ShopMember;
export type ShopMembersUpdateApiArg = {
  shopId: string;
  memberId: string;
  shopMemberUpdateInput: ShopMemberUpdateInput;
};
export type UsersListManagedShopsApiResponse =
  /** status 200 Managed shops */ ManagedShopView[];
export type UsersListManagedShopsApiArg = string;
export type ShopsMenuApiResponse = /** status 200 Menu */ ShopMenuDto;
export type ShopsMenuApiArg = string;
export type ShopsGetBySlugApiResponse = /** status 200 Shop */ Shop;
export type ShopsGetBySlugApiArg = string;
export type ShopMembersListAllApiResponse =
  /** status 200 Members */ ShopMember[];
export type ShopMembersListAllApiArg = string | undefined;
export type ShopMembersCreateGeneralApiResponse =
  /** status 201 Created member */ ShopMember;
export type ShopMembersCreateGeneralApiArg = ShopMemberGeneralCreateInput;
export type ShopMembersGetApiResponse =
  /** status 200 Member record */ ShopMember;
export type ShopMembersGetApiArg = string;
export type ShopMembersUpdateGeneralApiResponse =
  /** status 200 Updated member */ ShopMember;
export type ShopMembersUpdateGeneralApiArg = {
  memberId: string;
  shopMemberGeneralUpdateInput: ShopMemberGeneralUpdateInput;
};
export type ShopMembersDeleteGeneralApiResponse = unknown;
export type ShopMembersDeleteGeneralApiArg = string;
export type ProductsListByShopApiResponse =
  /** status 200 Products for the shop */ ProductDto[];
export type ProductsListByShopApiArg =
  /** Shop id to scope products to */ string;
export type ProductsCreateApiResponse =
  /** status 201 Created product */ ProductDto;
export type ProductsCreateApiArg = ProductCreateInput;
export type ProductsGetApiResponse = /** status 200 Product */ ProductDto;
export type ProductsGetApiArg = string;
export type ProductsUpdateApiResponse =
  /** status 200 Updated product */ ProductDto;
export type ProductsUpdateApiArg = {
  productId: string;
  productUpdateInput: ProductUpdateInput;
};
export type ProductsDeleteApiResponse = unknown;
export type ProductsDeleteApiArg = string;
export type CategoriesListApiResponse =
  /** status 200 Categories */ ProductCategory[];
export type CategoriesListApiArg = void;
export type CategoriesCreateApiResponse =
  /** status 201 Created category */ ProductCategory;
export type CategoriesCreateApiArg = CategoryInput;
export type CategoriesGetApiResponse =
  /** status 200 Category */ ProductCategory;
export type CategoriesGetApiArg = string;
export type CategoriesUpdateApiResponse =
  /** status 200 Updated category */ ProductCategory;
export type CategoriesUpdateApiArg = {
  categoryId: string;
  categoryInput: CategoryInput;
};
export type CategoriesDeleteApiResponse = unknown;
export type CategoriesDeleteApiArg = string;
export type OrdersCreateApiResponse = /** status 201 Created order */ Order;
export type OrdersCreateApiArg = {
  shopId: string;
  createOrderInput: CreateOrderInput;
};
export type OrdersListByShopApiResponse = /** status 200 Orders */ Order[];
export type OrdersListByShopApiArg = {
  shopId: string;
  /** Comma-separated statuses to filter by */
  status?: string;
};
export type OrdersUpdateStatusApiResponse =
  /** status 200 Updated order */ Order;
export type OrdersUpdateStatusApiArg = {
  shopId: string;
  orderId: string;
  updateOrderStatusInput: UpdateOrderStatusInput;
};
export type OrdersListAllApiResponse = /** status 200 Orders */ Order[];
export type OrdersListAllApiArg = {
  shopId?: string;
  userId?: string;
};
export type OrdersGetApiResponse = /** status 200 Order */ Order;
export type OrdersGetApiArg = string;
export type OrdersUpdateApiResponse = /** status 200 Updated order */ Order;
export type OrdersUpdateApiArg = {
  orderId: string;
  order: Order;
};
export type OrdersDeleteApiResponse = unknown;
export type OrdersDeleteApiArg = string;
export type UsersListApiResponse = /** status 200 Users */ User[];
export type UsersListApiArg = void;
export type UsersCreateApiResponse = /** status 201 Created user */ User;
export type UsersCreateApiArg = UserCreateInput;
export type UsersGetApiResponse = /** status 200 User */ User;
export type UsersGetApiArg = string;
export type UsersUpdateApiResponse = /** status 200 Updated user */ User;
export type UsersUpdateApiArg = {
  userId: string;
  user: User;
};
export type UsersDeleteApiResponse = unknown;
export type UsersDeleteApiArg = string;
export type ShopHoursListApiResponse =
  /** status 200 Shop hours records */ ShopHours[];
export type ShopHoursListApiArg = string | undefined;
export type ShopHoursCreateApiResponse =
  /** status 201 Created record */ ShopHours;
export type ShopHoursCreateApiArg = ShopHoursPayload;
export type ShopHoursGetApiResponse = /** status 200 Record */ ShopHours;
export type ShopHoursGetApiArg = string;
export type ShopHoursUpdateApiResponse =
  /** status 200 Updated record */ ShopHours;
export type ShopHoursUpdateApiArg = {
  recordId: string;
  shopHoursPayload: ShopHoursPayload;
};
export type ShopHoursDeleteApiResponse = unknown;
export type ShopHoursDeleteApiArg = string;
export type AuditLogsListApiResponse = /** status 200 Audit logs */ AuditLog[];
export type AuditLogsListApiArg = {
  shopId?: string;
  entityType?: string;
  entityId?: string;
};
export type AuditLogsCreateApiResponse =
  /** status 201 Created audit log */ AuditLog;
export type AuditLogsCreateApiArg = AuditLogCreateInput;
export type AuditLogsGetApiResponse =
  /** status 200 Audit log entry */ AuditLog;
export type AuditLogsGetApiArg = string;
export type AuditLogsUpdateApiResponse =
  /** status 200 Updated entry */ AuditLog;
export type AuditLogsUpdateApiArg = {
  logId: string;
  auditLogCreateInput: AuditLogCreateInput;
};
export type AuditLogsDeleteApiResponse = unknown;
export type AuditLogsDeleteApiArg = string;
export type SwaggerJsonApiResponse = /** status 200 OpenAPI JSON */ object;
export type SwaggerJsonApiArg = void;
export type SwaggerUiApiResponse = unknown;
export type SwaggerUiApiArg = void;
export type ShopStatus = 'draft' | 'open' | 'closed' | 'suspended';
export type Shop = {
  id: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  timezone?: string;
  address?: string;
  fulfillment: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryRadiusKm?: number;
    deliveryFee?: number;
  };
  updatedAt: string;
};
export type ValidationError = {
  message: string;
  errors: {
    path: string;
    message: string;
  }[];
};
export type ApiError = {
  message: string;
  code?: string;
  details?: any;
};
export type PaymentPolicy = 'pay_on_pickup' | 'prepaid_only';
export type OrderAcceptanceMode = 'auto' | 'manual';
export type Money = {
  amount: number;
  currency: string;
};
export type FulfillmentOptions = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: Money;
  leadTimeMinutes?: number;
};
export type ShopInput = {
  name: string;
  slug: string;
  ownerUserId: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: PaymentPolicy;
  orderAcceptanceMode?: OrderAcceptanceMode;
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: FulfillmentOptions;
  defaultCurrency?: string;
};
export type ShopUpdateInput = {
  name?: string;
  slug?: string;
  legalName?: string;
  address?: string;
  timezone?: string;
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: PaymentPolicy;
  orderAcceptanceMode?: OrderAcceptanceMode;
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: FulfillmentOptions;
  defaultCurrency?: string;
};
export type DocumentBase = {
  id: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  version?: number;
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
};
export type ShopMemberRole = 'owner' | 'manager' | 'staff' | 'viewer';
export type ShopMember = DocumentBase & {
  shopId: string;
  userId: string;
  role: ShopMemberRole;
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  invitedByUserId?: string;
  isActive: boolean;
};
export type ShopMemberInviteInput = {
  userId: string;
  role: ShopMemberRole;
  invitedByUserId?: string;
};
export type ShopMemberUpdateInput = {
  role?: ShopMemberRole;
  isActive?: boolean;
};
export type ManagedShopView = {
  shopId: string;
  name: string;
  status: ShopStatus;
  acceptingOrders: boolean;
  role: ShopMemberRole;
};
export type MenuCategory = {
  id: string;
  shopId?: string;
  name: string;
  description?: string;
  position?: number;
  isActive: boolean;
  parentCategoryId?: string;
};
export type ProductDtoCategory = {
  id: string;
  name: string;
};
export type ProductDtoVariantOption = {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
};
export type ProductDtoVariant = {
  id: string;
  label: string;
  options: ProductDtoVariantOption[];
};
export type ProductDtoAddonOption = {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
};
export type ProductDtoAddon = {
  id: string;
  label: string;
  options: ProductDtoAddonOption[];
};
export type ProductDto = {
  id: string;
  label: string;
  description?: string;
  isAvailable: boolean;
  price: number;
  categories: ProductDtoCategory[];
  variantTypes: ProductDtoVariant[];
  addons: ProductDtoAddon[];
};
export type ShopMenuDto = {
  categories: MenuCategory[];
  products: ProductDto[];
};
export type ShopMemberGeneralCreateInput = {
  shopId: string;
  userId: string;
  role?: ShopMemberRole;
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  invitedByUserId?: string;
  isActive?: boolean;
};
export type ShopMemberGeneralUpdateInput = {
  shopId?: string;
  userId?: string;
  role?: ShopMemberRole;
  invitationStatus?: 'pending' | 'accepted' | 'revoked';
  invitedByUserId?: string;
  isActive?: boolean;
};
export type MoneyInput = {
  amount: number;
  currency?: string;
};
export type ProductVariantPayload = {
  id?: string;
  label: string;
  priceDelta: MoneyInput;
  isAvailable?: boolean;
};
export type ProductVariantGroupPayload = {
  id?: string;
  label: string;
  options: ProductVariantPayload[];
};
export type ProductAddonOptionPayload = {
  id?: string;
  label: string;
  priceDelta: MoneyInput;
  isAvailable?: boolean;
};
export type ProductAddonGroupPayload = {
  id?: string;
  label: string;
  required?: boolean;
  maxSelectable?: number;
  options: ProductAddonOptionPayload[];
};
export type ProductCreateInput = {
  shopId: string;
  ownerUserId?: string;
  label: string;
  price: number;
  description?: string;
  categories?: string[];
  tags?: string[];
  media?: {
    url: string;
    alt?: string;
    kind?: 'image' | 'video';
  }[];
  allergyInfo?: string[];
  variantGroups: ProductVariantGroupPayload[];
  addonGroups: ProductAddonGroupPayload[];
  isAvailable?: boolean;
};
export type ProductUpdateInput = {
  shopId?: string;
  ownerUserId?: string;
  label?: string;
  price?: number;
  description?: string;
  categories?: string[];
  tags?: string[];
  media?: {
    url: string;
    alt?: string;
    kind?: 'image' | 'video';
  }[];
  allergyInfo?: string[];
  variantGroups?: ProductVariantGroupPayload[];
  addonGroups?: ProductAddonGroupPayload[];
  isAvailable?: boolean;
};
export type ProductCategory = DocumentBase & {
  name: string;
  description?: string;
  position?: number;
  isActive: boolean;
  parentCategoryId?: string;
};
export type CategoryInput = {
  name: string;
  description?: string;
  parentCategoryId?: string;
  position?: number;
  isActive?: boolean;
};
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'rejected'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded';
export type OrderItemAddonSnapshot = {
  addonOptionId: string;
  nameSnapshot: string;
  priceDeltaSnapshot: Money;
};
export type OrderItem = {
  productId: string;
  productVariantId: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  finalUnitPrice: Money;
  quantity: number;
  addons: OrderItemAddonSnapshot[];
};
export type Order = DocumentBase & {
  shopId: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: Money;
  submittedAt: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  fulfillmentSlot?: {
    type?: 'pickup' | 'delivery';
    scheduledFor?: string;
  };
  items: OrderItem[];
};
export type OrderItemInput = {
  productId: string;
  productVariantId: string;
  quantity: number;
  addonOptionIds?: string[];
};
export type CreateOrderInput = {
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: OrderItemInput[];
  fulfillmentType?: 'pickup' | 'delivery';
  scheduledFor?: string;
};
export type UpdateOrderStatusInput = {
  nextStatus: OrderStatus;
};
export type User = {
  id: string;
};
export type UserCreateInput = {
  id: string;
};
export type ShopHoursWindow = {
  opensAt: string;
  closesAt: string;
  isClosed?: boolean;
};
export type ShopHours = DocumentBase & {
  shopId: string;
  timezone: string;
  weekly: {
    [key: string]: ShopHoursWindow[];
  };
};
export type ShopHoursPayload = {
  shopId: string;
  timezone: string;
  weekly?: {
    [key: string]: ShopHoursWindow[];
  };
};
export type PrincipalRef = {
  type: 'user' | 'role' | 'service' | 'apiKey';
  id: string;
  scope?: string;
};
export type AuditLog = DocumentBase & {
  actor: PrincipalRef;
  shopId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
};
export type AuditLogCreateInput = {
  actor?: PrincipalRef;
  actorUserId?: string;
  shopId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
};
export const {
  useShopsListQuery,
  useShopsCreateMutation,
  useShopsGetQuery,
  useShopsUpdateMutation,
  useShopsDeleteMutation,
  useShopMembersListQuery,
  useShopMembersCreateMutation,
  useShopMembersUpdateMutation,
  useUsersListManagedShopsQuery,
  useShopsMenuQuery,
  useShopsGetBySlugQuery,
  useShopMembersListAllQuery,
  useShopMembersCreateGeneralMutation,
  useShopMembersGetQuery,
  useShopMembersUpdateGeneralMutation,
  useShopMembersDeleteGeneralMutation,
  useProductsListByShopQuery,
  useProductsCreateMutation,
  useProductsGetQuery,
  useProductsUpdateMutation,
  useProductsDeleteMutation,
  useCategoriesListQuery,
  useCategoriesCreateMutation,
  useCategoriesGetQuery,
  useCategoriesUpdateMutation,
  useCategoriesDeleteMutation,
  useOrdersCreateMutation,
  useOrdersListByShopQuery,
  useOrdersUpdateStatusMutation,
  useOrdersListAllQuery,
  useOrdersGetQuery,
  useOrdersUpdateMutation,
  useOrdersDeleteMutation,
  useUsersListQuery,
  useUsersCreateMutation,
  useUsersGetQuery,
  useUsersUpdateMutation,
  useUsersDeleteMutation,
  useShopHoursListQuery,
  useShopHoursCreateMutation,
  useShopHoursGetQuery,
  useShopHoursUpdateMutation,
  useShopHoursDeleteMutation,
  useAuditLogsListQuery,
  useAuditLogsCreateMutation,
  useAuditLogsGetQuery,
  useAuditLogsUpdateMutation,
  useAuditLogsDeleteMutation,
  useSwaggerJsonQuery,
  useSwaggerUiQuery,
} = injectedRtkApi;
