import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useMsal } from '@azure/msal-react';
import { skipToken } from '@reduxjs/toolkit/query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ORDER_ACCEPTANCE_MODES,
  PAYMENT_POLICIES,
  SHOP_STATUSES,
  type CreateShopRequest,
  type FulfillmentOptions,
  type OrderAcceptanceMode,
  type PaymentPolicy,
  type ShopSettingsUpdateRequest,
  type ShopStatus,
  type ShopSummary,
  type UserShopView,
} from '../../../types/apiTypes';
import {
  useShopsCreateMutation,
  useShopsDeleteMutation,
  useShopsGetByIdQuery,
  useShopsUpdateMutation,
  useUsersGetShopsQuery,
} from '../../../store/api/ownerApi';
import { useAppDispatch } from '../../../store/hooks';
import { syncAccessTokenFromMsal } from '../../../auth/syncAccessToken';

type ShopFormState = Omit<CreateShopRequest, 'ownerUserId'>;

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
};

const defaultFulfillment: FulfillmentOptions = {
  pickupEnabled: true,
  deliveryEnabled: false,
  deliveryRadiusKm: 0,
  deliveryFee: 0,
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const createDefaultShopForm = (): ShopFormState => ({
  name: '',
  slug: '',
  address: '',
  status: 'open',
  isActive: true,
  acceptingOrders: true,
  paymentPolicy: 'pay_on_pickup',
  orderAcceptanceMode: 'auto',
  allowGuestCheckout: true,
  fulfillmentOptions: { ...defaultFulfillment },
});

const ShopStatusBadge = ({ status }: { status: ShopStatus }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      statusStyles[status] ?? 'bg-gray-100 text-gray-700'
    }`}
  >
    {status.replace(/_/g, ' ')}
  </span>
);

const Modal = ({
  title,
  onClose,
  children,
  widthClass = 'max-w-3xl',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      className={`relative w-full ${widthClass} rounded-2xl bg-white shadow-2xl`}
    >
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          aria-label="Close dialog"
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
);

const normalizeFulfillment = (
  options: FulfillmentOptions
): FulfillmentOptions => ({
  pickupEnabled: options.pickupEnabled,
  deliveryEnabled: options.deliveryEnabled,
  deliveryRadiusKm:
    options.deliveryEnabled && typeof options.deliveryRadiusKm === 'number'
      ? options.deliveryRadiusKm
      : undefined,
  deliveryFee:
    options.deliveryEnabled && typeof options.deliveryFee === 'number'
      ? options.deliveryFee
      : undefined,
});

const mapSummaryToForm = (summary: ShopSummary): ShopFormState => ({
  name: summary.name,
  slug: summary.slug,
  address: summary.address,
  status: summary.status,
  isActive: summary.isActive,
  acceptingOrders: summary.acceptingOrders,
  paymentPolicy: summary.paymentPolicy,
  orderAcceptanceMode: summary.orderAcceptanceMode,
  allowGuestCheckout: summary.allowGuestCheckout,
  fulfillmentOptions: { ...summary.fulfillmentOptions },
});

const ShopsPage = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';

  const queryArg = ownerUserId ? { userId: ownerUserId } : skipToken;
  const {
    data: shops,
    isLoading,
    isError,
    refetch: refetchShops,
    isUninitialized,
  } = useUsersGetShopsQuery(queryArg);
  const [createShop, { isLoading: isCreating }] = useShopsCreateMutation();
  const [updateShop, { isLoading: isUpdating }] = useShopsUpdateMutation();
  const [deleteShop, { isLoading: isDeleting }] = useShopsDeleteMutation();

  const { instance } = useMsal();
  const dispatch = useAppDispatch();

  useEffect(() => {
    syncAccessTokenFromMsal(instance, dispatch).catch((err) => {
      console.error('Failed to sync access token:', err);
    });
  }, [instance, dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [creationError, setCreationError] = useState<string | null>(null);
  const [newShop, setNewShop] = useState<ShopFormState>(
    createDefaultShopForm()
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const editingQueryArg = editingShopId ?? skipToken;
  const { data: editingShopDetails } = useShopsGetByIdQuery(editingQueryArg);
  const [editForm, setEditForm] = useState<ShopFormState | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [pendingDeleteShop, setPendingDeleteShop] =
    useState<UserShopView | null>(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (editingShopDetails) {
      setEditForm(mapSummaryToForm(editingShopDetails));
      setEditError(null);
      setEditSuccess(null);
    }
  }, [editingShopDetails]);

  const applyEditFormUpdate: Dispatch<SetStateAction<ShopFormState>> = (
    update
  ) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      return typeof update === 'function'
        ? (update as (prev: ShopFormState) => ShopFormState)(prev)
        : update;
    });
  };

  const resolvedShops: UserShopView[] = shops ?? [];
  const filteredShops = useMemo(() => {
    if (!resolvedShops.length) return [];
    if (!searchTerm) return resolvedShops;
    const lower = searchTerm.toLowerCase();
    return resolvedShops.filter(
      (shop) =>
        shop?.name?.toLowerCase().includes(lower) ||
        shop.address?.toLowerCase().includes(lower)
    );
  }, [resolvedShops, searchTerm]);

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewShop(createDefaultShopForm());
    setCreationError(null);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const goToShopProducts = (shopId: string) => {
    navigate(`/owner/shops/${shopId}`);
  };

  const openEditModal = (shopId: string) => {
    setEditingShopId(shopId);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingShopId(null);
    setEditForm(null);
    setEditError(null);
    setEditSuccess(null);
  };

  const openDeleteModal = (shop: UserShopView) => {
    setPendingDeleteShop(shop);
    setDeleteStep(1);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setPendingDeleteShop(null);
    setDeleteStep(1);
    setDeleteError(null);
  };

  const handleCreateShop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ownerUserId) {
      setCreationError('A valid owner identity is required.');
      return;
    }
    if (!newShop.name.trim() || !newShop.address.trim()) {
      setCreationError('Name and address are required.');
      return;
    }
    const slug = resolveSlug(newShop.name, newShop.slug);
    if (!slug) {
      setCreationError('Slug is required.');
      return;
    }

    try {
      setCreationError(null);
      const payload: CreateShopRequest = {
        ...newShop,
        name: newShop.name.trim(),
        slug,
        address: newShop.address.trim(),
        ownerUserId,
        fulfillmentOptions: normalizeFulfillment(newShop.fulfillmentOptions),
      };
      await createShop(payload).unwrap();
      await refetchShops();
      closeCreateModal();
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : 'Unable to create shop. Please try again.'
      );
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingShopId || !editForm) return;
    try {
      setEditError(null);
      setEditSuccess(null);
      const slug = editForm.slug?.trim()
        ? resolveSlug(editForm.name ?? '', editForm.slug)
        : undefined;
      const payload: ShopSettingsUpdateRequest = {
        name: editForm.name?.trim(),
        slug,
        address: editForm.address?.trim(),
        status: editForm.status,
        isActive: editForm.isActive,
        acceptingOrders: editForm.acceptingOrders,
        paymentPolicy: editForm.paymentPolicy,
        orderAcceptanceMode: editForm.orderAcceptanceMode,
        allowGuestCheckout: editForm.allowGuestCheckout,
        fulfillmentOptions: normalizeFulfillment(editForm.fulfillmentOptions),
      };
      await updateShop({ shopId: editingShopId, body: payload }).unwrap();
      setEditSuccess('Shop updated successfully.');
      await refetchShops();
      closeEditModal();
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : 'Unable to update shop. Please try again.'
      );
    }
  };

  const handleFulfillmentChange = (
    setter: Dispatch<SetStateAction<ShopFormState>>,
    field: keyof FulfillmentOptions,
    value: boolean | number
  ) => {
    setter((prev) => ({
      ...prev,
      fulfillmentOptions: {
        ...prev.fulfillmentOptions,
        [field]:
          typeof value === 'number' ? (Number.isNaN(value) ? 0 : value) : value,
      },
    }));
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteShop) return;
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    try {
      setDeleteError(null);
      await deleteShop(pendingDeleteShop.shopId).unwrap();
      await refetchShops();
      closeDeleteModal();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete shop. Please try again.'
      );
    }
  };

  const renderBasicInfoFields = (
    form: ShopFormState,
    setForm: Dispatch<SetStateAction<ShopFormState>>,
    disabled?: boolean
  ) => (
    <div className="grid gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={(event) =>
            setForm((prev) => {
              const nextName = event.target.value;
              const prevSlugWasAuto =
                !prev.slug || prev.slug === toSlug(prev.name ?? '');
              return {
                ...prev,
                name: nextName,
                slug: prevSlugWasAuto ? toSlug(nextName) : prev.slug,
              };
            })
          }
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 lowercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.slug}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              slug: toSlug(event.target.value),
            }))
          }
          placeholder="my-shop-slug"
          required
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          Used in URLs, letters, and links. Only lowercase letters, numbers, and
          dashes are allowed.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.address}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              address: event.target.value,
            }))
          }
          required
          disabled={disabled}
        />
      </div>
    </div>
  );

  const renderOperationalFields = (
    form: ShopFormState,
    setForm: Dispatch<SetStateAction<ShopFormState>>,
    disabled?: boolean
  ) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.status}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              status: event.target.value as ShopStatus,
            }))
          }
          disabled={disabled}
        >
          {SHOP_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Order acceptance
        </label>
        <select
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.orderAcceptanceMode}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              orderAcceptanceMode: event.target.value as OrderAcceptanceMode,
            }))
          }
          disabled={disabled}
        >
          {ORDER_ACCEPTANCE_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Payment policy
        </label>
        <select
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.paymentPolicy}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              paymentPolicy: event.target.value as PaymentPolicy,
            }))
          }
          disabled={disabled}
        >
          {PAYMENT_POLICIES.map((policy) => (
            <option key={policy} value={policy}>
              {policy.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            form.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              isActive: !prev.isActive,
            }))
          }
          disabled={disabled}
        >
          {form.isActive ? 'Active' : 'Inactive'}
        </button>
        <button
          type="button"
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            form.acceptingOrders
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              acceptingOrders: !prev.acceptingOrders,
            }))
          }
          disabled={disabled}
        >
          {form.acceptingOrders ? 'Accepting orders' : 'Paused'}
        </button>
      </div>
    </div>
  );

  const renderFulfillmentFields = (
    form: ShopFormState,
    setForm: Dispatch<SetStateAction<ShopFormState>>,
    disabled?: boolean
  ) => (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={form.allowGuestCheckout}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              allowGuestCheckout: event.target.checked,
            }))
          }
          disabled={disabled}
        />
        Allow guest checkout
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={form.fulfillmentOptions.pickupEnabled}
          onChange={(event) =>
            handleFulfillmentChange(
              setForm,
              'pickupEnabled',
              event.target.checked
            )
          }
          disabled={disabled}
        />
        Pickup enabled
      </label>
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={form.fulfillmentOptions.deliveryEnabled}
            onChange={(event) =>
              handleFulfillmentChange(
                setForm,
                'deliveryEnabled',
                event.target.checked
              )
            }
            disabled={disabled}
          />
          Delivery enabled
        </label>
        {form.fulfillmentOptions.deliveryEnabled ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery radius (km)
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.fulfillmentOptions.deliveryRadiusKm ?? ''}
                onChange={(event) =>
                  handleFulfillmentChange(
                    setForm,
                    'deliveryRadiusKm',
                    Number(event.target.value)
                  )
                }
                disabled={disabled}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery fee
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.fulfillmentOptions.deliveryFee ?? ''}
                onChange={(event) =>
                  handleFulfillmentChange(
                    setForm,
                    'deliveryFee',
                    Number(event.target.value)
                  )
                }
                disabled={disabled}
                required
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Enable delivery to set radius and fees.
          </p>
        )}
      </div>
    </div>
  );

  const renderCreateFormSections = () => (
    <>
      <p className="text-sm text-gray-500">
        Provide the essentials to get this storefront live. You can fill in the
        rest after creation.
      </p>
      <div className="space-y-6">
        {renderBasicInfoFields(newShop, setNewShop, isCreating)}
        {renderOperationalFields(newShop, setNewShop, isCreating)}
        {renderFulfillmentFields(newShop, setNewShop, isCreating)}
      </div>
    </>
  );

  return (
    <section className="space-y-6">
      <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/owner" className="hover:text-gray-900">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li className="font-semibold text-gray-900">Shops</li>
        </ol>
      </nav>
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shops</h1>
          <p className="text-gray-600">
            Review, create, and refine storefronts linked to your owner account.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            className="w-64 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name or address"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={openCreateModal}
          >
            Create shop
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {SHOP_STATUSES.map((status) => {
          const count = resolvedShops.filter(
            (shop) => shop.status === status
          ).length;
          return (
            <div
              key={status}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-sm text-gray-500 capitalize">{status}</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {isLoading ? '…' : count}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Accepting orders</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(isUninitialized || queryArg === skipToken || isLoading) && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm">
                  Loading shops…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm">
                  We could not load shops. Please refresh.
                </td>
              </tr>
            )}
            {!isLoading &&
              queryArg !== skipToken &&
              !isError &&
              filteredShops.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm">
                    No shops match the current filter.
                  </td>
                </tr>
              )}
            {filteredShops.map((shop) => (
              <tr
                key={shop.shopId}
                role="button"
                tabIndex={0}
                onClick={() => goToShopProducts(shop.shopId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    goToShopProducts(shop.shopId);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:bg-slate-100"
              >
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{shop.name}</p>
                    <p className="text-xs text-gray-500">
                      {shop.address || 'No address'}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <ShopStatusBadge status={shop.status} />
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      shop.acceptingOrders
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {shop.acceptingOrders ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm capitalize text-gray-700">
                  {shop.role}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {new Date(shop.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      className="text-sm font-medium text-blue-600 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(shop.shopId);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDeleteModal(shop);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen ? (
        <Modal title="Create a shop" onClose={closeCreateModal}>
          <form className="space-y-6" onSubmit={handleCreateShop}>
            {renderCreateFormSections()}
            {creationError && (
              <p className="text-sm text-red-600">{creationError}</p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isCreating ? 'Creating…' : 'Create shop'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isEditModalOpen && editForm ? (
        <Modal title="Edit shop settings" onClose={closeEditModal}>
          <form className="space-y-5" onSubmit={handleEditSubmit}>
            {renderBasicInfoFields(editForm, applyEditFormUpdate, isUpdating)}
            {renderOperationalFields(editForm, applyEditFormUpdate, isUpdating)}
            {renderFulfillmentFields(editForm, applyEditFormUpdate, isUpdating)}
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            {editSuccess && (
              <p className="text-sm text-green-600">{editSuccess}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800"
                onClick={() => {
                  if (editingShopDetails) {
                    setEditForm(mapSummaryToForm(editingShopDetails));
                  }
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {pendingDeleteShop ? (
        <Modal
          title="Delete shop"
          onClose={closeDeleteModal}
          widthClass="max-w-lg"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                {deleteStep === 1
                  ? 'First confirmation required'
                  : 'Final confirmation'}
              </p>
              <p className="text-sm text-gray-600">
                {deleteStep === 1
                  ? `You're about to remove "${pendingDeleteShop.name}". Confirm once more on the next step to proceed.`
                  : `Deleting "${pendingDeleteShop.name}" is permanent and cannot be undone. This will immediately remove the shop from listings.`}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>
                <strong>Status:</strong> {pendingDeleteShop.status}{' '}
                <strong className="ml-2">Address:</strong>{' '}
                {pendingDeleteShop.address || 'Not provided'}
              </p>
            </div>
            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-60"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                  deleteStep === 1
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-60`}
                disabled={isDeleting}
              >
                {deleteStep === 1
                  ? 'Yes, continue'
                  : isDeleting
                  ? 'Deleting…'
                  : 'Yes, delete shop'}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
};

export default ShopsPage;
const resolveSlug = (name: string, slug?: string) => {
  const candidate = slug?.trim() ? toSlug(slug) : toSlug(name);
  return candidate;
};
