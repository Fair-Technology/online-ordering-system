import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, type ApiShape } from '../../../config/api';

type CatalogProduct = Awaited<ReturnType<ApiShape['getCatalogProduct']>>;
type CatalogProductList = Awaited<
  ReturnType<ApiShape['listCatalogProducts']>
>;
type CatalogProductSummary = CatalogProductList[number];
type Shop = Awaited<ReturnType<ApiShape['listShops']>>[number];
type ShopMenu = Awaited<ReturnType<ApiShape['getShopMenu']>>;
type ShopCatalogEntry = ShopMenu['catalogEntries'][number];
type CategoryNode = ShopMenu['categories'][number];
type CategoryTreeItem = CategoryNode & { children: CategoryTreeItem[] };
type CatalogVariantGroupPayload =
  Parameters<ApiShape['createCatalogProduct']>[0]['variantGroups'][number];
type CatalogAddonGroupPayload =
  Parameters<ApiShape['createCatalogProduct']>[0]['addonGroups'][number];
type MoneyInput = CatalogVariantGroupPayload['variants'][number]['basePrice'];
const salesChannelOptions: Array<'online' | 'pos' | 'kiosk'> = [
  'online',
  'pos',
  'kiosk',
];

type VariantDraft = Omit<CatalogVariantGroupPayload['variants'][number], 'basePrice'> & {
  basePrice: MoneyInput;
};

type VariantGroupDraft = Omit<CatalogVariantGroupPayload, 'variants'> & {
  variants: VariantDraft[];
};

