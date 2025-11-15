import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, type ApiShape } from '../../../config/api';
import {
  ProductFormState,
  createDefaultProductFormState,
  useHasAtLeastOneVariant,
  VariantGroupsEditor,
  AddonGroupsEditor,
  StepIndicator,
} from '../../../components/products/productForm';

type ProductWorkspaceItem = Awaited<ReturnType<ApiShape['getProduct']>>;
type ProductWorkspaceList = Awaited<ReturnType<ApiShape['listProducts']>>;
type ProductWorkspaceSummary = ProductWorkspaceList[number];
type ProductCreatePayload = Parameters<ApiShape['createProduct']>[0];

type ProductWorkspaceView = 'products' | 'categories';

const ProductWorkspace = ({ view }: { view: ProductWorkspaceView }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopContextId = searchParams.get('shopId') ?? '';
  const shouldAutoCreate = searchParams.get('create') === '1';
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';
  const [products, setProducts] = useState<ProductWorkspaceSummary[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductWorkspaceItem | null>(
    null
  );
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>(
    'create'
  );
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productFormState, setProductFormState] = useState<ProductFormState>(
    createDefaultProductFormState
  );
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productStep, setProductStep] = useState(1);
  const productSteps = ['Product basics', 'Variants', 'Add-ons & review'];
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalState, setCategoryModalState] = useState({
    name: '',
  });
  const [categoryModalError, setCategoryModalError] = useState<string | null>(
    null
  );
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryShopId, setCategoryShopId] = useState(shopContextId);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await api.listProducts({
        shopId: categoryShopId || undefined,
        ownerUserId: ownerUserId || undefined,
      });
      setProducts(data);
    } catch (error) {
      setProductsError(
        error instanceof Error ? error.message : 'Unable to load products.'
      );
    } finally {
      setProductsLoading(false);
    }
  }, [categoryShopId, ownerUserId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadManaged = async () => {
      if (!ownerUserId) return;
      try {
        const list = await api.listManagedShops(ownerUserId);
        setCategoryShopId((prev) =>
          prev || shopContextId || list[0]?.shopId || ''
        );
      } catch (error) {
        console.error(error);
      }
    };
    loadManaged();
  }, [ownerUserId, shopContextId]);

  useEffect(() => {
    if (!shopContextId) return;
    setCategoryShopId((prev) =>
      prev && prev !== shopContextId ? prev : shopContextId
    );
  }, [shopContextId]);

  const resetProductForm = () => {
    setProductFormMode('create');
    setEditingProduct(null);
    setProductFormState(createDefaultProductFormState());
    setProductStep(1);
  };
  const handleCategoryCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryModalState.name.trim();
    if (!name) {
      setCategoryModalError('Category name is required.');
      return;
    }
    setCategoryModalError(null);
    setIsCategorySubmitting(true);
    try {
      await api.createCategory({ name });
      await loadCategories();
      setCategoryModalState({ name: '' });
      setIsCategoryModalOpen(false);
    } catch (error) {
      setCategoryModalError(
        error instanceof Error
          ? error.message
          : 'Unable to create category.'
      );
    } finally {
      setIsCategorySubmitting(false);
    }
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

  const totalProductSteps = productSteps.length;

  const hasAtLeastOneVariant = useHasAtLeastOneVariant(
    productFormState.variantGroups
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

  const goToNextStep = () => {
    if (!isStepReady(productStep)) {
      return;
    }
    setProductStep((prev) => Math.min(totalProductSteps, prev + 1));
  };

  const goToPreviousStep = () => {
    setProductStep((prev) => Math.max(1, prev - 1));
  };

  const handleProductSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!isStepReady(productStep)) {
      return;
    }
    if (productStep < totalProductSteps) {
      goToNextStep();
      return;
    }
    setProductSubmitting(true);
    try {
      const selectedCategoryNames = Array.from(
        new Set(
          categories
            .filter((category) =>
              productFormState.selectedCategoryIds.includes(category.id)
            )
            .map((category) => category.name)
        )
      );
      const resolvedShopId =
        productFormMode === 'create'
          ? categoryShopId
          : editingProduct?.shopId ?? '';
      if (!resolvedShopId) {
        throw new Error('Select a shop before saving this product.');
      }
      const payload: ProductCreatePayload = {
        title: productFormState.title,
        description: productFormState.description,
        ownerUserId: ownerUserId || undefined,
        tags: selectedCategoryNames,
        shopId: resolvedShopId,
        categories: selectedCategoryNames,
        variantGroups: productFormState.variantGroups.map((group) => ({
          id: group.id,
          name: group.name,
          variants: group.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            basePrice: {
              amount: Number(variant.basePrice.amount),
              currency:
                variant.basePrice.currency || productFormState.defaultCurrency,
            },
            isActive: variant.isActive,
          })),
        })),
        addonGroups: productFormState.addonGroups.map((group) => ({
          id: group.id,
          name: group.name,
          required: group.required,
          maxSelectable: group.maxSelectable,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: {
              amount: Number(option.priceDelta.amount),
              currency:
                option.priceDelta.currency || productFormState.defaultCurrency,
            },
            isActive: option.isActive,
          })),
        })),
        isActive: productFormState.isActive,
      };

      let productId = editingProduct?.id ?? '';
      if (productFormMode === 'create') {
        const created = await api.createProduct(payload);
        productId = created.id;
      } else if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        productId = editingProduct.id;
      }
      await loadProducts();
      closeProductModal();
      if (shopContextId && productFormMode === 'create' && productId) {
        navigate(`/owner/shops/${shopContextId}`);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to save product.'
      );
    } finally {
      setProductSubmitting(false);
    }
  };

  const onEditProduct = async (productId: string) => {
    try {
      const product = await api.getProduct(productId);
      setEditingProduct(product);
      setProductFormMode('edit');
      const mappedCategoryIds =
        product.categoryDetails?.map((category) => category.id) ?? [];
      setProductFormState({
        title: product.title,
        description: product.description ?? '',
        isActive: product.isActive,
        defaultCurrency:
          product.variantGroups[0]?.variants[0]?.basePrice.currency ?? 'USD',
        variantGroups: product.variantGroups.map((group) => ({
          id: group.id,
          name: group.name,
          variants: group.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            basePrice: {
              amount: variant.basePrice.amount,
              currency: variant.basePrice.currency,
            },
            isActive: variant.isActive,
          })),
        })),
        addonGroups: product.addonGroups.map((group) => ({
          id: group.id,
          name: group.name,
          required: group.required,
          maxSelectable: group.maxSelectable,
          options: group.options.map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: {
              amount: option.priceDelta.amount,
              currency: option.priceDelta.currency,
            },
            isActive: option.isActive,
          })),
        })),
        selectedCategoryIds: mappedCategoryIds,
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
        'Deleting a product removes it from future menus. Continue?'
      )
    ) {
      return;
    }
    try {
      await api.deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to delete product.'
      );
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    setProductFormState((prev) => {
      const isSelected = prev.selectedCategoryIds.includes(categoryId);
      return {
        ...prev,
        selectedCategoryIds: isSelected
          ? prev.selectedCategoryIds.filter((id) => id !== categoryId)
          : [...prev.selectedCategoryIds, categoryId],
      };
    });
  };

  const [categories, setCategories] = useState<
    Awaited<ReturnType<ApiShape['listCategories']>>
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const list = await api.listCategories();
      setCategories(list);
    } catch (error) {
      setCategoriesError(
        error instanceof Error ? error.message : 'Unable to load categories.'
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setProductFormState((prev) => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.filter((id) =>
        categories.some((category) => category.id === id)
      ),
    }));
  }, [categories]);

  useEffect(() => {
    if (!shouldAutoCreate || !shopContextId || isProductModalOpen) return;
    resetProductForm();
    openProductModal('create');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('create');
    setSearchParams(nextParams, { replace: true });
  }, [
    shouldAutoCreate,
    shopContextId,
    isProductModalOpen,
    searchParams,
    setSearchParams,
  ]);


  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const categoryStats = useMemo(() => {
    return categories
      .map((category) => {
        const productIds =
          products
            .filter((product) => {
              const hasMatchingId =
                product.categoryDetails?.some(
                  (detail) => detail.id === category.id
                ) ?? false;
              const hasMatchingName =
                product.categories?.includes(category.name) ?? false;
              return hasMatchingId || hasMatchingName;
            })
            .map((product) => product.id) ?? [];
        return {
          ...category,
          productIds,
          productCount: productIds.length,
        };
      })
      .sort(
        (a, b) =>
          b.productCount - a.productCount || a.name.localeCompare(b.name)
      );
  }, [categories, products]);

  const selectedCategoryNames = useMemo(() => {
    const names = productFormState.selectedCategoryIds
      .map((id) => categoryNameById.get(id))
      .filter((name): name is string => Boolean(name));
    return names;
  }, [productFormState.selectedCategoryIds, categoryNameById]);

  const filteredCategories = useMemo(() => categories, [categories]);

  const totalCategoryAssignments = useMemo(
    () =>
      categoryStats.reduce((sum, category) => sum + category.productIds.length, 0),
    [categoryStats]
  );

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
                Categories
              </label>
              <div className="mt-1 rounded-lg border border-gray-200 p-3">
                {categoriesLoading ? (
                  <p className="text-sm text-gray-500">Loading categories…</p>
                ) : categoriesError ? (
                  <p className="text-sm text-red-600">{categoriesError}</p>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-sm text-gray-500 space-y-2">
                    <p>No categories yet. Create reusable labels such as Lunch or Drinks.</p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-blue-600 hover:underline"
                      onClick={() => {
                        setIsCategoryModalOpen(true);
                        setCategoryModalState({ name: '' });
                        setCategoryModalError(null);
                      }}
                    >
                      Create category
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {filteredCategories.map((category) => {
                        const isSelected =
                          productFormState.selectedCategoryIds.includes(
                            category.id
                          );
                        return (
                          <button
                            type="button"
                            key={category.id}
                            onClick={() => toggleCategorySelection(category.id)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      Need another category?{' '}
                      <button
                        type="button"
                        className="font-semibold text-blue-600 hover:underline"
                        onClick={() => {
                          setIsCategoryModalOpen(true);
                          setCategoryModalState({ name: '' });
                          setCategoryModalError(null);
                        }}
                      >
                        Create it here
                      </button>
                      .
                    </p>
                  </div>
                )}
              </div>
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
            defaultCurrency={productFormState.defaultCurrency}
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
            defaultCurrency={productFormState.defaultCurrency}
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
              <dt className="font-medium text-gray-700">Categories</dt>
              <dd>
                {selectedCategoryNames.length > 0
                  ? selectedCategoryNames.join(', ')
                  : '—'}
              </dd>
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
      eyebrow: 'Products',
      title: 'Craft, launch, and maintain your best-sellers',
      description:
        'Centralize every product asset with guided workflows and consistent pricing controls.',
      primaryStatLabel: 'Active products',
      primaryStatValue: products.filter((product) => product.isActive).length,
      secondaryStatLabel: 'Variant groups',
      secondaryStatValue: products.reduce(
        (count, product) => count + product.variantGroups.length,
        0
      ),
    },
    categories: {
      eyebrow: 'Product categories',
      title: 'Keep menus structured and intuitive',
      description:
        'Group products by use-case (Lunch, Drinks, Specials) and assign them consistently.',
      primaryStatLabel: 'Categories',
      primaryStatValue: categories.length,
      secondaryStatLabel: 'Assignments',
      secondaryStatValue: totalCategoryAssignments,
    },
  } as const;
  const heroContent = heroCopies[view];
  const showProductsView = view === 'products';
  const showCategoriesView = view === 'categories';

  const renderProductsSection = () => {
    if (!showProductsView) return null;
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Products
            </h2>
            <p className="text-sm text-gray-600">
              Craft reusable products including variant and add-on pricing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
          <p className="text-sm text-gray-500">Loading products…</p>
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


  const renderCategoriesSection = () => {
    if (!showCategoriesView) return null;
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Product categories
            </h2>
            <p className="text-sm text-gray-600">
              Assign reusable labels such as Lunch, Drinks, or Specials to keep
              your products organized across storefronts.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <p className="text-sm text-gray-500">
              Categories are shared globally and can be applied to any product.
            </p>
            <button
              type="button"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
              onClick={() => {
                setIsCategoryModalOpen(true);
                setCategoryModalState({ name: '' });
                setCategoryModalError(null);
              }}
            >
              New category
            </button>
          </div>
        </header>
        {categoryStats.length === 0 ? (
          <p className="text-sm text-gray-500">
            No categories yet. Use the button above to create your first product
            category.
          </p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {categoryStats.map((category) => (
                <div
                  key={category.name}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {category.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.productCount} product
                    {category.productCount === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    );
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
      {renderCategoriesSection()}

      {isProductModalOpen ? (
        <Modal
          title={
            productFormMode === 'create'
              ? 'Create product'
              : 'Edit product'
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
                    onClick={(event) => {
                      event.preventDefault();
                      goToPreviousStep();
                    }}
                  >
                    Previous
                  </button>
                )}
                {productStep < productSteps.length ? (
                  <button
                    type="button"
                    disabled={!isStepReady(productStep)}
                    onClick={(event) => {
                      event.preventDefault();
                      goToNextStep();
                    }}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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


      {isCategoryModalOpen ? (
        <Modal
          title="Create category"
          onClose={() => {
            setIsCategoryModalOpen(false);
            setCategoryModalState({ name: '' });
            setCategoryModalError(null);
          }}
        >
          <form className="space-y-4" onSubmit={handleCategoryCreate}>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category name
              </label>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryModalState.name}
                onChange={(event) =>
                  setCategoryModalState({ name: event.target.value })
                }
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Examples: Lunch, Drinks, Weekend specials.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Categories are saved once and can then be used by every shop you
              manage.
            </p>
            {categoryModalError && (
              <p className="text-sm text-red-600">{categoryModalError}</p>
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
                disabled={isCategorySubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isCategorySubmitting ? 'Saving…' : 'Create category'}
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
    <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-600">
            Products workflow
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

export default ProductWorkspace;
