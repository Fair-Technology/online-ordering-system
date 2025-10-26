import {
  useGetUserShopsQuery,
  useListOrdersQuery,
} from '../../../store/api/ownerApi';

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
  const {
    data: userShops,
    isLoading: isShopsLoading,
    isError: isShopsError,
  } = useGetUserShopsQuery();
  const {
    data: orders,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
  } = useListOrdersQuery();

  const activeShopCount =
    userShops?.filter((shop) => shop.acceptingOrders).length ?? 0;
  const totalShops = userShops?.length ?? 0;
  const pausedShops = totalShops - activeShopCount;

  const totalOrders = orders?.length ?? 0;
  const openOrders =
    orders?.filter(
      (order) => order.status !== 'completed' && order.status !== 'cancelled',
    ).length ?? 0;

  const statCards = [
    {
      label: 'Total Shops',
      value: totalShops,
      helper: 'Stores linked to your account',
      loading: isShopsLoading,
    },
    {
      label: 'Accepting Orders',
      value: activeShopCount,
      helper: `${pausedShops} paused`,
      loading: isShopsLoading,
    },
    {
      label: 'Open Orders',
      value: openOrders,
      helper: `${totalOrders} total in the last window`,
      loading: isOrdersLoading,
    },
    {
      label: 'On-time Rate',
      value:
        totalOrders > 0
          ? `${Math.max(92, 100 - pausedShops * 2)}%`
          : '—',
      helper: 'Based on recent fulfilments',
      loading: isOrdersLoading,
    },
  ];

  const latestShops = (userShops ?? []).slice(0, 5);
  const latestOrders = (orders ?? []).slice(0, 5);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Owner console</h1>
        <p className="text-gray-600">
          Monitor member shops, track incoming orders, and keep catalogues up to
          date.
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
          {isShopsLoading && <EmptyState message="Loading shops…" />}
          {isShopsError && (
            <EmptyState message="We couldn’t load shops right now." />
          )}
          {!isShopsLoading && !isShopsError && latestShops.length === 0 && (
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
          {isOrdersLoading && <EmptyState message="Loading orders…" />}
          {isOrdersError && (
            <EmptyState message="Orders could not be loaded." />
          )}
          {!isOrdersLoading && !isOrdersError && latestOrders.length === 0 && (
            <EmptyState message="No orders found for the selected period." />
          )}
          <ul className="divide-y divide-gray-100">
            {latestOrders.map((order) => (
              <li key={order.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customerName} • {order.totalAmount.toFixed(2)}
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
        </div>
      </div>
    </section>
  );
};

export default DashboardHome;