type AddonGroupDraft = Omit<CatalogAddonGroupPayload, 'options'> & {
  options: CatalogAddonGroupPayload['options'];
};

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tmp-${Math.random().toString(36).slice(2, 10)}`;

const defaultMoney = (currency = 'USD'): MoneyInput => ({
  amount: 0,
  currency,
});

const emptyVariant = (currency = 'USD'): VariantDraft => ({
  id: createId(),
  label: '',
  basePrice: defaultMoney(currency),
  sku: '',
  isActive: true,
  attributes: {},
});

const emptyVariantGroup = (currency = 'USD'): VariantGroupDraft => ({
  id: createId(),
  name: 'Primary sizes',
  selectionMode: 'single',
  variants: [emptyVariant(currency)],
});

const emptyAddonGroup = (currency = 'USD'): AddonGroupDraft => ({
  id: createId(),
  name: 'Add-ons',
  required: false,
  maxSelectable: 0,
  options: [
    {
      id: createId(),
      label: 'Extra shot',
      priceDelta: defaultMoney(currency),
      isActive: true,
    },
  ],
});

const CatalogModule = ({
  view,
}: {
  view: 'products' | 'entries' | 'categories';
}) => {
  const [products, setProducts] = useState<CatalogProductSummary[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(
    null
  );
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>(
    'create'
  );
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [shopMenu, setShopMenu] = useState<ShopMenu | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    parentCategoryId: '',
    isActive: true,
    editingId: '',
  });
  const [categorySaving, setCategorySaving] = useState(false);
  const [entrySaving, setEntrySaving] = useState<string | null>(null);
  const [entryForm, setEntryForm] = useState({
    productId: '',
    categoryIds: [] as string[],
    isAvailable: true,
    salesChannels: [] as Array<'online' | 'pos' | 'kiosk'>,
    priceAmount: '',
    priceCurrency: 'USD',
  });
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productFormState, setProductFormState] = useState({
    title: '',
    description: '',
    tags: '',
    isActive: true,
    variantGroups: [emptyVariantGroup()],
    addonGroups: [emptyAddonGroup()],
    defaultCurrency: 'USD',
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productStep, setProductStep] = useState(1);
  const productSteps = ['Product basics', 'Variants', 'Add-ons & review'];
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await api.listCatalogProducts();
      setProducts(data);
    } catch (error) {
      setProductsError(
        error instanceof Error ? error.message : 'Unable to load products.'
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadShops = useCallback(async () => {
    setShopsLoading(true);
    try {
      const data = await api.listShops();
      setShops(data);
      if (!selectedShopId && data.length) {
        setSelectedShopId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShopsLoading(false);
    }
  }, [selectedShopId]);

  const loadShopMenu = useCallback(
    async (shopId: string) => {
      if (!shopId) return;
      setMenuLoading(true);
      setMenuError(null);
      try {
        const menu = await api.getShopMenu(shopId);
        setShopMenu(menu);
      } catch (error) {
        setMenuError(
          error instanceof Error ? error.message : 'Unable to load shop menu.'
        );
      } finally {
        setMenuLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadProducts();
    loadShops();
  }, [loadProducts, loadShops]);

  useEffect(() => {
    if (selectedShopId) {
      loadShopMenu(selectedShopId);
    }
  }, [selectedShopId, loadShopMenu]);

  const resetProductForm = () => {
    setProductFormMode('create');
    setEditingProduct(null);
    setProductFormState({
      title: '',
      description: '',
      tags: '',
      isActive: true,
      variantGroups: [emptyVariantGroup()],
      addonGroups: [emptyAddonGroup()],
      defaultCurrency: 'USD',
    });
    setProductStep(1);
  };

  const openProductModal = (mode: 'create' | 'edit') => {
    setProductFormMode(mode);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductStep(1);
    setEditingProduct(null);
    resetProductForm();
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductSubmitting(true);
    try {
      const payload = {
        title: productFormState.title,
        description: productFormState.description,
        tags: productFormState.tags
          ? productFormState.tags.split(',').map((tag) => tag.trim())
          : [],
        variantGroups: productFormState.variantGroups.map((group) => ({
          id: group.id,
          name: group.name,
          selectionMode: group.selectionMode,
          variants: group.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            basePrice: {
              amount: Number(variant.basePrice.amount),
              currency:
                variant.basePrice.currency || productFormState.defaultCurrency,
            },
            sku: variant.sku,
            isActive: variant.isActive,
            attributes: variant.attributes,
          })),
        })),
        addonGroups: productFormState.addonGroups.map((group) => ({
          id: group.id,
          name: group.name,
          required: group.required,
          maxSelectable: group.maxSelectable,
          options: group.options.map((option) => ({
            id: option.id,
            label: option.label,
            priceDelta: {
              amount: Number(option.priceDelta.amount),
              currency:
                option.priceDelta.currency || productFormState.defaultCurrency,
            },
            isActive: option.isActive,
          })),
        })),
        isActive: productFormState.isActive,
      } as Parameters<ApiShape['createCatalogProduct']>[0];

      if (productFormMode === 'create') {
        await api.createCatalogProduct(payload);
      } else if (editingProduct) {
        await api.updateCatalogProduct(editingProduct.id, payload);
      }
      await loadProducts();
      closeProductModal();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to save catalog product.'
      );
    } finally {
      setProductSubmitting(false);
    }
  };

  const onEditProduct = async (productId: string) => {
    try {
      const product = await api.getCatalogProduct(productId);
      setEditingProduct(product);
      setProductFormMode('edit');
      setProductFormState({
        title: product.title,
        description: product.description ?? '',
        tags: product.tags?.join(', ') ?? '',
        isActive: product.isActive,
        defaultCurrency:
          product.variantGroups[0]?.variants[0]?.basePrice.currency ?? 'USD',
        variantGroups: product.variantGroups.map((group) => ({
          id: group.id,
          name: group.name,
          selectionMode: group.selectionMode,
          variants: group.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            basePrice: {
              amount: variant.basePrice.amount,
              currency: variant.basePrice.currency,
            },
            sku: variant.sku,
            isActive: variant.isActive,
            attributes: variant.attributes,
          })),
        })),
        addonGroups: product.addonGroups.map((group) => ({
          id: group.id,
          name: group.name,
          required: group.required,
          maxSelectable: group.maxSelectable,
          options: group.options.map((option) => ({
            id: option.id,
            label: option.label,
            priceDelta: {
              amount: option.priceDelta.amount,
              currency: option.priceDelta.currency,
            },
            isActive: option.isActive,
          })),
        })),
      });
      setProductStep(1);
      openProductModal('edit');
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to load product data.'
      );
    }
  };

  const onDeleteProduct = async (productId: string) => {
    if (
      !window.confirm(
        'Deleting a catalog product removes it from future menus. Continue?'
      )
    ) {
      return;
    }
    try {
      await api.deleteCatalogProduct(productId);
      await loadProducts();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to delete product.'
      );
    }
  };

  const categoriesById = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    shopMenu?.categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [shopMenu]);

  const categoryTree: CategoryTreeItem[] = useMemo(() => {
    if (!shopMenu?.categories) return [];
    const map = new Map<string, CategoryTreeItem>();
    shopMenu.categories.forEach((category) => {
      map.set(category.id, { ...category, children: [] });
    });
    const roots: CategoryTreeItem[] = [];
    map.forEach((category) => {
      if (category.parentCategoryId) {
        const parent = map.get(category.parentCategoryId);
        parent?.children.push(category);
      } else {
        roots.push(category);
      }
    });
    const sortChildren = (nodes: CategoryTreeItem[]) => {
      nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      nodes.forEach((node) => sortChildren(node.children));
    };
    sortChildren(roots);
    return roots;
  }, [shopMenu]);

  const hasAtLeastOneVariant = useMemo(
    () =>
      productFormState.variantGroups.some((group) =>
        group.variants.some((variant) => variant.label.trim())
      ),
    [productFormState.variantGroups]
  );

  const isStepReady = (step: number) => {
    if (step === 1) {
      return productFormState.title.trim().length > 0;
    }
    if (step === 2) {
      return hasAtLeastOneVariant;
    }
    return true;
  };

  const renderProductStepContent = () => {
    if (productStep === 1) {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Product title
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={productFormState.title}
                onChange={(event) =>
                  setProductFormState((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Downtown Blend Latte"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Tags
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={productFormState.tags}
                onChange={(event) =>
                  setProductFormState((prev) => ({
                    ...prev,
                    tags: event.target.value,
                  }))
                }
                placeholder="espresso, seasonal"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Story & description
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={productFormState.description}
              onChange={(event) =>
                setProductFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Tell customers what makes this product special."
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-700">Product status</span>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                productFormState.isActive
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() =>
                setProductFormState((prev) => ({
                  ...prev,
                  isActive: !prev.isActive,
                }))
              }
            >
              {productFormState.isActive ? 'Active' : 'Inactive'}
            </button>
          </label>
        </div>
      );
    }

    if (productStep === 2) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Define variant groups (sizes, formats, etc.) with their Money inputs.
          </p>
          <VariantGroupsEditor
            groups={productFormState.variantGroups}
            onChange={(variantGroups) =>
              setProductFormState((prev) => ({ ...prev, variantGroups }))
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Optional add-ons help with upsells. Keep them concise and easy to scan.
          </p>
          <AddonGroupsEditor
            groups={productFormState.addonGroups}
            onChange={(addonGroups) =>
              setProductFormState((prev) => ({ ...prev, addonGroups }))
            }
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Quick review</p>
          <dl className="grid gap-3 md:grid-cols-2 text-sm text-gray-600">
            <div>
              <dt className="font-medium text-gray-700">Title</dt>
              <dd>{productFormState.title || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Tags</dt>
              <dd>{productFormState.tags || '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Variants</dt>
              <dd>
                {productFormState.variantGroups.reduce(
                  (count, group) => count + group.variants.length,
                  0
                )}{' '}
                configured
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Add-ons</dt>
              <dd>
                {productFormState.addonGroups.reduce(
                  (count, group) => count + group.options.length,
                  0
                )}{' '}
                options
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  };

  const heroCopies = {
    products: {
      eyebrow: 'Catalog products',
      title: 'Craft, launch, and maintain your best-sellers',
      description:
        'Centralize every catalog asset with guided workflows and consistent pricing controls.',
      primaryStatLabel: 'Active products',
      primaryStatValue: products.filter((product) => product.isActive).length,
      secondaryStatLabel: 'Variant groups',
      secondaryStatValue: products.reduce(
        (count, product) => count + product.variantGroups.length,
        0
      ),
    },
    entries: {
      eyebrow: 'Shop catalog entries',
      title: 'Control availability across every storefront',
      description:
        'Toggle channels, override pricing, and ensure each shop is merchandised for its audience.',
      primaryStatLabel: 'Catalog entries',
      primaryStatValue: shopMenu?.catalogEntries.length ?? 0,
      secondaryStatLabel: 'Connected shops',
      secondaryStatValue: shops.length,
    },
    categories: {
      eyebrow: 'Category architecture',
      title: 'Keep menus structured and intuitive',
      description:
        'Build nested hierarchies, manage visibility, and keep ordering experiences cohesive.',
      primaryStatLabel: 'Active categories',
      primaryStatValue:
        shopMenu?.categories.filter((category) => category.isActive).length ??
        0,
      secondaryStatLabel: 'Top-level groups',
      secondaryStatValue: categoryTree.length,
    },
  } as const;
  const heroContent = heroCopies[view];
  const showProductsView = view === 'products';
  const showEntriesView = view === 'entries';
  const showCategoriesView = view === 'categories';

  const renderProductsSection = () => {
    if (!showProductsView) return null;
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Catalog products
            </h2>
            <p className="text-sm text-gray-600">
              Craft reusable products including variant and add-on pricing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
              onClick={() => {
                resetProductForm();
                openProductModal('create');
              }}
            >
              New product
            </button>
          </div>
        </header>
        {productsLoading ? (
          <p className="text-sm text-gray-500">Loading catalog…</p>
        ) : productsError ? (
          <p className="text-sm text-red-600">{productsError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Variants</th>
                  <th className="px-4 py-2">Add-ons</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {product.description ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      {product.variantGroups.reduce(
                        (count, group) => count + group.variants.length,
                        0
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {product.addonGroups.reduce(
                        (count, group) => count + group.options.length,
                        0
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:underline"
                        onClick={() => onEditProduct(product.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:underline"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  };

  const renderEntriesSection = () => {
    if (!showEntriesView) return null;
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Shop catalog entries
            </h2>
            <p className="text-sm text-gray-600">
              Control availability, categories, pricing, and sales channels per
              shop.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={selectedShopId}
              onChange={(event) => setSelectedShopId(event.target.value)}
              disabled={shopsLoading}
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
              onClick={() => {
                setEntryForm({
                  productId: '',
                  categoryIds: [],
                  isAvailable: true,
                  salesChannels: [],
                  priceAmount: '',
                  priceCurrency: 'USD',
                });
                setIsEntryModalOpen(true);
              }}
            >
              New catalog entry
            </button>
          </div>
        </header>
        {menuLoading ? (
          <p className="text-sm text-gray-500">Loading shop menu…</p>
        ) : menuError ? (
          <p className="text-sm text-red-600">{menuError}</p>
        ) : (
          <div className="space-y-4">
            {shopMenu?.catalogEntries.length ? (
              shopMenu.catalogEntries.map((entry) => {
                const product = products.find(
                  (item) => item.id === entry.productId
                );
                return (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-gray-200 p-4 space-y-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {product?.title ?? entry.productId}
                        </p>
                        <p className="text-xs text-gray-500">
                          Entry #{entry.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-gray-700">
                          Available
                        </label>
                        <button
                          type="button"
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            entry.isAvailable
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          disabled={entrySaving === entry.id}
                          onClick={() =>
                            handleEntryUpdate(entry, {
                              isAvailable: !entry.isAvailable,
                            })
                          }
                        >
                          {entry.isAvailable ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Categories
                        </label>
                        <select
                          multiple
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 h-28"
                          value={entry.categoryIds}
                          onChange={(event) => {
                            const selected = Array.from(
                              event.target.selectedOptions
                            ).map((option) => option.value);
                            handleEntryUpdate(entry, { categoryIds: selected });
                          }}
                          disabled={entrySaving === entry.id}
                        >
                          {shopMenu?.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Price override
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="number"
                            className="w-24 rounded-md border border-gray-300 px-3 py-2"
                            placeholder="Amount"
                            value={entry.priceOverride?.amount ?? ''}
                            onChange={(event) =>
                              handleEntryUpdate(entry, {
                                priceOverride: {
                                  amount: Number(event.target.value),
                                  currency:
                                    entry.priceOverride?.currency ?? 'USD',
                                },
                              })
                            }
                            disabled={entrySaving === entry.id}
                          />
                          <input
                            className="w-20 rounded-md border border-gray-300 px-3 py-2 uppercase"
                            value={entry.priceOverride?.currency ?? 'USD'}
                            onChange={(event) =>
                              handleEntryUpdate(entry, {
                                priceOverride: {
                                  amount: entry.priceOverride?.amount ?? 0,
                                  currency: event.target.value.toUpperCase(),
                                },
                              })
                            }
                            disabled={entrySaving === entry.id}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Sales channels
                        </label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {salesChannelOptions.map((channel) => (
                            <label
                              key={channel}
                              className="inline-flex items-center gap-2 text-xs text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={entry.salesChannels?.includes(channel)}
                                onChange={(event) => {
                                  const next = new Set(
                                    entry.salesChannels ?? []
                                  );
                                  if (event.target.checked) {
                                    next.add(channel);
                                  } else {
                                    next.delete(channel);
                                  }
                                  handleEntryUpdate(entry, {
                                    salesChannels: Array.from(next) as Array<
                                      'online' | 'pos' | 'kiosk'
                                    >,
                                  });
                                }}
                                disabled={entrySaving === entry.id}
                              />
                              {channel.toUpperCase()}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                No entries yet for this shop.
              </p>
            )}
          </div>
        )}
      </section>
    );
  };

  const renderCategoriesSection = () => {
    if (!showCategoriesView) return null;
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <header>
          <h2 className="text-lg font-semibold text-gray-900">
            Hierarchical categories
          </h2>
          <p className="text-sm text-gray-600">
            Drag-inspired structure for menu organization. Select a category to
            edit, or create new nodes.
          </p>
          <div className="mt-4">
            <button
              type="button"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
              onClick={() => {
                setCategoryForm({
                  name: '',
                  description: '',
                  sortOrder: 0,
                  parentCategoryId: '',
                  isActive: true,
                  editingId: '',
                });
                setIsCategoryModalOpen(true);
              }}
            >
              New category
            </button>
          </div>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            {categoryTree.length === 0 && (
              <p className="text-sm text-gray-500">
                No categories yet. Create one using the form.
              </p>
            )}
            {categoryTree.map((category) => (
              <CategoryTreeNode
                key={category.id}
                node={category}
                depth={0}
                onSelect={onSelectCategory}
              />
            ))}
          </div>
          <form className="space-y-4" onSubmit={handleCategorySubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Parent category
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  value={categoryForm.parentCategoryId}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      parentCategoryId: event.target.value,
                    }))
                  }
                >
                  <option value="">Top level</option>
                  {shopMenu?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sort order
                </label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  value={categoryForm.sortOrder}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Category active
            </label>
            {categoryError && (
              <p className="text-sm text-red-600">{categoryError}</p>
            )}
            {categorySuccess && (
              <p className="text-sm text-green-600">{categorySuccess}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              {categoryForm.editingId && (
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:text-gray-900"
                  onClick={() =>
                    setCategoryForm({
                      name: '',
                      description: '',
                      sortOrder: 0,
                      parentCategoryId: '',
                      isActive: true,
                      editingId: '',
                    })
                  }
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={categorySaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {categorySaving
                  ? 'Saving…'
                  : categoryForm.editingId
                  ? 'Update category'
                  : 'Create category'}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  };

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShopId) return;
    setCategorySaving(true);
    setCategoryError(null);
    setCategorySuccess(null);
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        parentCategoryId: categoryForm.parentCategoryId || undefined,
        sortOrder: Number(categoryForm.sortOrder),
        isActive: categoryForm.isActive,
      };
      if (categoryForm.editingId) {
        await api.updateCategory(selectedShopId, categoryForm.editingId, payload);
        setCategorySuccess('Category updated.');
      } else {
        await api.createCategory(selectedShopId, payload);
        setCategorySuccess('Category created.');
      }
      await loadShopMenu(selectedShopId);
      setCategoryForm({
        name: '',
        description: '',
        sortOrder: 0,
        parentCategoryId: '',
        isActive: true,
        editingId: '',
      });
      setIsCategoryModalOpen(false);
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : 'Unable to save category.'
      );
    } finally {
      setCategorySaving(false);
    }
  };

  const onSelectCategory = (categoryId: string) => {
    const category = categoriesById.get(categoryId);
    if (!category) return;
    setCategoryForm({
      name: category.name,
      description: category.description ?? '',
      sortOrder: category.sortOrder ?? 0,
      parentCategoryId: category.parentCategoryId ?? '',
      isActive: category.isActive,
      editingId: category.id,
    });
  };

  const handleEntryUpdate = async (
    entry: ShopCatalogEntry,
    updates: Partial<ShopCatalogEntry>
  ) => {
    if (!selectedShopId) return;
    setEntrySaving(entry.id);
    try {
      await api.updateShopCatalogEntry(selectedShopId, entry.id, {
        productId: entry.productId,
        categoryIds: updates.categoryIds ?? entry.categoryIds,
        isAvailable: updates.isAvailable ?? entry.isAvailable,
        salesChannels: (updates.salesChannels ??
          entry.salesChannels) as Array<'online' | 'pos' | 'kiosk'>,
        priceOverride: updates.priceOverride
          ? {
              amount: Number(updates.priceOverride.amount),
              currency: updates.priceOverride.currency,
            }
          : entry.priceOverride,
      } as Partial<Parameters<ApiShape['updateShopCatalogEntry']>[2]>);
      await loadShopMenu(selectedShopId);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to update catalog entry.'
      );
    } finally {
      setEntrySaving(null);
    }
  };

  const handleEntryCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShopId || !entryForm.productId) return;
    setEntrySaving('new');
    try {
      await api.createShopCatalogEntry(selectedShopId, {
        productId: entryForm.productId,
        categoryIds: entryForm.categoryIds,
        isAvailable: entryForm.isAvailable,
        salesChannels: entryForm.salesChannels,
        priceOverride: entryForm.priceAmount
          ? {
              amount: Number(entryForm.priceAmount),
              currency: entryForm.priceCurrency,
            }
          : undefined,
      });
      await loadShopMenu(selectedShopId);
      setEntryForm({
        productId: '',
        categoryIds: [],
        isAvailable: true,
        salesChannels: [],
        priceAmount: '',
        priceCurrency: 'USD',
      });
      setIsEntryModalOpen(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to create catalog entry.'
      );
    } finally {
      setEntrySaving(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-blue-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              {heroContent.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold">{heroContent.title}</h1>
            <p className="text-sm text-white/80 max-w-2xl mt-2">
              {heroContent.description}
            </p>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-white/70 text-xs">
                {heroContent.primaryStatLabel}
              </p>
              <p className="text-2xl font-semibold">
                {heroContent.primaryStatValue}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-white/70 text-xs">
                {heroContent.secondaryStatLabel}
              </p>
              <p className="text-2xl font-semibold">
                {heroContent.secondaryStatValue || '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 opacity-30 blur-3xl">
          <div className="h-full w-64 bg-white/30 rounded-full translate-x-1/2 rotate-12" />
        </div>
      </div>
      {renderProductsSection()}
      {renderEntriesSection()}
      {renderCategoriesSection()}

      {isProductModalOpen ? (
        <Modal
          title={
            productFormMode === 'create'
              ? 'Create catalog product'
              : 'Edit catalog product'
          }
          onClose={closeProductModal}
        >
          <form className="space-y-6" onSubmit={handleProductSubmit}>
            <StepIndicator steps={productSteps} currentStep={productStep} />
            {renderProductStepContent()}
            <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-900"
                onClick={closeProductModal}
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                {productStep > 1 && (
                  <button
                    type="button"
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => setProductStep((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                )}
                {productStep < productSteps.length ? (
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => setProductStep((prev) => prev + 1)}
                    disabled={!isStepReady(productStep)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      productSubmitting ||
                      !productFormState.title.trim() ||
                      !hasAtLeastOneVariant
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {productSubmitting
                      ? 'Saving…'
                      : productFormMode === 'create'
                      ? 'Publish product'
                      : 'Save changes'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </Modal>
      ) : null}

      {isEntryModalOpen ? (
        <Modal
          title="Create catalog entry"
          onClose={() => setIsEntryModalOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleEntryCreate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Catalog product
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  value={entryForm.productId}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      productId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Categories
                </label>
                <select
                  multiple
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 h-28"
                  value={entryForm.categoryIds}
                  onChange={(event) => {
                    const values = Array.from(event.target.selectedOptions).map(
                      (option) => option.value
                    );
                    setEntryForm((prev) => ({ ...prev, categoryIds: values }));
                  }}
                >
                  {shopMenu?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Sales channels
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {salesChannelOptions.map((channel) => (
                  <label
                    key={channel}
                    className="inline-flex items-center gap-2 text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={entryForm.salesChannels.includes(channel)}
                      onChange={(event) => {
                        setEntryForm((prev) => {
                          const next = new Set(prev.salesChannels);
                          if (event.target.checked) {
                            next.add(channel);
                          } else {
                            next.delete(channel);
                          }
                          return {
                            ...prev,
                            salesChannels: Array.from(next) as Array<
                              'online' | 'pos' | 'kiosk'
                            >,
                          };
                        });
                      }}
                    />
                    {channel.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Price override
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  className="w-24 rounded-md border border-gray-300 px-3 py-2"
                  value={entryForm.priceAmount}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      priceAmount: event.target.value,
                    }))
                  }
                  placeholder="Amount"
                />
                <input
                  className="w-20 rounded-md border border-gray-300 px-3 py-2 uppercase"
                  value={entryForm.priceCurrency}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      priceCurrency: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-900"
                onClick={() => setIsEntryModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={entrySaving === 'new'}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {entrySaving === 'new' ? 'Creating…' : 'Add to shop'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isCategoryModalOpen ? (
        <Modal
          title="Create category"
          onClose={() => {
            setIsCategoryModalOpen(false);
            setCategoryForm({
              name: '',
              description: '',
              sortOrder: 0,
              parentCategoryId: '',
              isActive: true,
              editingId: '',
            });
          }}
        >
          <form className="space-y-4" onSubmit={handleCategorySubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Parent category
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  value={categoryForm.parentCategoryId}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      parentCategoryId: event.target.value,
                    }))
                  }
                >
                  <option value="">Top level</option>
                  {shopMenu?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sort order
                </label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  value={categoryForm.sortOrder}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Category active
            </label>
            {categoryError && (
              <p className="text-sm text-red-600">{categoryError}</p>
            )}
            {categorySuccess && (
              <p className="text-sm text-green-600">{categorySuccess}</p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-900"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={categorySaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {categorySaving ? 'Saving…' : 'Create category'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

const CategoryTreeNode = ({
  node,
  depth,
  onSelect,
}: {
  node: CategoryTreeItem;
  depth: number;
  onSelect: (categoryId: string) => void;
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">
            {'—'.repeat(depth)} {node.name}
          </p>
          <p className="text-xs text-gray-500">
            {node.isActive ? 'Active' : 'Hidden'}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:underline"
          onClick={() => onSelect(node.id)}
        >
          Edit
        </button>
      </div>
      {node.children.length > 0 && (
        <div className="pl-4 space-y-2">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VariantGroupsEditor = ({
  groups,
  onChange,
}: {
  groups: VariantGroupDraft[];
  onChange: (next: VariantGroupDraft[]) => void;
}) => {
  const updateGroup = (groupId: string, updates: Partial<VariantGroupDraft>) => {
    onChange(
      groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const updateVariant = (
    groupId: string,
    variantId: string,
    updates: Partial<VariantDraft>
  ) => {
    onChange(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              variants: group.variants.map((variant) =>
                variant.id === variantId ? { ...variant, ...updates } : variant
              ),
            }
          : group
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Variant groups</p>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:underline"
          onClick={() => onChange([...groups, emptyVariantGroup()])}
        >
          Add group
        </button>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Group name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={group.name}
                onChange={(event) =>
                  updateGroup(group.id, { name: event.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Selection mode
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={group.selectionMode}
                onChange={(event) =>
                  updateGroup(group.id, {
                    selectionMode: event.target.value as 'single' | 'multiple',
                  })
                }
              >
                <option value="single">Single</option>
                <option value="multiple">Multiple</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {group.variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 grid gap-3 md:grid-cols-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={variant.label}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={variant.basePrice.amount}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        basePrice: {
                          ...variant.basePrice,
                          amount: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Currency
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
                    value={variant.basePrice.currency ?? 'USD'}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        basePrice: {
                          ...variant.basePrice,
                          currency: event.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={variant.isActive}
                    onChange={(event) =>
                      updateVariant(group.id, variant.id, {
                        isActive: event.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-medium text-blue-600 hover:underline"
            onClick={() =>
              updateGroup(group.id, {
                variants: [...group.variants, emptyVariant()],
              })
            }
          >
            Add variant
          </button>
        </div>
      ))}
    </div>
  );
};

const AddonGroupsEditor = ({
  groups,
  onChange,
}: {
  groups: AddonGroupDraft[];
  onChange: (next: AddonGroupDraft[]) => void;
}) => {
  const updateGroup = (groupId: string, updates: Partial<AddonGroupDraft>) => {
    onChange(
      groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<AddonGroupDraft['options'][number]>
  ) => {
    onChange(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, ...updates } : option
              ),
            }
          : group
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Addon groups</p>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:underline"
          onClick={() => onChange([...groups, emptyAddonGroup()])}
        >
          Add group
        </button>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Group name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={group.name}
                onChange={(event) =>
                  updateGroup(group.id, { name: event.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Required
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={group.required}
                  onChange={(event) =>
                    updateGroup(group.id, { required: event.target.checked })
                  }
                />
                <span className="text-xs text-gray-600">Must pick one</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Max selectable
              </label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                value={group.maxSelectable ?? 0}
                onChange={(event) =>
                  updateGroup(group.id, {
                    maxSelectable: Number(event.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            {group.options.map((option) => (
              <div
                key={option.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 grid gap-3 md:grid-cols-4"
              >
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={option.label}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        label: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    value={option.priceDelta.amount}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        priceDelta: {
                          ...option.priceDelta,
                          amount: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Currency
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 uppercase"
                    value={option.priceDelta.currency ?? 'USD'}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        priceDelta: {
                          ...option.priceDelta,
                          currency: event.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={option.isActive}
                    onChange={(event) =>
                      updateOption(group.id, option.id, {
                        isActive: event.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs font-medium text-blue-600 hover:underline"
            onClick={() =>
              updateGroup(group.id, {
                options: [
                  ...group.options,
                  {
                    id: createId(),
                    label: 'New option',
                    priceDelta: defaultMoney(),
                    isActive: true,
                  },
                ],
              })
            }
          >
            Add option
          </button>
        </div>
      ))}
    </div>
  );
};

export default CatalogModule;

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
    <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-600">
            Catalog workflow
          </p>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 text-lg"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
);

const StepIndicator = ({
  steps,
  currentStep,
}: {
  steps: string[];
  currentStep: number;
}) => (
  <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
    {steps.map((label, index) => {
      const stepNumber = index + 1;
      const isActive = stepNumber === currentStep;
      const isCompleted = stepNumber < currentStep;
      return (
        <div key={label} className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-blue-600 text-white'
                : isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {stepNumber}
          </span>
          <span className="text-xs font-medium text-gray-700">{label}</span>
          {stepNumber < steps.length && (
            <span className="hidden h-px w-8 bg-gray-200 md:block" />
          )}
        </div>
      );
    })}
  </div>
);
