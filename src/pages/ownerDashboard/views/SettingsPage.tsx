import { useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import {
  ORDER_ACCEPTANCE_MODES,
  PAYMENT_POLICIES,
  SHOP_STATUSES,
  type OrderAcceptanceMode,
  type PaymentPolicy,
  type ShopStatus,
} from '../../../types/apiTypes';
import {
  useGetShopQuery,
  useGetShopHoursQuery,
  useUpdateShopMutation,
  useUpsertShopHoursMutation,
  type ShopResponse,
  type ShopHoursResponse,
} from '../../../store/api/shopsApi';
import { useListManagedShopsQuery } from '../../../store/api/usersApi';
import type { ShopHoursPayload } from '../../../store/api/backend-generated/apiClient';

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

const defaultHoursWindow = { open: '09:00', close: '17:00' };

type FulfillmentDraft = {
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
};

type ShopSettingsDraft = {
  status?: ShopStatus;
  acceptingOrders?: boolean;
  paymentPolicy?: PaymentPolicy;
  orderAcceptanceMode?: OrderAcceptanceMode;
  allowGuestCheckout?: boolean;
  fulfillmentOptions?: FulfillmentDraft;
  defaultCurrency?: string;
};

type ShopHoursWindowDraft = {
  open: string;
  close: string;
};

type ShopHoursDraft = {
  timezone: string;
  weekly: Partial<Record<Weekday, ShopHoursWindowDraft[]>>;
};

const toUiStatus = (status: ShopResponse['status']): ShopStatus =>
  status === 'open' ? 'open' : 'closed';

const mapShopToDraft = (shop: ShopResponse): ShopSettingsDraft => ({
  status: toUiStatus(shop.status),
  acceptingOrders: shop.acceptingOrders,
  paymentPolicy: shop.paymentPolicy as PaymentPolicy,
  orderAcceptanceMode: shop.orderAcceptanceMode as OrderAcceptanceMode,
  allowGuestCheckout: shop.allowGuestCheckout,
  fulfillmentOptions: {
    pickupEnabled: shop.fulfillmentOptions.pickupEnabled,
    deliveryEnabled: shop.fulfillmentOptions.deliveryEnabled,
    deliveryRadiusKm: shop.fulfillmentOptions.deliveryRadiusKm ?? 0,
    deliveryFee: shop.fulfillmentOptions.deliveryFee?.amount ?? 0,
  },
  defaultCurrency: shop.defaultCurrency ?? 'USD',
});

const buildFulfillmentPayload = (
  options?: FulfillmentDraft,
  currency = 'USD'
) => {
  if (!options) return undefined;
  const pickupEnabled = Boolean(options.pickupEnabled);
  const deliveryEnabled = Boolean(options.deliveryEnabled);
  return {
    pickupEnabled,
    deliveryEnabled,
    deliveryRadiusKm:
      deliveryEnabled && typeof options.deliveryRadiusKm === 'number'
        ? options.deliveryRadiusKm
        : undefined,
    deliveryFee:
      deliveryEnabled && typeof options.deliveryFee === 'number'
        ? {
            amount: Number(options.deliveryFee),
            currency,
          }
        : undefined,
  };
};

const mapHoursToDraft = (hours: ShopHoursResponse | null): ShopHoursDraft => {
  if (!hours) {
    return { timezone: 'UTC', weekly: {} };
  }
  const weekly: ShopHoursDraft['weekly'] = {};
  (Object.keys(hours.weekly) as Weekday[]).forEach((day) => {
    const windows = hours.weekly[day];
    if (windows && windows.length) {
      weekly[day] = windows.map((window) => ({
        open: window.opensAt,
        close: window.closesAt,
      }));
    }
  });
  return {
    timezone: hours.timezone,
    weekly,
  };
};

const buildHoursPayload = (draft: ShopHoursDraft): ShopHoursPayload => ({
  timezone: draft.timezone,
  weekly: Object.fromEntries(
    (Object.keys(draft.weekly) as Weekday[]).map((day) => [
      day,
      draft.weekly[day]?.map((window) => ({
        opensAt: window.open,
        closesAt: window.close,
      })),
    ])
  ),
});

const SettingsPage = () => {
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';
  const {
    data: managedShops,
    isLoading: isLoadingShops,
    isError: managedShopsError,
  } = useListManagedShopsQuery(ownerUserId ?? '', {
    skip: !ownerUserId,
  });
  const [selectedShopId, setSelectedShopId] = useState<string | undefined>();
  const [settingsDraft, setSettingsDraft] = useState<ShopSettingsDraft>({});
  const [hoursDraft, setHoursDraft] = useState<ShopHoursDraft>({
    timezone: 'UTC',
    weekly: {},
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [hoursSaving, setHoursSaving] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [hoursSuccess, setHoursSuccess] = useState<string | null>(null);
  const {
    data: shopDetails,
    error: shopDetailsError,
  } = useGetShopQuery(selectedShopId ?? '', {
    skip: !selectedShopId,
  });
  const {
    data: shopHours,
    isFetching: hoursQueryLoading,
    error: shopHoursError,
  } = useGetShopHoursQuery(selectedShopId ?? '', {
    skip: !selectedShopId,
  });
  const [updateShopMutation] = useUpdateShopMutation();
  const [upsertHoursMutation] = useUpsertShopHoursMutation();

  useEffect(() => {
    if (!selectedShopId && managedShops?.length) {
      setSelectedShopId(managedShops[0].shopId);
    } else if (
      selectedShopId &&
      managedShops &&
      !managedShops.find((shop) => shop.shopId === selectedShopId)
    ) {
      setSelectedShopId(managedShops[0]?.shopId);
    }
  }, [managedShops, selectedShopId]);

  useEffect(() => {
    if (shopDetails) {
      setSettingsDraft(mapShopToDraft(shopDetails));
      setSettingsError(null);
    }
  }, [shopDetails]);

  useEffect(() => {
    if (selectedShopId) {
      setHoursDraft(mapHoursToDraft(shopHours ?? null));
    }
  }, [selectedShopId, shopHours]);

  const hoursLoading = hoursQueryLoading;
  const resolvedUserShops = managedShops ?? [];
  const shopsError = managedShopsError ? 'Unable to load shops.' : null;
  const settingsQueryError = shopDetailsError
    ? 'Unable to load shop details.'
    : null;
  const hoursQueryErrorMessage = shopHoursError
    ? 'Unable to load shop hours.'
    : null;
  const selectedShopName = useMemo(() => {
    return resolvedUserShops.find((shop) => shop.shopId === selectedShopId)
      ?.name;
  }, [selectedShopId, resolvedUserShops]);
  const noShopsAvailable =
    !isLoadingShops && resolvedUserShops.length === 0;
  const disableSettings = !selectedShopId || settingsSaving;
  const disableHours = !selectedShopId || hoursSaving || hoursLoading;

  const handleSettingsChange = <K extends keyof ShopSettingsDraft>(
    field: K,
    value: ShopSettingsDraft[K],
  ) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFulfillmentChange = (
    field: keyof FulfillmentDraft,
    value: boolean | number | undefined,
  ) => {
    setSettingsDraft((prev) => ({
      ...prev,
      fulfillmentOptions: {
        ...prev.fulfillmentOptions,
        [field]: value,
      },
    }));
  };

  const toggleDay = (day: Weekday) => {
    setHoursDraft((prev) => {
      const nextWeekly = { ...prev.weekly };
      if (nextWeekly[day]?.length) {
        delete nextWeekly[day];
      } else {
        nextWeekly[day] = [{ ...defaultHoursWindow }];
      }
      return { ...prev, weekly: nextWeekly };
    });
  };

  const updateHoursWindow = (
    day: Weekday,
    field: 'open' | 'close',
    value: string,
  ) => {
    setHoursDraft((prev) => {
      const windows = prev.weekly[day]?.length
        ? [...(prev.weekly[day] ?? [])]
        : [{ ...defaultHoursWindow }];
      windows[0] = { ...windows[0], [field]: value };
      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [day]: windows,
        },
      };
    });
  };

  const handleSettingsSubmit = async () => {
    if (!selectedShopId) return;
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const payload = {
        status: settingsDraft.status,
        acceptingOrders: settingsDraft.acceptingOrders,
        paymentPolicy: settingsDraft.paymentPolicy,
        orderAcceptanceMode: settingsDraft.orderAcceptanceMode,
        allowGuestCheckout: settingsDraft.allowGuestCheckout,
        fulfillmentOptions: buildFulfillmentPayload(
          settingsDraft.fulfillmentOptions,
          settingsDraft.defaultCurrency ?? 'USD'
        ),
        defaultCurrency: settingsDraft.defaultCurrency,
      };
      await updateShopMutation({ shopId: selectedShopId, body: payload }).unwrap();
      setSettingsSuccess('Settings saved.');
    } catch (error) {
      setSettingsError(
        error instanceof Error
          ? error.message
          : 'Unable to update shop settings.'
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleHoursSubmit = async () => {
    if (!selectedShopId) return;
    setHoursSaving(true);
    setHoursError(null);
    setHoursSuccess(null);
    try {
      await upsertHoursMutation({
        shopId: selectedShopId,
        body: buildHoursPayload(hoursDraft),
      }).unwrap();
      setHoursSuccess('Hours updated.');
    } catch (error) {
      setHoursError(
        error instanceof Error
          ? error.message
          : 'Unable to update shop hours.'
      );
    } finally {
      setHoursSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Shop settings</h1>
        <p className="text-gray-600">
          Update how each storefront accepts orders, payments, and fulfilment.
        </p>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Choose a shop
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedShopId ?? ''}
          onChange={(event) => setSelectedShopId(event.target.value || undefined)}
          disabled={isLoadingShops || noShopsAvailable}
        >
          <option value="" disabled>
            {isLoadingShops
              ? 'Loading shops…'
              : noShopsAvailable
                ? 'No shops available'
                : 'Select a shop'}
          </option>
          {!isLoadingShops &&
            resolvedUserShops.map((shop) => (
              <option key={shop.shopId} value={shop.shopId}>
                {shop.name}
              </option>
            ))}
        </select>
        {shopsError && (
          <p className="text-sm text-red-600">{shopsError}</p>
        )}
        {selectedShopName && (
          <p className="text-xs text-gray-500">
            Editing configuration for {selectedShopName}.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Operational configuration
          </h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Shop status
              </label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={settingsDraft.status ?? ''}
                onChange={(event) =>
                  handleSettingsChange('status', event.target.value as ShopStatus)
                }
                disabled={disableSettings}
              >
                <option value="" disabled>
                  Select status
                </option>
                {SHOP_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Accepting orders
                </p>
                <p className="text-xs text-gray-500">
                  Pause to stop new orders instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSettingsChange('acceptingOrders', !settingsDraft.acceptingOrders)
                }
                disabled={disableSettings}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.acceptingOrders ? 'bg-blue-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    settingsDraft.acceptingOrders ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment policy
              </label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 capitalize"
                value={settingsDraft.paymentPolicy ?? ''}
                onChange={(event) =>
                  handleSettingsChange('paymentPolicy', event.target.value as PaymentPolicy)
                }
                disabled={disableSettings}
              >
                <option value="" disabled>
                  Select payment policy
                </option>
                {PAYMENT_POLICIES.map((policy) => (
                  <option key={policy} value={policy}>
                    {policy.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order acceptance
              </label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 capitalize"
                value={settingsDraft.orderAcceptanceMode ?? ''}
                onChange={(event) =>
                  handleSettingsChange(
                    'orderAcceptanceMode',
                    event.target.value as OrderAcceptanceMode,
                  )
                }
                disabled={disableSettings}
              >
                <option value="" disabled>
                  Select acceptance mode
                </option>
                {ORDER_ACCEPTANCE_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Allow guest checkout
                </p>
                <p className="text-xs text-gray-500">
                  When disabled, users must sign in to order.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSettingsChange(
                    'allowGuestCheckout',
                    !settingsDraft.allowGuestCheckout,
                  )
                }
                disabled={disableSettings}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.allowGuestCheckout ? 'bg-blue-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    settingsDraft.allowGuestCheckout ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSettingsSubmit}
              disabled={disableSettings}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {settingsSaving ? 'Saving…' : 'Save configuration'}
            </button>
          </div>
          {settingsQueryError && (
            <p className="text-sm text-red-600">{settingsQueryError}</p>
          )}
          {settingsError && (
            <p className="text-sm text-red-600">{settingsError}</p>
          )}
          {settingsSuccess && (
            <p className="text-sm text-green-600">{settingsSuccess}</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Fulfilment options
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Pickup</p>
                <p className="text-xs text-gray-500">
                  Enable in-store pickup for this shop.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleFulfillmentChange(
                    'pickupEnabled',
                    !settingsDraft.fulfillmentOptions?.pickupEnabled,
                  )
                }
                disabled={disableSettings}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.fulfillmentOptions?.pickupEnabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    settingsDraft.fulfillmentOptions?.pickupEnabled
                      ? 'translate-x-5'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Delivery</p>
                <p className="text-xs text-gray-500">
                  Toggle same-day local deliveries.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleFulfillmentChange(
                    'deliveryEnabled',
                    !settingsDraft.fulfillmentOptions?.deliveryEnabled,
                  )
                }
                disabled={disableSettings}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.fulfillmentOptions?.deliveryEnabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    settingsDraft.fulfillmentOptions?.deliveryEnabled
                      ? 'translate-x-5'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery radius (km)
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={settingsDraft.fulfillmentOptions?.deliveryRadiusKm ?? ''}
                onChange={(event) =>
                  handleFulfillmentChange(
                    'deliveryRadiusKm',
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                disabled={
                  disableSettings ||
                  !settingsDraft.fulfillmentOptions?.deliveryEnabled
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery fee
              </label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={settingsDraft.fulfillmentOptions?.deliveryFee ?? ''}
                onChange={(event) =>
                  handleFulfillmentChange(
                    'deliveryFee',
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
                disabled={
                  disableSettings ||
                  !settingsDraft.fulfillmentOptions?.deliveryEnabled
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Opening hours
            </h2>
            <p className="text-sm text-gray-500">
              Define weekly windows in the shop’s local timezone.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">
              Timezone
            </label>
            <input
              className="mt-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
              value={hoursDraft.timezone}
              onChange={(event) =>
                setHoursDraft((prev) => ({
                  ...prev,
                  timezone: event.target.value,
                }))
              }
              disabled={disableHours}
            />
          </div>
        </div>
        {hoursLoading && (
          <p className="text-xs text-gray-500">Loading hours…</p>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {weekdays.map((day) => {
            const configured = Boolean(hoursDraft.weekly[day.key]?.length);
            const currentWindow =
              hoursDraft.weekly[day.key]?.[0] ?? defaultHoursWindow;
            return (
              <div
                key={day.key}
                className="border border-gray-200 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">
                    {day.label}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    disabled={disableHours}
                    className={`text-xs font-medium ${
                      configured ? 'text-blue-600' : 'text-gray-500'
                    } disabled:opacity-50`}
                  >
                    {configured ? 'Disable' : 'Enable'}
                  </button>
                </div>
                {configured ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="block text-xs text-gray-500">
                        Opens
                      </label>
                      <input
                        type="time"
                        className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                        value={currentWindow.open}
                        onChange={(event) =>
                          updateHoursWindow(day.key, 'open', event.target.value)
                        }
                        disabled={disableHours}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">
                        Closes
                      </label>
                      <input
                        type="time"
                        className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                        value={currentWindow.close}
                        onChange={(event) =>
                          updateHoursWindow(day.key, 'close', event.target.value)
                        }
                        disabled={disableHours}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Closed • enable to set hours
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleHoursSubmit}
            disabled={disableHours}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {hoursSaving ? 'Saving…' : 'Save hours'}
          </button>
        </div>
        {hoursQueryErrorMessage && (
          <p className="text-sm text-red-600">{hoursQueryErrorMessage}</p>
        )}
        {hoursError && (
          <p className="text-sm text-red-600">{hoursError}</p>
        )}
        {hoursSuccess && (
          <p className="text-sm text-green-600">{hoursSuccess}</p>
        )}
      </div>
    </section>
  );
};

export default SettingsPage;
