import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { skipToken } from '@reduxjs/toolkit/query';
import type { ProductResponse } from '../../../types/apiTypes';
import {
  useProductsCreateMutation,
  useShopsMenuQuery,
  useUsersGetShopsQuery,
} from '../../../store/api/ownerApi';

const ProductsPage = () => {
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';

  const shopsQueryArg = ownerUserId ? { userId: ownerUserId } : skipToken;
  const {
    data: userShops,
    isLoading: isShopsLoading,
  } = useUsersGetShopsQuery(shopsQueryArg);
  const [selectedShopId, setSelectedShopId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedShopId && userShops?.length) {
      setSelectedShopId(userShops[0].shopId);
    }
  }, [selectedShopId, userShops]);

  const menuQueryArg = selectedShopId ?? skipToken;
  const {
    data: menuData,
    isLoading: isMenuLoading,
    isError: isMenuError,
  } = useShopsMenuQuery(menuQueryArg);

  const products = menuData?.products ?? [];
  const [createProduct, { isLoading: isCreating }] =
    useProductsCreateMutation();

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.isActive).length;
  const variantHeavy = products.filter(
    (product) => product.variantSchemes.length > 0,
  ).length;

  const sortedProducts = useMemo(
    () =>
      [...products].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [products],
  );

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ownerUserId) {
      setError('Unable to resolve owner identity.');
      return;
    }
    if (!newProduct.name.trim()) {
      setError('A product name is required.');
      return;
    }
    try {
      setError(null);
      setFeedback(null);
      await createProduct({
        ownerUserId,
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || undefined,
      }).unwrap();
      setFeedback('Product created.');
      setNewProduct({ name: '', description: '' });
    } catch (err) {
      setFeedback(null);
      setError(
        err instanceof Error ? err.message : 'Product could not be saved.',
      );
    }
  };

  const renderProductRow = (product: ProductResponse) => (
    <tr key={product.id}>
      <td className="px-4 py-4">
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          {product.description ? (
            <p className="text-xs text-gray-500">{product.description}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {product.variantSchemes.length} variants
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">
        {product.addonGroups.length} addon groups
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            product.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {product.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-gray-500">
        {new Date(product.updatedAt).toLocaleDateString()}
      </td>
    </tr>
  );

  const isLoadingProducts =
    menuQueryArg === skipToken ? isShopsLoading : isMenuLoading;
  const isProductsError =
    menuQueryArg === skipToken ? false : isMenuError;

  const noShopsAvailable =
    !isShopsLoading && (userShops?.length ?? 0) === 0;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-gray-600">
          Create shared SKUs and keep catalogue metadata synchronised across
          shops.
        </p>
      </header>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Choose a shop
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedShopId ?? ''}
          onChange={(event) =>
            setSelectedShopId(event.target.value || undefined)
          }
          disabled={isShopsLoading || noShopsAvailable}
        >
          <option value="" disabled>
            {isShopsLoading
              ? 'Loading shops…'
              : noShopsAvailable
                ? 'No shops available'
                : 'Select a shop'}
          </option>
          {userShops?.map((shop) => (
            <option key={shop.shopId} value={shop.shopId}>
              {shop.name}
            </option>
          ))}
        </select>
        {!selectedShopId && !isShopsLoading && !noShopsAvailable ? (
          <p className="text-xs text-gray-500">
            Select a shop to view its available products.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">Total products</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">
            {isLoadingProducts ? '…' : totalProducts}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">
            {isLoadingProducts ? '…' : activeProducts}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">With variants</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">
            {isLoadingProducts ? '…' : variantHeavy}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm lg:col-span-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Addons</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingProducts && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    Loading products…
                  </td>
                </tr>
              )}
              {isProductsError && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    Unable to load products.
                  </td>
                </tr>
              )}
              {!isLoadingProducts &&
                !isProductsError &&
                selectedShopId &&
                sortedProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm">
                      No products have been added yet.
                    </td>
                  </tr>
              )}
              {!selectedShopId && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm">
                    Select a shop to view its products.
                  </td>
                </tr>
              )}
              {selectedShopId &&
                sortedProducts.map((product) => renderProductRow(product))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            New product
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Products represent the canonical definition across every shop.
          </p>
          <form className="space-y-4" onSubmit={handleCreateProduct}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                required
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newProduct.name}
                onChange={(event) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={newProduct.description}
                onChange={(event) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
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
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {feedback && <p className="text-sm text-green-600">{feedback}</p>}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating ? 'Saving…' : 'Create product'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProductsPage;
