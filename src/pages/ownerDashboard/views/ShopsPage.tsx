import { FormEvent, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import {
  SHOP_STATUSES,
  type ShopSummary,
} from '../../../types/apiTypes';
import {
  useCreateShopMutation,
  useGetShopsQuery,
} from '../../../store/api/ownerApi';

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
};

const ShopStatusBadge = ({ status }: { status: ShopSummary['status'] }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      statusStyles[status] ?? 'bg-gray-100 text-gray-700'
    }`}
  >
    {status.replace(/_/g, ' ')}
  </span>
);

const ShopsPage = () => {
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';

  const { data: shops, isLoading, isError } = useGetShopsQuery();
  const [createShop, { isLoading: isCreating }] = useCreateShopMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [newShop, setNewShop] = useState({ name: '', address: '' });

  const filteredShops = useMemo(() => {
    if (!shops) return [];
    if (!searchTerm) return shops;
    const lower = searchTerm.toLowerCase();
    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(lower) ||
        shop.address?.toLowerCase().includes(lower),
    );
  }, [shops, searchTerm]);

  const handleCreateShop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newShop.name || !newShop.address || !ownerUserId) {
      setCreationError(
        'Name, address, and a valid owner identity are required to create a shop.',
      );
      return;
    }

    try {
      setCreationError(null);
      await createShop({
        name: newShop.name.trim(),
        address: newShop.address.trim(),
        ownerUserId,
      }).unwrap();
      setCreationSuccess('Shop created successfully.');
      setNewShop({ name: '', address: '' });
    } catch (error) {
      setCreationSuccess(null);
      setCreationError(
        error instanceof Error
          ? error.message
          : 'Unable to create shop. Please try again.',
      );
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Shops</h1>
          <p className="text-gray-600">
            Review and provision storefronts linked to your owner account.
          </p>
        </div>
        <input
          type="search"
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name or address"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {SHOP_STATUSES.map((status) => {
          const count =
            shops?.filter((shop) => shop.status === status).length ?? 0;
          return (
            <div
              key={status}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
            >
              <p className="text-sm text-gray-500 capitalize">{status}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">
                {isLoading ? '…' : count}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Accepting orders</th>
                <th className="px-4 py-3">Payment policy</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    Loading shops…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    We could not load shops. Please refresh.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredShops.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    No shops match the current filter.
                  </td>
                </tr>
              )}
              {filteredShops.map((shop) => (
                <tr key={shop.id}>
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
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        shop.acceptingOrders
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {shop.acceptingOrders ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-4 capitalize text-sm text-gray-700">
                    {shop.paymentPolicy.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(shop.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Create a shop
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A shop links a location, catalogue, and fulfilment settings to your
            owner account.
          </p>

          <form className="space-y-4" onSubmit={handleCreateShop}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newShop.name}
                onChange={(event) =>
                  setNewShop((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newShop.address}
                onChange={(event) =>
                  setNewShop((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Owner user ID
              </label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={ownerUserId}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Derived from your signed-in Microsoft Entra identity.
              </p>
            </div>
            {creationError && (
              <p className="text-sm text-red-600">{creationError}</p>
            )}
            {creationSuccess && (
              <p className="text-sm text-green-600">{creationSuccess}</p>
            )}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating ? 'Creating…' : 'Create shop'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ShopsPage;
