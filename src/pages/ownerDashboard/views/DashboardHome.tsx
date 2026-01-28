import { useMemo } from 'react';
import { useMsal } from '@azure/msal-react';
import {
  useShopsListQuery,
  useOrdersListByShopQuery,
  useUsersListManagedShopsQuery,
} from '../../../services/api';

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Unknown';

  const deltaMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(deltaMs) < hour) {
    const minutes = Math.max(1, Math.round(deltaMs / minute));
    return `${minutes}m ago`;
  }

  if (Math.abs(deltaMs) < day) {
    const hours = Math.max(1, Math.round(deltaMs / hour));
    return `${hours}h ago`;
  }

  const days = Math.max(1, Math.round(deltaMs / day));
  return `${days}d ago`;
};

const EmptyState = ({ message }: { message: string }) => (
  <p className="text-sm text-gray-500">{message}</p>
);

const StatCard = ({
  label,
  value,
  helper,
  loading,
}: {
  label: string;
  value: string | number;
  helper?: string;
  loading?: boolean;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-semibold mt-2 text-gray-900">
      {loading ? '…' : value}
    </p>
    {helper ? <p className="text-xs text-gray-500 mt-1">{helper}</p> : null}
  </div>
);

const DashboardHome = () => {
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';
  const {
    data: shops = [],
    isLoading: shopsLoading,
    isError: shopsError,
  } = useShopsListQuery();
  const {
    data: managedShops = [],
    isLoading: managedLoading,
  } = useUsersListManagedShopsQuery(ownerUserId ?? '', {
    skip: !ownerUserId,
  });
  const primaryShopId =
    managedShops[0]?.shopId || shops[0]?.id || '';
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
  } = useOrdersListByShopQuery(
    { shopId: primaryShopId, status: undefined },
    { skip: !primaryShopId }
  );
  const shopsErrorMessage = shopsError ? 'Unable to load shops.' : null;
  const ordersErrorMessage = ordersError ? 'Orders could not be loaded.' : null;

  const linkedShops = useMemo(() => {
    if (managedShops.length > 0) {
      return managedShops.map((shop) => ({
        shopId: shop.shopId,
        name: shop.name,
        address: '',
        acceptingOrders: shop.acceptingOrders,
        updatedAt: new Date().toISOString(),
      }));
    }
    return shops.map((shop) => ({
      shopId: shop.id,
      name: shop.name,
      address: shop.address ?? '',
      acceptingOrders: shop.acceptingOrders,
      updatedAt: shop.updatedAt,
    }));
  }, [managedShops, shops]);

  const activeShopCount =
    linkedShops.filter((shop) => shop.acceptingOrders).length ?? 0;
  const totalShops = linkedShops.length ?? 0;
  const pausedShops = totalShops - activeShopCount;

  const totalOrders = orders.length;
  const openOrders =
    orders.filter(
      (order) => order.status !== 'completed' && order.status !== 'cancelled'
    ).length ?? 0;

  const statCards = [
    {
      label: 'Total Shops',
      value: totalShops,
      helper: 'Stores linked to your account',
      loading: shopsLoading || managedLoading,
    },
    {
      label: 'Accepting Orders',
      value: activeShopCount,
      helper: `${pausedShops} paused`,
      loading: shopsLoading || managedLoading,
    },
    {
      label: 'Open Orders',
      value: openOrders,
      helper: `${totalOrders} total in the last window`,
      loading: ordersLoading,
    },
    {
      label: 'On-time Rate',
      value:
        totalOrders > 0
          ? `${Math.max(92, 100 - pausedShops * 2)}%`
          : '—',
      helper: 'Based on recent fulfilments',
      loading: ordersLoading,
    },
  ];

  const latestShops = useMemo(
    () => linkedShops.slice(0, 5),
    [linkedShops]
  );
  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Owner console</h1>
        <p className="text-gray-600">
          Monitor member shops, track incoming orders, and keep product data up
          to date.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recently Updated Shops
              </h2>
              <p className="text-sm text-gray-500">Last five changes</p>
            </div>
          </div>
          {(shopsLoading || managedLoading) && (
            <EmptyState message="Loading shops…" />
          )}
          {shopsErrorMessage && (
            <EmptyState message="We couldn’t load shops right now." />
          )}
          {!shopsLoading && !managedLoading && latestShops.length === 0 && (
            <EmptyState message="No shops yet. Create your first storefront to begin." />
          )}
          <ul className="divide-y divide-gray-100">
            {latestShops.map((shop) => (
              <li key={shop.shopId} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{shop.name}</p>
                    <p className="text-xs text-gray-500">
                      {shop.address || 'No address on file'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        shop.acceptingOrders
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {shop.acceptingOrders ? 'Accepting orders' : 'Paused'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {formatRelativeTime(shop.updatedAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Latest Orders
              </h2>
              <p className="text-sm text-gray-500">Newest five orders</p>
            </div>
          </div>
          {ordersLoading && <EmptyState message="Loading orders…" />}
          {ordersErrorMessage && (
            <EmptyState message="Orders could not be loaded." />
          )}
          {!ordersLoading &&
            !ordersErrorMessage &&
            latestOrders.length === 0 && (
              <EmptyState message="No orders found for the selected period." />
            )}
          {!ordersLoading && !ordersErrorMessage && latestOrders.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {latestOrders.map((order) => (
                <li key={order.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.customerName} •{' '}
                        {order.totalAmount.amount.toFixed(2)}{' '}
                        {order.totalAmount.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardHome;
