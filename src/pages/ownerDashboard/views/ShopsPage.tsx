import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { skipToken } from '@reduxjs/toolkit/query';
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
  type UpsertShopHoursRequest,
  type UserShopView,
} from '../../../types/apiTypes';
import {
  useShopHoursUpsertMutation,
  useShopsCreateMutation,
  useShopsGetByIdQuery,
  useShopsUpdateMutation,
  useUsersGetShopsQuery,
} from '../../../store/api/ownerApi';

type ShopFormState = Omit<CreateShopRequest, 'ownerUserId'>;

type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

const weekdays: { key: Weekday; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

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

const createDefaultShopForm = (): ShopFormState => ({
  name: '',
  address: '',
  status: 'open',
  isActive: true,
  acceptingOrders: true,
  paymentPolicy: 'pay_on_pickup',
  orderAcceptanceMode: 'auto',
  allowGuestCheckout: true,
  fulfillmentOptions: { ...defaultFulfillment },
});

const createDefaultHoursDraft = () => ({
  timezone: 'UTC',
  open: '09:00',
  close: '17:00',
  days: weekdays.reduce<Record<Weekday, boolean>>(
    (acc, { key }) => ({ ...acc, [key]: true }),
    {} as Record<Weekday, boolean>
  ),
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

const StepIndicator = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    {Array.from({ length: total }).map((_, index) => {
      const stepNumber = index + 1;
      const isActive = stepNumber === current;
      const isCompleted = stepNumber < current;
      return (
        <div key={stepNumber} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-blue-600 text-white'
                : isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {stepNumber}
          </span>
          {stepNumber < total ? (
            <span className="h-px w-10 bg-gray-200" aria-hidden />
          ) : null}
        </div>
      );
    })}
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
  const [upsertHours, { isLoading: isSavingHours }] =
    useShopHoursUpsertMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [creationError, setCreationError] = useState<string | null>(null);
  const [newShop, setNewShop] = useState<ShopFormState>(
    createDefaultShopForm()
  );
  const [hoursDraft, setHoursDraft] = useState(createDefaultHoursDraft);
  const [createStep, setCreateStep] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const editingQueryArg = editingShopId ?? skipToken;
  const { data: editingShopDetails } = useShopsGetByIdQuery(editingQueryArg);
  const [editForm, setEditForm] = useState<ShopFormState | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (editingShopDetails) {
      setEditForm(mapSummaryToForm(editingShopDetails));
      setEditError(null);
      setEditSuccess(null);
    }
  }, [editingShopDetails]);

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
    setCreateStep(1);
    setNewShop(createDefaultShopForm());
    setHoursDraft(createDefaultHoursDraft());
    setCreationError(null);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
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

    try {
      setCreationError(null);
      const payload: CreateShopRequest = {
        ...newShop,
        name: newShop.name.trim(),
        address: newShop.address.trim(),
        ownerUserId,
        fulfillmentOptions: normalizeFulfillment(newShop.fulfillmentOptions),
      };
      const createdShop = await createShop(payload).unwrap();

      const weekly: UpsertShopHoursRequest['weekly'] = {};
      (Object.keys(hoursDraft.days) as Weekday[]).forEach((day) => {
        if (hoursDraft.days[day]) {
          weekly[day] = [{ open: hoursDraft.open, close: hoursDraft.close }];
        }
      });
      if (Object.keys(weekly).length > 0) {
        await upsertHours({
          shopId: createdShop.id,
          body: { timezone: hoursDraft.timezone, weekly },
        }).unwrap();
      }

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
      const payload: ShopSettingsUpdateRequest = {
        name: editForm.name?.trim(),
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
    setter: (next: ShopFormState) => void,
    form: ShopFormState,
    field: keyof FulfillmentOptions,
    value: boolean | number
  ) => {
    setter({
      ...form,
      fulfillmentOptions: {
        ...form.fulfillmentOptions,
        [field]:
          typeof value === 'number' ? (Number.isNaN(value) ? 0 : value) : value,
      },
    });
  };

  const renderBasicInfoFields = (
    form: ShopFormState,
    setForm: (next: ShopFormState) => void,
    disabled?: boolean
  ) => (
    <div className="grid gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.address}
          onChange={(event) =>
            setForm({
              ...form,
              address: event.target.value,
            })
          }
          required
          disabled={disabled}
        />
      </div>
    </div>
  );

  const renderOperationalFields = (
    form: ShopFormState,
    setForm: (next: ShopFormState) => void,
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
            setForm({
              ...form,
              status: event.target.value as ShopStatus,
            })
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
            setForm({
              ...form,
              orderAcceptanceMode: event.target.value as OrderAcceptanceMode,
            })
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
            setForm({
              ...form,
              paymentPolicy: event.target.value as PaymentPolicy,
            })
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
          onClick={() => setForm({ ...form, isActive: !form.isActive })}
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
            setForm({ ...form, acceptingOrders: !form.acceptingOrders })
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
    setForm: (next: ShopFormState) => void,
    disabled?: boolean
  ) => (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={form.allowGuestCheckout}
          onChange={(event) =>
            setForm({ ...form, allowGuestCheckout: event.target.checked })
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
              form,
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
                form,
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
                    form,
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
                    form,
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

  const renderHoursStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Timezone
        </label>
        <input
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={hoursDraft.timezone}
          onChange={(event) =>
            setHoursDraft((prev) => ({ ...prev, timezone: event.target.value }))
          }
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Opening time
          </label>
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={hoursDraft.open}
            onChange={(event) =>
              setHoursDraft((prev) => ({ ...prev, open: event.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Closing time
          </label>
          <input
            type="time"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={hoursDraft.close}
            onChange={(event) =>
              setHoursDraft((prev) => ({ ...prev, close: event.target.value }))
            }
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Days open</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekdays.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hoursDraft.days[key]}
                onChange={(event) =>
                  setHoursDraft((prev) => ({
                    ...prev,
                    days: { ...prev.days, [key]: event.target.checked },
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreateStep = () => {
    if (createStep === 1) {
      return (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Provide the basics for this storefront.
          </p>
          {renderBasicInfoFields(newShop, setNewShop, isCreating)}
        </>
      );
    }
    if (createStep === 2) {
      return (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Configure default opening hours. You can refine these later from the
            settings page.
          </p>
          {renderHoursStep()}
        </>
      );
    }
    return (
      <>
        <p className="text-sm text-gray-500 mb-4">
          Set operational preferences, then confirm everything looks correct.
        </p>
        <div className="space-y-6">
          {renderOperationalFields(newShop, setNewShop, isCreating)}
          {renderFulfillmentFields(newShop, setNewShop, isCreating)}
          <div className="rounded-lg border border-gray-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900">
              Review selections
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>Name:</strong> {newShop.name || '—'}
              </li>
              <li>
                <strong>Address:</strong> {newShop.address || '—'}
              </li>
              <li>
                <strong>Status:</strong> {newShop.status}
              </li>
              <li>
                <strong>Order acceptance:</strong> {newShop.orderAcceptanceMode}
              </li>
              <li>
                <strong>Payment policy:</strong> {newShop.paymentPolicy}
              </li>
              <li>
                <strong>Hours:</strong>{' '}
                {`${hoursDraft.open}–${hoursDraft.close} (${hoursDraft.timezone})`}
              </li>
            </ul>
          </div>
        </div>
      </>
    );
  };

  return (
    <section className="space-y-6">
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
              <tr key={shop.shopId}>
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
                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600 hover:underline"
                    onClick={() => openEditModal(shop.shopId)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen ? (
        <Modal title="Create a shop" onClose={closeCreateModal}>
          <form className="space-y-6" onSubmit={handleCreateShop}>
            <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
              <StepIndicator current={createStep} total={3} />
              <div className="text-xs text-gray-500">
                Step {createStep} of 3
              </div>
            </div>
            {renderCreateStep()}
            {creationError && (
              <p className="text-sm text-red-600">{creationError}</p>
            )}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                onClick={() => setCreateStep((prev) => Math.max(1, prev - 1))}
                disabled={createStep === 1}
              >
                Previous
              </button>
              {createStep < 3 ? (
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={() => setCreateStep((prev) => Math.min(3, prev + 1))}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isCreating || isSavingHours}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isCreating || isSavingHours ? 'Saving…' : 'Save shop'}
                </button>
              )}
            </div>
          </form>
        </Modal>
      ) : null}

      {isEditModalOpen && editForm ? (
        <Modal title="Edit shop settings" onClose={closeEditModal}>
          <form className="space-y-5" onSubmit={handleEditSubmit}>
            {renderBasicInfoFields(editForm, setEditForm, isUpdating)}
            {renderOperationalFields(editForm, setEditForm, isUpdating)}
            {renderFulfillmentFields(editForm, setEditForm, isUpdating)}
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
    </section>
  );
};

export default ShopsPage;
