import { useEffect, useMemo, useState } from 'react';
import {
  ORDER_ACCEPTANCE_MODES,
  PAYMENT_POLICIES,
  SHOP_STATUSES,
  type OrderAcceptanceMode,
  type PaymentPolicy,
  type ShopSettingsUpdateRequest,
  type ShopStatus,
  type UpsertShopHoursRequest,
} from '../../../types/apiTypes';
import {
  useGetShopByIdQuery,
  useGetShopHoursQuery,
  useGetUserShopsQuery,
  useUpdateShopSettingsMutation,
  useUpsertShopHoursMutation,
} from '../../../store/api/ownerApi';

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

const SettingsPage = () => {
  const { data: userShops, isLoading: isLoadingShops } = useGetUserShopsQuery();
  const [selectedShopId, setSelectedShopId] = useState<string | undefined>();

  const { data: shopDetails } = useGetShopByIdQuery(selectedShopId ?? '', {
    skip: !selectedShopId,
  });

  const { data: shopHours } = useGetShopHoursQuery(
    { shopId: selectedShopId ?? '' },
    { skip: !selectedShopId },
  );

  const [updateSettings, updateSettingsMeta] = useUpdateShopSettingsMutation();
  const [upsertHours, upsertHoursMeta] = useUpsertShopHoursMutation();

  const [settingsDraft, setSettingsDraft] = useState<ShopSettingsUpdateRequest>(
    {},
  );
  const [hoursDraft, setHoursDraft] = useState<UpsertShopHoursRequest>({
    timezone: 'UTC',
    weekly: {},
  });

  useEffect(() => {
    if (!selectedShopId && userShops?.length) {
      setSelectedShopId(userShops[0].shopId);
    }
  }, [selectedShopId, userShops]);

  useEffect(() => {
    if (!shopDetails) return;
    setSettingsDraft({
      status: shopDetails.status,
      acceptingOrders: shopDetails.acceptingOrders,
      paymentPolicy: shopDetails.paymentPolicy,
      orderAcceptanceMode: shopDetails.orderAcceptanceMode,
      allowGuestCheckout: shopDetails.allowGuestCheckout,
      fulfillmentOptions: { ...shopDetails.fulfillmentOptions },
      isActive: shopDetails.isActive,
    });
  }, [shopDetails]);

  useEffect(() => {
    if (shopHours && 'weekly' in shopHours) {
      setHoursDraft({
        timezone: shopHours.timezone,
        weekly: { ...shopHours.weekly },
      });
    } else {
      setHoursDraft({
        timezone: 'UTC',
        weekly: {},
      });
    }
  }, [shopHours]);

  const selectedShopName = useMemo(() => {
    return userShops?.find((shop) => shop.shopId === selectedShopId)?.name;
  }, [selectedShopId, userShops]);

  const noShopsAvailable =
    !isLoadingShops && (!userShops || userShops.length === 0);

  const handleSettingsChange = <K extends keyof ShopSettingsUpdateRequest>(
    field: K,
    value: ShopSettingsUpdateRequest[K],
  ) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFulfillmentChange = (
    field: keyof NonNullable<ShopSettingsUpdateRequest['fulfillmentOptions']>,
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
    await updateSettings({ shopId: selectedShopId, body: settingsDraft });
  };

  const handleHoursSubmit = async () => {
    if (!selectedShopId) return;
    await upsertHours({ shopId: selectedShopId, body: hoursDraft });
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
            userShops?.map((shop) => (
              <option key={shop.shopId} value={shop.shopId}>
                {shop.name}
              </option>
            ))}
        </select>
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
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.acceptingOrders ? 'bg-blue-600' : 'bg-gray-300'
                }`}
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
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.allowGuestCheckout ? 'bg-blue-600' : 'bg-gray-300'
                }`}
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
              disabled={updateSettingsMeta.isLoading || !selectedShopId}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-60"
            >
              {updateSettingsMeta.isLoading ? 'Saving…' : 'Save configuration'}
            </button>
          </div>
          {updateSettingsMeta.isError && (
            <p className="text-sm text-red-600">
              Failed to update settings. Please retry.
            </p>
          )}
          {updateSettingsMeta.isSuccess && (
            <p className="text-sm text-green-600">
              Settings updated successfully.
            </p>
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
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.fulfillmentOptions?.pickupEnabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
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
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                  settingsDraft.fulfillmentOptions?.deliveryEnabled
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
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
            />
          </div>
        </div>

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
                    className={`text-xs font-medium ${
                      configured ? 'text-blue-600' : 'text-gray-500'
                    }`}
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
            disabled={upsertHoursMeta.isLoading || !selectedShopId}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {upsertHoursMeta.isLoading ? 'Saving…' : 'Save hours'}
          </button>
        </div>
        {upsertHoursMeta.isError && (
          <p className="text-sm text-red-600">
            Failed to save hours. Please try again.
          </p>
        )}
        {upsertHoursMeta.isSuccess && (
          <p className="text-sm text-green-600">
            Opening hours updated successfully.
          </p>
        )}
      </div>
    </section>
  );
};

export default SettingsPage;
