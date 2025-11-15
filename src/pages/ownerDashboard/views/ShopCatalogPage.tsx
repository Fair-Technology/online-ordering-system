import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type ApiShape } from '../../../config/api';

type ShopResponse = Awaited<ReturnType<ApiShape['getShop']>>;
type ShopMenuResponse = Awaited<ReturnType<ApiShape['getShopMenu']>>;
type CatalogProductSummary = Awaited<
  ReturnType<ApiShape['listCatalogProducts']>
>[number];
type ShopCatalogEntry = ShopMenuResponse['catalogEntries'][number];

const salesChannelOptions: Array<'online' | 'pos' | 'kiosk'> = [
  'online',
  'pos',
  'kiosk',
];

const createEntryFormState = () => ({
  productId: '',
  categoryIds: [] as string[],
  salesChannels: [] as Array<'online' | 'pos' | 'kiosk'>,
  priceAmount: '',
  priceCurrency: 'USD',
});

const ShopCatalogPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [menu, setMenu] = useState<ShopMenuResponse | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(createEntryFormState);

  useEffect(() => {
    if (!shopId) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [shopResponse, menuResponse, catalogResponse] = await Promise.all([
          api.getShop(shopId),
          api.getShopMenu(shopId),
          api.listCatalogProducts(),
        ]);
        setShop(shopResponse);
        setMenu(menuResponse);
        setCatalogProducts(catalogResponse);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load shop catalog.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [shopId]);

  const productLookup = useMemo(() => {
    const map = new Map<string, CatalogProductSummary>();
    catalogProducts.forEach((product) => map.set(product.id, product));
    if (menu?.catalogProducts) {
      menu.catalogProducts.forEach((product) => map.set(product.id, product));
    }
    return map;
  }, [catalogProducts, menu]);

  const refreshMenu = async () => {
    if (!shopId) return;
    const updatedMenu = await api.getShopMenu(shopId);
    setMenu(updatedMenu);
  };

  const handleEntryUpdate = async (
    entry: ShopCatalogEntry,
    updates: Partial<ShopCatalogEntry>
  ) => {
    if (!shopId) return;
    setSavingEntryId(entry.id);
    try {
      await api.updateShopCatalogEntry(shopId, entry.id, {
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
      await refreshMenu();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Unable to update catalog entry.'
      );
    } finally {
      setSavingEntryId(null);
    }
  };

  const handleEntryCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shopId || !entryForm.productId) return;
    setSavingEntryId('new');
    try {
      await api.createShopCatalogEntry(shopId, {
        productId: entryForm.productId,
        categoryIds: entryForm.categoryIds,
        isAvailable: true,
        salesChannels: entryForm.salesChannels,
        priceOverride: entryForm.priceAmount
          ? {
              amount: Number(entryForm.priceAmount),
              currency: entryForm.priceCurrency,
            }
          : undefined,
      });
      await refreshMenu();
      setEntryForm(createEntryFormState());
      setIsModalOpen(false);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Unable to add product to this shop.'
      );
    } finally {
      setSavingEntryId(null);
    }
  };

  if (!shopId) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">
          A valid shop identifier is required to load catalog entries.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          onClick={() => navigate('/owner/shops')}
        >
          Back to shops
        </button>
      </div>
    );
  }

  const entries = menu?.catalogEntries ?? [];
  const categories = menu?.categories ?? [];
  const categoryNameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) =>
      map.set(category.name.trim().toLowerCase(), category.id)
    );
    return map;
  }, [categories]);
  const categoryIdToNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link to="/owner" className="hover:text-gray-900">
              Dashboard
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link to="/owner/shops" className="hover:text-gray-900">
              Shops
            </Link>
          </li>
          <li>/</li>
          <li className="font-semibold text-gray-900">
            {shop?.name ?? 'Loading…'}
          </li>
        </ol>
      </nav>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Shop catalog overview
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            {shop?.name ?? 'Loading shop…'}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {shop?.address || 'No address provided'}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-gray-600">
            <span className="rounded-full bg-gray-100 px-3 py-1 capitalize">
              {shop?.status ?? '—'}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1">
              {shop?.acceptingOrders ? 'Accepting orders' : 'Not accepting orders'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/owner/shops')}
          >
            Back to shops
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
            disabled={!catalogProducts.length}
          >
            Add product to shop
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-600">Loading catalog entries…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          This shop does not have any products yet. Use “Add product” to publish
          catalog items for this storefront.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const product = productLookup.get(entry.productId);
            const derivedCategoryIds =
              entry.categoryIds && entry.categoryIds.length > 0
                ? entry.categoryIds
                : (product?.tags ?? [])
                    .map((tag) =>
                      categoryNameToIdMap.get(tag.trim().toLowerCase())
                    )
                    .filter((id): id is string => Boolean(id));
            const displayCategoryIds = derivedCategoryIds ?? [];
            return (
              <div
                key={entry.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {product?.title ?? entry.productId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Entry #{entry.id} —{' '}
                      {product?.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-700">
                      Availability
                    </label>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        entry.isAvailable
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      disabled={savingEntryId === entry.id}
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
                      value={displayCategoryIds}
                      onChange={(event) => {
                        const selected = Array.from(
                          event.target.selectedOptions
                        ).map((option) => option.value);
                        handleEntryUpdate(entry, { categoryIds: selected });
                      }}
                      disabled={savingEntryId === entry.id}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {displayCategoryIds.length > 0 ? (
                        displayCategoryIds.map((categoryId) => (
                          <span
                            key={categoryId}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                          >
                            {categoryIdToNameMap.get(categoryId) ?? categoryId}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          No categories assigned
                        </span>
                      )}
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
                        placeholder="Amount"
                        value={entry.priceOverride?.amount ?? ''}
                        onChange={(event) =>
                          handleEntryUpdate(entry, {
                            priceOverride: {
                              amount: Number(event.target.value),
                              currency: entry.priceOverride?.currency ?? 'USD',
                            },
                          })
                        }
                        disabled={savingEntryId === entry.id}
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
                        disabled={savingEntryId === entry.id}
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
                              const next = new Set(entry.salesChannels ?? []);
                              if (event.target.checked) {
                                next.add(channel);
                              } else {
                                next.delete(channel);
                              }
                              handleEntryUpdate(entry, {
                                salesChannels: Array.from(
                                  next
                                ) as Array<'online' | 'pos' | 'kiosk'>,
                              });
                            }}
                            disabled={savingEntryId === entry.id}
                          />
                          {channel.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen ? (
        <Modal title="Add product to shop" onClose={() => setIsModalOpen(false)}>
          <form className="space-y-4" onSubmit={handleEntryCreate}>
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
                {catalogProducts.map((product) => (
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
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEntryId === 'new'}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingEntryId === 'new' ? 'Adding…' : 'Add product'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 text-lg"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
);

export default ShopCatalogPage;
