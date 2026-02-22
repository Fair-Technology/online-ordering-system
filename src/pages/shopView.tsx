import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';
import {
  useGetShopsSlugBySlugQuery,
  useGetShopsByShopIdQuery,
  useGetProductsQuery,
  type ProductResponse,
} from '../services/api';
import NavBar from '../components/NavBar';
import { Product } from '../types/Product';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setActiveShop } from '../store/slices/shopSlice';
import { centsToDollars } from '../utils/money';

type CategoryOption = { id: string; label: string };

const toCategoryId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toLegacyProduct = (product: ProductResponse): Product => ({
  id: product.id ?? '',
  label: product.name ?? '',
  imageURL:
    product.images?.find((image) => image?.isPrimary)?.url ??
    product.images?.[0]?.url ??
    '',
  description: product.description ?? '',
  isAvailable: product.isAvailable ?? true,
  price: centsToDollars(product.price ?? 0),
  categories:
    product.categories?.map((category) => ({
      id: category.id ?? '',
      name: category.name ?? '',
    })) ?? [],
  variantTypes:
    product.variantGroups?.map((group) => ({
      id: group.id ?? '',
      label: group.name ?? '',
      variants:
        group.options?.map((option) => ({
          id: option.id ?? '',
          label: option.name ?? '',
          imageURL: '',
          priceDelta: centsToDollars(option.priceDelta ?? 0),
          isAvailable: option.isAvailable ?? true,
        })) ?? [],
    })) ?? [],
  addons:
    product.addonGroups?.map((group) => ({
      id: group.id ?? '',
      label: group.name ?? '',
      options:
        group.options?.map((option) => ({
          id: option.id ?? '',
          label: option.name ?? '',
          imageURL: '',
          priceDelta: centsToDollars(option.priceDelta ?? 0),
          isAvailable: option.isAvailable ?? true,
        })) ?? [],
    })) ?? [],
});

const ShopView = () => {
  const { shopId: routeShopId, slug } = useParams<{
    shopId?: string;
    slug?: string;
  }>();
  const dispatch = useAppDispatch();
  const storedShopId = useAppSelector((state) => state.shop.activeShopId);
  const shouldFetchBySlug = Boolean(slug);
  const shopIdLookup = shouldFetchBySlug
    ? ''
    : routeShopId ?? storedShopId ?? '';

  const { data: shopDataBySlug } = useGetShopsSlugBySlugQuery(slug ?? '', {
    skip: !shouldFetchBySlug,
  });
  const { data: shopDataById } = useGetShopsByShopIdQuery(shopIdLookup, {
    skip: !shopIdLookup,
  });

  const resolvedShopId = (shouldFetchBySlug
    ? shopDataBySlug?.id
    : shopDataById?.id) ?? '';

  useEffect(() => {
    if (resolvedShopId) {
      dispatch(setActiveShop({ shopId: resolvedShopId }));
    }
  }, [dispatch, resolvedShopId]);

  const { data: shopProducts = [] } = useGetProductsQuery(resolvedShopId, {
    skip: !resolvedShopId,
  });

  const normalizedProducts = useMemo<Product[]>(
    () => shopProducts.map(toLegacyProduct),
    [shopProducts]
  );

  const categories = useMemo<CategoryOption[]>(() => {
    const map = new Map<string, string>();

    normalizedProducts.forEach((product) => {
      product.categories.forEach((category) => {
        const label = category.name?.trim();
        if (!label) return;
        const id = toCategoryId(label);
        if (!map.has(id)) {
          map.set(id, label);
        }
      });
    });

    return Array.from(map.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [normalizedProducts]);

  const groupedItems = useMemo<Record<string, Product[]>>(() => {
    const grouped: Record<string, Product[]> = {};
    normalizedProducts.forEach((product) => {
      const primaryCategory = product.categories[0]?.name?.trim();
      if (!primaryCategory) return;
      const categoryId = toCategoryId(primaryCategory);
      if (!grouped[categoryId]) grouped[categoryId] = [];
      grouped[categoryId].push(product);
    });
    return grouped;
  }, [normalizedProducts]);

  const categoryLabels = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.label;
      return acc;
    }, {});
  }, [categories]);

  const handleAddToCart = (item: Product) => {
    console.log('Added to cart:', item);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <NavBar />
      </div>
      <HeroSection />
      <CategoryFilterBar categories={categories} />
      <div className="w-full flex items-center justify-center flex-col mt-4">
        <CustomerMenuList
          groupedItems={groupedItems}
          categoryLabels={categoryLabels}
          onAddToCart={handleAddToCart}
        />
      </div>
      <Footer />
    </>
  );
};

export default ShopView;
