import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { skipToken } from '@reduxjs/toolkit/query';
import type {
  CreateProductInShopRequest,
  CreateProductRequest,
  ProductResponse,
} from '../../../types/apiTypes';
import {
  useProductsCreateMutation,
  useProductsInShopCreateMutation,
  useShopsMenuQuery,
  useUsersGetShopsQuery,
} from '../../../store/api/ownerApi';

type VariantInput = {
  id: string;
  label: string;
  basePrice: string;
  sku: string;
  isActive: boolean;
};

type AddonOptionInput = {
  id: string;
  name: string;
  priceDelta: string;
  isActive: boolean;
};

type AddonGroupInput = {
  id: string;
  name: string;
  required: boolean;
  maxSelectable: string;
  options: AddonOptionInput[];
};

const createVariantInput = (): VariantInput => ({
  id: crypto.randomUUID(),
  label: '',
  basePrice: '',
  sku: '',
  isActive: true,
});

const createAddonOptionInput = (): AddonOptionInput => ({
  id: crypto.randomUUID(),
  name: '',
  priceDelta: '0',
  isActive: true,
});

const createAddonGroupInput = (): AddonGroupInput => ({
  id: crypto.randomUUID(),
  name: '',
  required: false,
  maxSelectable: '1',
  options: [createAddonOptionInput()],
});

