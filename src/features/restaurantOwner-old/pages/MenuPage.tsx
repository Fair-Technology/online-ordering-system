import React, { useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import AddItemForm from '../components/AddItemForm';
import MenuList from '../components/MenuList';
import { Item } from '../types';
import {
  useProductsInShopCreateMutation,
  useProductsCreateMutation,
  useShopsMenuQuery,
} from '../../../store/api/ownerApi';

const ITEM_CATEGORIES: Item['category'][] = [
  'mains',
  'snacks',
  'sides',
  'drinks',
  'desserts',
];

const MenuPage: React.FC = () => {
  const shopId = 'Shop_1';
  const { accounts } = useMsal();
  const ownerUserId =
    accounts[0]?.localAccountId ||
    accounts[0]?.homeAccountId ||
    accounts[0]?.username ||
    '';

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const {
    data: menuData,
    isLoading,
    isError,
    refetch,
  } = useShopsMenuQuery(shopId);
  const [createProduct, { isLoading: isCreatingProduct }] =
    useProductsCreateMutation();
  const [linkProductToShop, { isLoading: isLinkingProduct }] =
    useProductsInShopCreateMutation();

  const items: Item[] = useMemo(() => {
    if (!menuData) return [];
    const productMap = new Map(
      menuData.products.map((product) => [product.id, product]),
    );
    const resolveCategory = (categoryId?: string): Item['category'] => {
      if (!categoryId) return 'mains';
      const categoryName = menuData.categories.find(
        (category) => category.id === categoryId,
      )?.name;
      const normalized = categoryName?.toLowerCase() as Item['category'] | undefined;
      if (normalized && ITEM_CATEGORIES.includes(normalized)) {
        return normalized;
      }
      return 'mains';
    };

    return menuData.productsInShop.map((productInShop) => {
      const product = productMap.get(productInShop.productId);
      const defaultVariant = product?.variantSchemes?.[0]?.variants?.[0];
      return {
        id: productInShop.id,
        shopId: productInShop.shopId,
        name: product?.name ?? 'Untitled product',
        description: product?.description ?? 'No description provided.',
        price:
          productInShop.priceOverride ?? defaultVariant?.basePrice ?? 0,
        size: defaultVariant?.label ?? 'standard',
        isAvailable: productInShop.isAvailable,
        createdAt: product?.createdAt,
        updatedAt: product?.updatedAt,
        category: resolveCategory(productInShop.categoryIds[0]),
      };
    });
  }, [menuData]);

  const isMutating = isCreatingProduct || isLinkingProduct;

  const handleAddItem = async (newItem: Item) => {
    if (!ownerUserId) {
      setFormError('Unable to determine the owner account.');
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      const product = await createProduct({
        ownerUserId,
        name: newItem.name,
        description: newItem.description,
        isActive: newItem.isAvailable,
        variantSchemes: [
          {
            id: crypto.randomUUID(),
            name: 'Size',
            variants: [
              {
                id: crypto.randomUUID(),
                label: newItem.size || 'standard',
                basePrice: newItem.price,
                isActive: true,
              },
            ],
          },
        ],
        addonGroups: [],
      }).unwrap();

      await linkProductToShop({
        shopId,
        body: {
          productId: product.id,
          priceOverride: newItem.price,
          isAvailable: newItem.isAvailable,
          categoryIds: [],
        },
      }).unwrap();

      setFormSuccess('Menu item added successfully.');
      setShowForm(false);
      await refetch();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Failed to add the menu item. Please try again.',
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-gray-500">
            Review your shop catalogue and keep items up to date.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          disabled={isMutating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60"
        >
          {isMutating ? 'Saving…' : 'Add New Item'}
        </button>
      </div>

      {formError ? (
        <p className="text-sm text-red-600">{formError}</p>
      ) : null}
      {formSuccess ? (
        <p className="text-sm text-green-600">{formSuccess}</p>
      ) : null}

      {showForm ? (
        <AddItemForm
          onCancel={() => setShowForm(false)}
          onSubmit={handleAddItem}
        />
      ) : null}

      {isLoading && <p className="text-sm text-gray-500">Loading menu…</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Unable to load menu data for this shop.
        </p>
      )}
      {!isLoading && !isError ? <MenuList items={items} /> : null}
    </div>
  );
};

export default MenuPage;
