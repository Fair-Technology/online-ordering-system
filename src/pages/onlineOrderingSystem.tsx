import { Link } from 'react-router';
import { useGetShopsQuery } from '../services/api';
import { resolveShopBranding } from '../utils/branding';

const OnlineOrderingSystem = () => {
  const { data, isLoading, isError } = useGetShopsQuery();
  const shops = data?.shops ?? [];

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-gray-900 text-center">
          Welcome to Online Ordering System
        </h1>
        <p className="mt-3 text-center text-gray-600 max-w-xl mx-auto">
          Browse and order from your favorite storefronts.
        </p>

        <div className="mt-10">
          {isLoading && (
            <p className="text-center text-gray-500">Loading shops…</p>
          )}

          {isError && (
            <p className="text-center text-red-500">Failed to load shops.</p>
          )}

          {!isLoading && !isError && shops.length === 0 && (
            <p className="text-center text-gray-500">No shops available.</p>
          )}

          {!isLoading && !isError && shops.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {shops.map((shop) => {
                const branding = resolveShopBranding(shop.branding);
                return (
                  <Link
                    key={shop.id}
                    to={`/shops/${shop.slug}`}
                    className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <img
                      src={branding.logoUrl}
                      alt={shop.name}
                      className="h-16 w-16 rounded-full object-cover bg-gray-100"
                    />
                    <span className="mt-4 text-center text-sm font-medium text-gray-800">
                      {shop.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineOrderingSystem;