const createDefaultProductForm = () => ({
  name: '',
  description: '',
  isActive: true,
  variantSchemeName: 'Sizes',
  variants: [createVariantInput()],
  addonGroups: [] as AddonGroupInput[],
});

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
    refetch: refetchMenu,
  } = useShopsMenuQuery(menuQueryArg);

  const products = menuData?.products ?? [];
  const [createProduct, { isLoading: isCreating }] =
    useProductsCreateMutation();
  const [linkProductToShop, { isLoading: isLinking }] =
    useProductsInShopCreateMutation();

  const [newProduct, setNewProduct] = useState(createDefaultProductForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placement, setPlacement] = useState({
    priceOverride: '',
    isAvailable: true,
    categoryIds: '',
  });

  const updateVariantField = <K extends keyof VariantInput>(
    variantId: string,
    field: K,
    value: VariantInput[K],
  ) => {
    setNewProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              [field]: value,
            }
          : variant,
      ),
    }));
  };

  const addVariant = () => {
    setNewProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, createVariantInput()],
    }));
  };

  const removeVariant = (variantId: string) => {
    setNewProduct((prev) => {
      if (prev.variants.length === 1) return prev;
      return {
        ...prev,
        variants: prev.variants.filter((variant) => variant.id !== variantId),
      };
    });
  };

  const addAddonGroup = () => {
    setNewProduct((prev) => ({
      ...prev,
      addonGroups: [...prev.addonGroups, createAddonGroupInput()],
    }));
  };

  const removeAddonGroup = (groupId: string) => {
    setNewProduct((prev) => ({
      ...prev,
      addonGroups: prev.addonGroups.filter((group) => group.id !== groupId),
    }));
  };

  const updateAddonGroupField = <K extends keyof Omit<AddonGroupInput, 'options'>>(
    groupId: string,
    field: K,
    value: Omit<AddonGroupInput, 'options'>[K],
  ) => {
    setNewProduct((prev) => ({
      ...prev,
      addonGroups: prev.addonGroups.map((group) =>
        group.id === groupId ? { ...group, [field]: value } : group,
      ),
    }));
  };

  const addAddonOption = (groupId: string) => {
    setNewProduct((prev) => ({
      ...prev,
      addonGroups: prev.addonGroups.map((group) =>
        group.id === groupId
          ? { ...group, options: [...group.options, createAddonOptionInput()] }
          : group,
      ),
    }));
  };

  const updateAddonOption = <K extends keyof AddonOptionInput>(
    groupId: string,
    optionId: string,
    field: K,
    value: AddonOptionInput[K],
  ) => {
    setNewProduct((prev) => ({
      ...prev,
      addonGroups: prev.addonGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId
                  ? { ...option, [field]: value }
                  : option,
              ),
            }
          : group,
      ),
    }));
  };

  const removeAddonOption = (groupId: string, optionId: string) => {
    setNewProduct((prev) => ({
      ...prev,
      addonGroups: prev.addonGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options:
                group.options.length === 1
                  ? group.options
                  : group.options.filter((option) => option.id !== optionId),
            }
          : group,
      ),
    }));
  };

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
    if (!selectedShopId) {
      setError('Select a shop before creating a product.');
      return;
    }
    if (!newProduct.name.trim()) {
      setError('A product name is required.');
      return;
    }
    if (
      newProduct.variants.length === 0 ||
      newProduct.variants.some(
        (variant) => !variant.label.trim() || !variant.basePrice.trim(),
      )
    ) {
      setError('Each variant requires a label and price.');
      return;
    }
    try {
      setError(null);
      setFeedback(null);
      const payload: CreateProductRequest = {
        ownerUserId,
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || undefined,
        isActive: newProduct.isActive,
        variantSchemes: [
          {
            id: crypto.randomUUID(),
            name: newProduct.variantSchemeName.trim() || 'Default',
            variants: newProduct.variants.map((variant) => ({
              id: variant.id,
              label: variant.label.trim(),
              basePrice: Number(variant.basePrice),
              sku: variant.sku.trim() || undefined,
              isActive: variant.isActive,
            })),
          },
        ],
        addonGroups: newProduct.addonGroups
          .filter((group) => group.name.trim())
          .map((group) => ({
            id: group.id,
            name: group.name.trim(),
            required: group.required,
            maxSelectable: group.maxSelectable
              ? Number(group.maxSelectable)
              : undefined,
            options: group.options
              .filter((option) => option.name.trim())
              .map((option) => ({
                id: option.id,
                name: option.name.trim(),
                priceDelta: Number(option.priceDelta) || 0,
                isActive: option.isActive,
              })),
          })),
      };

      const createdProduct = await createProduct(payload).unwrap();

      const placementPayload: CreateProductInShopRequest = {
        productId: createdProduct.id,
        priceOverride: placement.priceOverride
          ? Number(placement.priceOverride)
          : undefined,
        isAvailable: placement.isAvailable,
        categoryIds: placement.categoryIds
          ? placement.categoryIds
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean)
          : [],
      };

      await linkProductToShop({
        shopId: selectedShopId,
        body: placementPayload,
      }).unwrap();

      setFeedback('Product created and added to the shop.');
      setNewProduct(createDefaultProductForm());
      setPlacement({ priceOverride: '', isAvailable: true, categoryIds: '' });
      await refetchMenu();
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
  const isProductsError = menuQueryArg === skipToken ? false : isMenuError;

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
            <div className="grid gap-4">
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={newProduct.isActive}
                  onChange={(event) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Product is active
              </label>
            </div>

            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Variant scheme
                  </p>
                  <p className="text-xs text-gray-500">
                    Group related variants like sizes or meal options.
                  </p>
                </div>
                <input
                  className="w-44 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  value={newProduct.variantSchemeName}
                  onChange={(event) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      variantSchemeName: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-3">
                {newProduct.variants.map((variant, index) => (
                  <div
                    key={variant.id}
                    className="rounded-lg border border-gray-200 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Variant #{index + 1}
                      </p>
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => removeVariant(variant.id)}
                        disabled={newProduct.variants.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Label
                        </label>
                        <input
                          className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                          value={variant.label}
                          onChange={(event) =>
                            updateVariantField(
                              variant.id,
                              'label',
                              event.target.value,
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          Base price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                          value={variant.basePrice}
                          onChange={(event) =>
                            updateVariantField(
                              variant.id,
                              'basePrice',
                              event.target.value,
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">
                          SKU (optional)
                        </label>
                        <input
                          className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                          value={variant.sku}
                          onChange={(event) =>
                            updateVariantField(
                              variant.id,
                              'sku',
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600 pt-6">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={variant.isActive}
                          onChange={(event) =>
                            updateVariantField(
                              variant.id,
                              'isActive',
                              event.target.checked,
                            )
                          }
                        />
                        Variant is active
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-blue-600 font-medium"
                  onClick={addVariant}
                >
                  + Add another variant
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Addon groups (optional)
                </p>
                <button
                  type="button"
                  className="text-sm text-blue-600 font-medium"
                  onClick={addAddonGroup}
                >
                  + Add group
                </button>
              </div>
              {newProduct.addonGroups.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Addons let customers pick extras like toppings or sauces.
                </p>
              ) : (
                <div className="space-y-4">
                  {newProduct.addonGroups.map((group, groupIndex) => (
                    <div
                      key={group.id}
                      className="rounded-lg border border-gray-200 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          Group #{groupIndex + 1}
                        </p>
                        <button
                          type="button"
                          className="text-xs text-red-600"
                          onClick={() => removeAddonGroup(group.id)}
                        >
                          Remove group
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">
                            Name
                          </label>
                          <input
                            className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                            value={group.name}
                            onChange={(event) =>
                              updateAddonGroupField(
                                group.id,
                                'name',
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">
                            Max selectable
                          </label>
                          <input
                            type="number"
                            min={1}
                            className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                            value={group.maxSelectable}
                            onChange={(event) =>
                              updateAddonGroupField(
                                group.id,
                                'maxSelectable',
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={group.required}
                          onChange={(event) =>
                            updateAddonGroupField(
                              group.id,
                              'required',
                              event.target.checked,
                            )
                          }
                        />
                        Selection required
                      </label>
                      <div className="space-y-3 rounded border border-gray-100 p-3">
                        {group.options.map((option, optionIndex) => (
                          <div
                            key={option.id}
                            className="grid gap-3 md:grid-cols-3"
                          >
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Option #{optionIndex + 1}
                              </label>
                              <input
                                className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                value={option.name}
                                onChange={(event) =>
                                  updateAddonOption(
                                    group.id,
                                    option.id,
                                    'name',
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600">
                                Price delta
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1"
                                value={option.priceDelta}
                                onChange={(event) =>
                                  updateAddonOption(
                                    group.id,
                                    option.id,
                                    'priceDelta',
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={option.isActive}
                                  onChange={(event) =>
                                    updateAddonOption(
                                      group.id,
                                      option.id,
                                      'isActive',
                                      event.target.checked,
                                    )
                                  }
                                />
                                Active
                              </label>
                              <button
                                type="button"
                                className="text-xs text-red-600"
                                onClick={() =>
                                  removeAddonOption(group.id, option.id)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-xs text-blue-600"
                          onClick={() => addAddonOption(group.id)}
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Shop-specific placement
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Price override (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
                  value={placement.priceOverride}
                  onChange={(event) =>
                    setPlacement((prev) => ({
                      ...prev,
                      priceOverride: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Category IDs (comma separated)
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1"
                  value={placement.categoryIds}
                  onChange={(event) =>
                    setPlacement((prev) => ({
                      ...prev,
                      categoryIds: event.target.value,
                    }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={placement.isAvailable}
                  onChange={(event) =>
                    setPlacement((prev) => ({
                      ...prev,
                      isAvailable: event.target.checked,
                    }))
                  }
                />
                Item available in this shop
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {feedback && <p className="text-sm text-green-600">{feedback}</p>}
            <button
              type="submit"
              disabled={isCreating || isLinking}
              className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isCreating || isLinking ? 'Saving…' : 'Create product'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProductsPage;
