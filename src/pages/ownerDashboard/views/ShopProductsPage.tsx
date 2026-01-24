import {
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import {
  useShopsGetQuery,
  useProductsListByShopQuery,
  useProductsCreateMutation,
  useProductsUpdateMutation,
  useProductsDeleteMutation,
  useCategoriesListQuery,
  type ProductDto,
} from '../../../services/api';
import {
  createDefaultProductFormState,
  ProductFormState,
  VariantGroupsEditor,
  AddonGroupsEditor,
  StepIndicator,
  useHasAtLeastOneVariant,
  createId,
} from '../../../components/products/productForm';

type Money = { amount: number; currency: string };

type ShopProductResponse = {
  id: string;
  label: string;
  description?: string;
  isAvailable: boolean;
  price: number;
  categories?: string[];
  categoryDetails?: { id: string; name: string }[];
  variantGroups: Array<{
    id: string;
    label: string;
    options: Array<{
      id: string;
      label: string;
      priceDelta: Money;
      isAvailable: boolean;
    }>;
  }>;
  addonGroups: Array<{
    id: string;
    label: string;
    required?: boolean;
    maxSelectable?: number;
    options: Array<{
      id: string;
      label: string;
      priceDelta: Money;
      isAvailable: boolean;
    }>;
  }>;
};

const productSteps = ['Product basics', 'Variants', 'Add-ons & review'];
const DEFAULT_CURRENCY = 'USD';

const toLegacyMoney = (amount: number, currency = DEFAULT_CURRENCY): Money => ({
  amount,
  currency,
});

const toLegacyProduct = (product: ProductDto): ShopProductResponse => ({
  id: product.id,
  label: product.label,
  description: product.description,
  isAvailable: product.isAvailable,
  price: product.price,
  categories: product.categories.map((category) => category.name),
  categoryDetails: product.categories.map((category) => ({
    id: category.id,
    name: category.name,
  })),
  variantGroups: product.variantTypes.map((group) => ({
    id: group.id,
    label: group.label,
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label,
      priceDelta: toLegacyMoney(option.priceDelta),
      isAvailable: option.isAvailable,
    })),
  })),
  addonGroups: product.addons.map((group) => ({
    id: group.id,
    label: group.label,
    required: false,
    maxSelectable: undefined,
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label,
      priceDelta: toLegacyMoney(option.priceDelta),
      isAvailable: option.isAvailable,
    })),
  })),
});

const ShopProductsPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';

  const {
    data: shopData,
    isLoading: shopLoading,
    error: shopError,
    refetch: refetchShop,
  } = useShopsGetQuery(shopId ?? '', {
    skip: !shopId,
  });
  const {
    data: shopProductsData = [],
    isLoading: shopProductsLoading,
    error: shopProductsError,
    refetch: refetchProducts,
  } = useProductsListByShopQuery(shopId ?? '', {
    skip: !shopId,
  });
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategoriesListQuery();
  const [createProductMutation] = useProductsCreateMutation();
  const [updateProductMutation] = useProductsUpdateMutation();
  const [deleteProductMutation] = useProductsDeleteMutation();
  const shop = shopData ?? null;
  const products = shopProductsData.map(toLegacyProduct);
  const shopErrorMessage = shopError ? 'Unable to load shop products.' : null;
  const productsErrorMessage = shopProductsError
    ? 'Unable to load products.'
    : null;
  const categoriesErrorMessage = categoriesError
    ? 'Unable to load categories.'
    : null;
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productFormState, setProductFormState] = useState<ProductFormState>(
    createDefaultProductFormState
  );
  const [productStep, setProductStep] = useState(1);
  const totalProductSteps = productSteps.length;
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>(
    'create'
  );
  const [editingProduct, setEditingProduct] = useState<ShopProductResponse | null>(
    null
  );
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const selectedCategoryNames = useMemo(
    () =>
      productFormState.selectedCategoryIds
        .map((id) => categoryNameById.get(id))
        .filter((name): name is string => Boolean(name)),
    [productFormState.selectedCategoryIds, categoryNameById]
  );

  const hasAtLeastOneVariant = useHasAtLeastOneVariant(
    productFormState.variantGroups
  );
  const hasSimplePrice =
    Number(productFormState.simplePriceAmount || '') > 0;
  const hasPricingConfigured =
    productFormState.variantMode === 'advanced'
      ? hasAtLeastOneVariant
      : hasSimplePrice;
  const variantGroupsLength = productFormState.variantGroups.length;

  useEffect(() => {
    if (
      productFormState.variantMode === 'advanced' &&
      variantGroupsLength === 0
    ) {
      setProductFormState((prev) => ({ ...prev, variantMode: 'simple' }));
    }
  }, [productFormState.variantMode, variantGroupsLength]);

  const isStepReady = (step: number) => {
    if (step === 1) {
      return (
        productFormState.title.trim().length > 0 &&
        productFormState.selectedCategoryIds.length > 0
      );
    }
    if (step === 2) {
      return hasPricingConfigured;
    }
    return true;
  };

  const refreshShop = useCallback(async () => {
    if (!shopId) return;
    await refetchShop();
  }, [refetchShop, shopId]);

  const refreshProducts = useCallback(async () => {
    await refetchProducts();
  }, [refetchProducts]);

  const buildStandardVariantGroupPayload = () => ({
    label: 'Standard group',
    options: [
      {
        label: 'Standard',
        priceDelta: {
          amount: Number(productFormState.simplePriceAmount || 0),
          currency:
            productFormState.simplePriceCurrency ||
            productFormState.defaultCurrency,
        },
        isAvailable: true,
      },
    ],
  });

  const enableAdvancedVariants = () => {
    setProductFormState((prev) => ({
      ...prev,
      variantMode: 'advanced',
      variantGroups:
        prev.variantGroups.length > 0
          ? prev.variantGroups
          : [
              {
                id: createId(),
                name: 'Standard group',
                variants: [
                  {
                    id: createId(),
                    name: 'Standard',
                    basePrice: {
                      amount: Number(prev.simplePriceAmount || 0),
                      currency:
                        prev.simplePriceCurrency || prev.defaultCurrency,
                    },
                    isActive: true,
                  },
                ],
              },
            ],
    }));
  };

  const revertToSimplePricing = () => {
    setProductFormState((prev) => ({
      ...prev,
      variantMode: 'simple',
      variantGroups: [],
    }));
  };

  const enableAddons = () => {
    setProductFormState((prev) => ({
      ...prev,
      addonsEnabled: true,
      addonGroups:
        prev.addonGroups.length > 0
          ? prev.addonGroups
          : [
              {
                id: createId(),
                name: 'Add-ons',
                required: false,
                maxSelectable: 0,
                options: [
                  {
                    id: createId(),
                    name: 'Option 1',
                    priceDelta: {
                      amount: 0,
                      currency: prev.defaultCurrency,
                    },
                    isActive: true,
                  },
                ],
              },
            ],
    }));
  };

  const disableAddons = () => {
    setProductFormState((prev) => ({
      ...prev,
      addonsEnabled: false,
      addonGroups: [],
    }));
  };

  const toggleProductAvailability = async (productId: string, next: boolean) => {
    setUpdatingProductId(productId);
    try {
      await updateProductMutation({
        productId,
        productUpdateInput: { isAvailable: next },
      }).unwrap();
      await Promise.all([refreshShop(), refreshProducts()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to update product.');
    } finally {
      setUpdatingProductId(null);
    }
  };

  const openProductModal = (
    mode: 'create' | 'edit',
    product?: ShopProductResponse
  ) => {
    if (mode === 'edit' && product) {
      setProductFormMode('edit');
      setEditingProduct(product);
      const firstVariant = product.variantGroups[0]?.options[0];
      const isStandardSimple =
        product.variantGroups.length === 1 &&
        product.variantGroups[0]?.label === 'Standard group' &&
        (product.variantGroups[0]?.options.length ?? 0) === 1 &&
        firstVariant?.label === 'Standard';
      const variantMode = isStandardSimple ? 'simple' : 'advanced';
      const addonsEnabled = product.addonGroups.length > 0;
      setProductFormState({
        title: product.label,
        description: product.description ?? '',
        isActive: product.isAvailable,
        defaultCurrency: firstVariant?.priceDelta.currency ?? 'USD',
        variantMode,
        variantGroups:
          variantMode === 'advanced'
            ? product.variantGroups.map((group) => ({
                id: group.id,
                name: group.label,
                variants: group.options.map((variant) => ({
                  id: variant.id,
                  name: variant.label,
                  basePrice: {
                    amount: variant.priceDelta.amount,
                    currency: variant.priceDelta.currency,
                  },
                  isActive: variant.isAvailable,
                })),
              }))
            : [],
        addonGroups: addonsEnabled
          ? product.addonGroups.map((group) => ({
              id: group.id,
              name: group.label,
              required: group.required ?? false,
              maxSelectable: group.maxSelectable,
              options: group.options.map((option) => ({
                id: option.id,
                name: option.label,
                priceDelta: {
                  amount: option.priceDelta.amount,
                  currency: option.priceDelta.currency,
                },
                isActive: option.isAvailable,
              })),
            }))
          : [],
        addonsEnabled,
        selectedCategoryIds:
          product.categoryDetails?.map((category) => category.id) ?? [],
        simplePriceAmount: firstVariant
          ? String(firstVariant.priceDelta.amount)
          : String(product.price ?? 0),
        simplePriceCurrency: firstVariant?.priceDelta.currency ?? 'USD',
      });
    } else {
      setProductFormMode('create');
      setEditingProduct(null);
      setProductFormState(createDefaultProductFormState());
    }
    setProductStep(1);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setProductStep(1);
    setProductFormState(createDefaultProductFormState());
    setEditingProduct(null);
    setProductFormMode('create');
  };

  const goToNextStep = () => {
    if (!isStepReady(productStep)) {
      return;
    }
    setProductStep((prev) => Math.min(totalProductSteps, prev + 1));
  };
  const goToPreviousStep = () =>
    setProductStep((prev) => Math.max(1, prev - 1));

  const handleNextStepClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    goToNextStep();
  };

  const handlePreviousStepClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    goToPreviousStep();
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isStepReady(productStep)) {
      return;
    }
    if (productStep < totalProductSteps) {
      goToNextStep();
      return;
    }
    if (!shopId) return;
    setProductSubmitting(true);
    try {
      const selectedNames = Array.from(new Set(selectedCategoryNames));
      const standardVariantGroup = buildStandardVariantGroupPayload();
      const variantGroupsPayload =
        productFormState.variantMode === 'advanced'
          ? productFormState.variantGroups.length > 0
            ? productFormState.variantGroups.map((group) => ({
                id: group.id,
                label: group.name,
                options: group.variants.map((variant) => ({
                  id: variant.id,
                  label: variant.name,
                  priceDelta: {
                    amount: Number(variant.basePrice.amount),
                    currency:
                      variant.basePrice.currency || productFormState.defaultCurrency,
                  },
                  isAvailable: variant.isActive,
                })),
              }))
            : [standardVariantGroup]
          : [standardVariantGroup];
      const addonGroupsPayload = productFormState.addonsEnabled
        ? productFormState.addonGroups.map((group) => ({
            id: group.id,
            label: group.name,
            required: group.required,
            maxSelectable: group.maxSelectable,
            options: group.options.map((option) => ({
              id: option.id,
              label: option.name,
              priceDelta: {
                amount: Number(option.priceDelta.amount),
                currency:
                  option.priceDelta.currency || productFormState.defaultCurrency,
              },
              isAvailable: option.isActive,
            })),
          }))
        : [];
      const payload = {
        shopId,
        ownerUserId: ownerUserId || undefined,
        label: productFormState.title,
        price: Number(productFormState.simplePriceAmount || 0),
        description: productFormState.description,
        tags: selectedNames,
        categories: selectedNames,
        variantGroups: variantGroupsPayload,
        addonGroups: addonGroupsPayload,
        isAvailable: productFormState.isActive,
      };
      if (productFormMode === 'edit' && editingProduct) {
        await updateProductMutation({
          productId: editingProduct.id,
          productUpdateInput: payload,
        }).unwrap();
      } else {
        await createProductMutation(payload).unwrap();
      }
      await Promise.all([refreshShop(), refreshProducts()]);
      closeProductModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to create product.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const breadcrumbShopName = shop?.name ?? 'Loading…';
  const breadcrumb = (
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
          <Link to={`/owner/shops/${shopId}`} className="hover:text-gray-900">
            {breadcrumbShopName}
          </Link>
        </li>
      </ol>
    </nav>
  );

  return (
    <div className="space-y-6">
      {breadcrumb}

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Shop products
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
            onClick={() => openProductModal('create')}
            disabled={!shopId}
          >
            Add product to shop
          </button>
        </div>
      </div>

      {shopLoading || shopProductsLoading ? (
        <p className="text-sm text-gray-600">Loading products…</p>
      ) : shopErrorMessage || productsErrorMessage ? (
        <p className="text-sm text-red-600">
          {shopErrorMessage ?? productsErrorMessage}
        </p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          This shop does not have any products yet. Use “Add product to shop” to publish
          items for this storefront.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <div key={product.id} className="aspect-square">
              <button
                type="button"
                className="flex h-full w-full flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => openProductModal('edit', product)}
              >
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      {product.label}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      Product #{product.id} — {product.description || 'No description'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Categories
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(() => {
                        const detailList = product.categoryDetails ?? [];
                        if (detailList.length > 0) {
                          return detailList.map((category) => (
                            <span
                              key={category.id}
                              className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                            >
                              {category.name}
                            </span>
                          ));
                        }
                        const fallbackNames = product.categories ?? [];
                        if (fallbackNames.length > 0) {
                          return fallbackNames.map((name, index) => (
                            <span
                              key={`${product.id}-${name}-${index}`}
                              className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                            >
                              {name}
                            </span>
                          ));
                        }
                        return (
                          <span className="text-xs text-gray-400">
                            No categories assigned
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Availability
                  </label>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      product.isAvailable
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    disabled={updatingProductId === product.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleProductAvailability(product.id, !product.isAvailable);
                    }}
                  >
                    {product.isAvailable ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {isProductModalOpen && shopId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-10">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-600">
                Products workflow
              </p>
              <h3 className="text-lg font-semibold text-gray-900">
                  {productFormMode === 'create'
                    ? 'Create shop product'
                    : 'Edit shop product'}
                </h3>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-lg"
                onClick={closeProductModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
              <form className="space-y-6" onSubmit={handleProductSubmit}>
                {productFormMode === 'edit' && editingProduct ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm font-semibold text-red-600 hover:text-red-700"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            'Deleting this product removes it from the shop. Continue?'
                          ) ||
                          !editingProduct
                        ) {
                          return;
                        }
                        try {
                          await deleteProductMutation(editingProduct.id).unwrap();
                          await Promise.all([refreshShop(), refreshProducts()]);
                          closeProductModal();
                        } catch (err) {
                          alert(
                            err instanceof Error
                              ? err.message
                              : 'Unable to delete product.'
                          );
                        }
                      }}
                    >
                      Delete product
                    </button>
                  </div>
                ) : null}
                <StepIndicator steps={productSteps} currentStep={productStep} />
                {productStep === 1 && (
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
                          placeholder="Morning bagel combo"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Categories
                        </label>
                        <div className="mt-1 rounded-lg border border-gray-200 p-3">
                          {categoriesLoading ? (
                            <p className="text-xs text-gray-500">Loading categories…</p>
                          ) : categoriesErrorMessage ? (
                            <p className="text-xs text-red-600">
                              {categoriesErrorMessage}
                            </p>
                          ) : categories.length === 0 ? (
                            <p className="text-xs text-gray-500">
                              No categories yet. Create them under Products &gt; Categories.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {categories.map((category) => {
                                const isSelected =
                                  productFormState.selectedCategoryIds.includes(
                                    category.id
                                  );
                                return (
                                  <button
                                    type="button"
                                    key={category.id}
                                    onClick={() =>
                                      setProductFormState((prev) => ({
                                        ...prev,
                                        selectedCategoryIds: isSelected
                                          ? prev.selectedCategoryIds.filter(
                                              (id) => id !== category.id
                                            )
                                          : [...prev.selectedCategoryIds, category.id],
                                      }))
                                    }
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                )}
                {productStep === 2 && (
                  <div className="space-y-4">
                    {productFormState.variantMode === 'simple' ? (
                      <>
                        <p className="text-sm text-gray-600">
                          Set a single base price. Switch to advanced variants if you need more
                          control.
                        </p>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">
                              Base price amount
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={productFormState.simplePriceAmount}
                              onChange={(event) =>
                                setProductFormState((prev) => ({
                                  ...prev,
                                  simplePriceAmount: event.target.value,
                                }))
                              }
                              placeholder="12.00"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Currency
                            </label>
                            <input
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={productFormState.simplePriceCurrency}
                              onChange={(event) =>
                                setProductFormState((prev) => ({
                                  ...prev,
                                  simplePriceCurrency: event.target.value.toUpperCase(),
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            Need multiple variants? Convert to advanced mode.
                          </p>
                          <button
                            type="button"
                            className="text-sm font-semibold text-blue-600 hover:underline"
                            onClick={enableAdvancedVariants}
                          >
                            Configure advanced variants
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
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
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="text-sm font-semibold text-blue-600 hover:underline"
                            onClick={revertToSimplePricing}
                          >
                            Revert to simple pricing
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {productStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Optional add-ons help with upsells. Keep them concise and easy to scan.
                      </p>
                      {productFormState.addonsEnabled ? (
                        <>
                          <AddonGroupsEditor
                            groups={productFormState.addonGroups}
                            defaultCurrency={productFormState.defaultCurrency}
                            onChange={(addonGroups) =>
                              setProductFormState((prev) => ({ ...prev, addonGroups }))
                            }
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="text-sm font-semibold text-blue-600 hover:underline"
                              onClick={disableAddons}
                            >
                              Disable add-ons
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                          <p>No add-ons configured for this product.</p>
                          <button
                            type="button"
                            className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                            onClick={enableAddons}
                          >
                            Enable add-ons
                          </button>
                        </div>
                      )}
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
                            {productFormState.variantGroups.length > 0 ? (
                              <>
                                {productFormState.variantGroups.reduce(
                                  (count, group) => count + group.variants.length,
                                  0
                                )}{' '}
                                configured
                              </>
                            ) : hasSimplePrice ? (
                              <>
                                Base price:{' '}
                                {productFormState.simplePriceAmount
                                  ? `${productFormState.simplePriceAmount} ${
                                      productFormState.simplePriceCurrency ||
                                      productFormState.defaultCurrency
                                    }`
                                  : '—'}
                              </>
                            ) : (
                              '—'
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-700">Add-ons</dt>
                          <dd>
                            {productFormState.addonsEnabled
                              ? `${
                                  productFormState.addonGroups.reduce(
                                    (count, group) => count + group.options.length,
                                    0
                                  )
                                } option${
                                  productFormState.addonGroups.reduce(
                                    (count, group) => count + group.options.length,
                                    0
                                  ) === 1
                                    ? ''
                                    : 's'
                                }`
                              : 'Disabled'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}
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
                        onClick={handlePreviousStepClick}
                      >
                        Previous
                      </button>
                    )}
                    {productStep < productSteps.length ? (
                      <button
                        type="button"
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        onClick={handleNextStepClick}
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
                          !hasPricingConfigured
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
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ShopProductsPage;
