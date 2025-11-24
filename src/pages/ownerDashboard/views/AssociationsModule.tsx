import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, type ApiShape } from '../../../config/api';

type Shop = Awaited<ReturnType<ApiShape['getShop']>>;
type FulfillmentOptions = NonNullable<Shop['fulfillmentOptions']>;
type ShopHours = Awaited<ReturnType<ApiShape['getShopHours']>>;
type ShopMember = Awaited<ReturnType<ApiShape['listShopMembers']>>[number];
type ShopMenu = Awaited<ReturnType<ApiShape['getShopMenu']>>;

const weekdays: Array<keyof ShopHours['weekly']> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const defaultWindow = {
  opensAt: '09:00',
  closesAt: '17:00',
  isClosed: false,
};

const AssociationsModule = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shopDetails, setShopDetails] = useState<Shop | null>(null);
  const [shopHours, setShopHours] = useState<ShopHours | null>(null);
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [menu, setMenu] = useState<ShopMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [hoursSubmitting, setHoursSubmitting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    userId: '',
    role: 'manager' as ShopMember['role'],
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [membershipsSubmitting, setMembershipsSubmitting] = useState<
    Record<string, boolean>
  >({});

  const loadShops = useCallback(async () => {
    try {
      const data = await api.listShops();
      setShops(data);
      if (!selectedShopId && data.length) {
        setSelectedShopId(data[0].id);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to load shops.'
      );
    }
  }, [selectedShopId]);

  const loadShopContext = useCallback(
    async (shopId: string) => {
      if (!shopId) return;
      setLoading(true);
      setError(null);
      try {
        const [details, hours, membersResponse, menuResponse] =
          await Promise.all([
            api.getShop(shopId),
            api.getShopHours(shopId),
            api.listShopMembers(shopId),
            api.getShopMenu(shopId),
          ]);
        setShopDetails(details);
        setShopHours(hours);
        setMembers(membersResponse);
        setMenu(menuResponse);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load shop associations.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  useEffect(() => {
    if (selectedShopId) {
      loadShopContext(selectedShopId);
    }
  }, [selectedShopId, loadShopContext]);

  const fulfillmentForm = useMemo<FulfillmentOptions>(() => {
    return (
      shopDetails?.fulfillmentOptions ?? {
        pickupEnabled: true,
        deliveryEnabled: false,
        deliveryRadiusKm: 0,
        deliveryFee: { amount: 0, currency: 'USD' },
        leadTimeMinutes: 15,
      }
    );
  }, [shopDetails]);

  const hoursDraft = useMemo(() => {
    if (!shopHours) {
      return {
        timezone: 'UTC',
        weekly: weekdays.reduce((acc, day) => {
          acc[day] = [defaultWindow];
          return acc;
        }, {} as ShopHours['weekly']),
      };
    }
    return shopHours;
  }, [shopHours]);

  const handleDetailsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShopId || !shopDetails) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      legalName: formData.get('legalName') as string,
      address: formData.get('address') as string,
      timezone: formData.get('timezone') as string,
      status: formData.get('status') as Shop['status'],
      acceptingOrders: formData.get('acceptingOrders') === 'on',
      paymentPolicy: formData.get('paymentPolicy') as Shop['paymentPolicy'],
      orderAcceptanceMode: formData.get(
        'orderAcceptanceMode'
      ) as Shop['orderAcceptanceMode'],
      allowGuestCheckout: formData.get('allowGuestCheckout') === 'on',
    };
    setDetailsSubmitting(true);
    try {
      await api.updateShop(selectedShopId, payload);
      await loadShopContext(selectedShopId);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to update shop.'
      );
    } finally {
      setDetailsSubmitting(false);
    }
  };

  const handleFulfillmentSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedShopId) return;
    const formData = new FormData(event.currentTarget);
    const payload = {
      fulfillmentOptions: {
        pickupEnabled: formData.get('pickupEnabled') === 'on',
        deliveryEnabled: formData.get('deliveryEnabled') === 'on',
        deliveryRadiusKm: Number(formData.get('deliveryRadiusKm')) || undefined,
        deliveryFee:
          Number(formData.get('deliveryFeeAmount')) > 0
            ? {
                amount: Number(formData.get('deliveryFeeAmount')),
                currency: (formData.get('deliveryFeeCurrency') as string) || 'USD',
              }
            : undefined,
        leadTimeMinutes: Number(formData.get('leadTimeMinutes')) || undefined,
      },
    };
    setDetailsSubmitting(true);
    try {
      await api.updateShop(selectedShopId, payload);
      await loadShopContext(selectedShopId);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update fulfillment options.'
      );
    } finally {
      setDetailsSubmitting(false);
    }
  };

  const handleHoursSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShopId) return;
    const formData = new FormData(event.currentTarget);
    const timezone = formData.get('timezone') as string;
    const weekly: ShopHours['weekly'] = {};
    weekdays.forEach((day) => {
      const isClosed = formData.get(`${day}-closed`) === 'on';
      weekly[day] = [
        {
          opensAt: formData.get(`${day}-open`) as string,
          closesAt: formData.get(`${day}-close`) as string,
          isClosed,
        },
      ];
    });
    setHoursSubmitting(true);
    try {
      await api.upsertShopHours(selectedShopId, { timezone, weekly });
      await loadShopContext(selectedShopId);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update shop hours.'
      );
    } finally {
      setHoursSubmitting(false);
    }
  };

  const handleMemberUpdate = async (
    member: ShopMember,
    updates: Partial<ShopMember>
  ) => {
    if (!selectedShopId) return;
    setMembershipsSubmitting((prev) => ({ ...prev, [member.id]: true }));
    try {
      await api.updateShopMember(selectedShopId, member.id, {
        role: updates.role ?? member.role,
        isActive: updates.isActive ?? member.isActive,
      });
      await loadShopContext(selectedShopId);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update member permissions.'
      );
    } finally {
      setMembershipsSubmitting((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShopId || !inviteForm.userId) return;
    setInviteSubmitting(true);
    try {
      await api.createShopMember(selectedShopId, {
        userId: inviteForm.userId,
        role: inviteForm.role,
      });
      await loadShopContext(selectedShopId);
      setInviteForm({ userId: '', role: 'manager' });
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to invite member.'
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Associations & ACL
          </h1>
          <p className="text-sm text-gray-600">
            Manage shop settings, fulfillment, hours, and team permissions with
            full awareness of roles and menu output.
          </p>
        </div>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={selectedShopId}
          onChange={(event) => setSelectedShopId(event.target.value)}
        >
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading shop data…</p>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-2">
            <form
              className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
              onSubmit={handleDetailsSubmit}
            >
              <h2 className="text-lg font-semibold text-gray-900">
                Shop details
              </h2>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Display name
                  </label>
                  <input
                    name="name"
                    defaultValue={shopDetails?.name}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Legal name
                  </label>
                  <input
                    name="legalName"
                    defaultValue={shopDetails?.legalName}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    defaultValue={shopDetails?.address}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <input
                      name="timezone"
                      defaultValue={shopDetails?.timezone ?? 'UTC'}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={shopDetails?.status}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {['draft', 'open', 'closed', 'suspended'].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Payment policy
                    </label>
                    <select
                      name="paymentPolicy"
                      defaultValue={shopDetails?.paymentPolicy}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="pay_on_pickup">Pay on pickup</option>
                      <option value="prepaid_only">Prepaid only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Order acceptance
                    </label>
                    <select
                      name="orderAcceptanceMode"
                      defaultValue={shopDetails?.orderAcceptanceMode}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="auto">Automatic</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="acceptingOrders"
                    defaultChecked={shopDetails?.acceptingOrders}
                  />
                  Accepting orders
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="allowGuestCheckout"
                    defaultChecked={shopDetails?.allowGuestCheckout}
                  />
                  Allow guest checkout
                </label>
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={detailsSubmitting}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {detailsSubmitting ? 'Saving…' : 'Save details'}
                  </button>
                </div>
              </div>
            </form>
            <form
              className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
              onSubmit={handleFulfillmentSubmit}
            >
              <h2 className="text-lg font-semibold text-gray-900">
                Fulfillment options
              </h2>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="pickupEnabled"
                  defaultChecked={fulfillmentForm.pickupEnabled}
                />
                Pickup enabled
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="deliveryEnabled"
                  defaultChecked={fulfillmentForm.deliveryEnabled}
                />
                Delivery enabled
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Delivery radius (km)
                  </label>
                  <input
                    type="number"
                    name="deliveryRadiusKm"
                    defaultValue={fulfillmentForm.deliveryRadiusKm ?? 0}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Delivery fee
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      name="deliveryFeeAmount"
                      defaultValue={fulfillmentForm.deliveryFee?.amount ?? 0}
                      className="w-24 rounded-md border border-gray-300 px-3 py-2"
                    />
                    <input
                      name="deliveryFeeCurrency"
                      defaultValue={fulfillmentForm.deliveryFee?.currency ?? 'USD'}
                      className="w-20 rounded-md border border-gray-300 px-3 py-2 uppercase"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Lead time (minutes)
                </label>
                <input
                  type="number"
                  name="leadTimeMinutes"
                  defaultValue={fulfillmentForm.leadTimeMinutes ?? 0}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={detailsSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {detailsSubmitting ? 'Saving…' : 'Save fulfillment'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <form className="space-y-4" onSubmit={handleHoursSubmit}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Operating hours
                </h2>
                <input
                  name="timezone"
                  defaultValue={hoursDraft?.timezone ?? shopDetails?.timezone}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {weekdays.map((day) => (
                  <div key={day} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {day}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        name={`${day}-open`}
                        defaultValue={hoursDraft?.weekly[day]?.[0]?.opensAt ?? '09:00'}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <span className="text-xs text-gray-500">to</span>
                      <input
                        type="time"
                        name={`${day}-close`}
                        defaultValue={hoursDraft?.weekly[day]?.[0]?.closesAt ?? '17:00'}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        name={`${day}-closed`}
                        defaultChecked={hoursDraft?.weekly[day]?.[0]?.isClosed}
                      />
                      Closed
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={hoursSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {hoursSubmitting ? 'Saving…' : 'Save hours'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Membership & ACL
                </h2>
                <p className="text-sm text-gray-600">
                  Roles control what each collaborator can do. Permissions are
                  enforced from the API response.
                </p>
              </div>
              <form
                className="flex flex-col gap-2 md:flex-row md:items-center"
                onSubmit={handleInviteSubmit}
              >
                <input
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="User ID"
                  value={inviteForm.userId}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, userId: event.target.value }))
                  }
                  required
                />
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      role: event.target.value as ShopMember['role'],
                    }))
                  }
                >
                  {['owner', 'manager', 'staff', 'viewer'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {inviteSubmitting ? 'Inviting…' : 'Invite'}
                </button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">
                          {member.userId}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {member.id}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                          value={member.role}
                          onChange={(event) =>
                            handleMemberUpdate(member, {
                              role: event.target.value as ShopMember['role'],
                            })
                          }
                          disabled={membershipsSubmitting[member.id]}
                        >
                          {['owner', 'manager', 'staff', 'viewer'].map(
                            (role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            member.isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-gray-500 underline"
                          onClick={() =>
                            handleMemberUpdate(member, {
                              isActive: !member.isActive,
                            })
                          }
                          disabled={membershipsSubmitting[member.id]}
                        >
                          {member.isActive ? 'Suspend' : 'Reinstate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Live menu snapshot
            </h2>
            {menu ? (
              <div className="grid gap-6 md:grid-cols-2">
                {menu.categories.map((category) => {
                  const productsInCategory = menu.products.filter((product) => {
                    const matchesById =
                      product.categoryDetails?.some(
                        (detail) => detail.id === category.id
                      ) ?? false;
                    const matchesByName =
                      product.categories?.includes(category.name) ?? false;
                    return matchesById || matchesByName;
                  });
                  return (
                    <div key={category.id} className="rounded-xl border border-gray-100 p-4">
                      <p className="text-sm font-medium text-gray-900">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.description || 'No description'}
                      </p>
                      <div className="mt-3 space-y-2">
                        {productsInCategory.length === 0 ? (
                          <p className="text-xs text-gray-500">No products assigned.</p>
                        ) : (
                          productsInCategory.map((product) => (
                            <div
                              key={product.id}
                              className="rounded-lg bg-gray-50 p-3 space-y-1"
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {product.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {product.isActive ? 'Available' : 'Unavailable'}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Select a shop to view its menu output.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AssociationsModule;
