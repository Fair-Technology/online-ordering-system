import { CSSProperties, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';
import {
  useGetShopBySlugQuery,
  useGetShopByIdQuery,
  useGetProductsByShopQuery,
  type ProductResponse,
} from '../services/api';
import NavBar from '../components/NavBar';
import { Product } from '../types/Product';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setActiveShop } from '../store/slices/shopSlice';
import { centsToDollars } from '../utils/money';
import {
  resolveShopBranding,
  type ShopWithBranding,
} from '../utils/branding';

type CategoryOption = { id: string; label: string; count: number };

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
  const navigate = useNavigate();
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

  const {
    data: shopDataBySlug,
    isLoading: isSlugLoading,
    isError: isSlugError,
    error: slugError,
  } = useGetShopBySlugQuery(slug ?? '', {
    skip: !shouldFetchBySlug,
  });
  const { data: shopDataById, isLoading: isIdLoading } = useGetShopByIdQuery(shopIdLookup, {
    skip: !shopIdLookup,
  });
  const resolvedShopData = (shouldFetchBySlug
    ? shopDataBySlug
    : shopDataById) as ShopWithBranding | undefined;

  const resolvedShopId = (shouldFetchBySlug
    ? shopDataBySlug?.id
    : shopDataById?.id) ?? '';
  const resolvedBranding = resolveShopBranding(resolvedShopData?.branding);
  const shopName = resolvedShopData?.name ?? 'Online Ordering';

  const brandStyle = useMemo(
    () =>
      ({
        '--brand-primary': resolvedBranding.colors.primary,
        '--brand-secondary': resolvedBranding.colors.secondary,
        '--brand-tertiary': resolvedBranding.colors.tertiary,
        '--brand-background': resolvedBranding.colors.background,
      }) as CSSProperties,
    [resolvedBranding]
  );

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--brand-primary', resolvedBranding.colors.primary);
    rootStyle.setProperty('--brand-secondary', resolvedBranding.colors.secondary);
    rootStyle.setProperty('--brand-tertiary', resolvedBranding.colors.tertiary);
    rootStyle.setProperty(
      '--brand-background',
      resolvedBranding.colors.background
    );
  }, [resolvedBranding]);

  useEffect(() => {
    if (resolvedShopId) {
      dispatch(setActiveShop({ shopId: resolvedShopId }));
    }
  }, [dispatch, resolvedShopId]);

  const { data: shopProducts = [] } = useGetProductsByShopQuery(resolvedShopId, {
    skip: !resolvedShopId,
  });

  const normalizedProducts = useMemo<Product[]>(
    () => shopProducts.map(toLegacyProduct),
    [shopProducts]
  );

  const categories = useMemo<CategoryOption[]>(() => {
    const map = new Map<string, { label: string; count: number }>();

    normalizedProducts.forEach((product) => {
      const primaryCategory = product.categories[0]?.name?.trim();
      if (!primaryCategory) return;
      const id = toCategoryId(primaryCategory);
      const existing = map.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(id, { label: primaryCategory, count: 1 });
      }
    });

    return Array.from(map.entries()).map(([id, value]) => ({
      id,
      label: value.label,
      count: value.count,
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

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = category.count;
      return acc;
    }, {});
  }, [categories]);

  const handleAddToCart = (item: Product) => {
    console.log('Added to cart:', item);
  };

  const isLoading = shouldFetchBySlug ? isSlugLoading : isIdLoading;

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--brand-primary,#FF8C32)] rounded-full animate-spin" />
      </div>
    );
  }

  if (
    shouldFetchBySlug &&
    isSlugError &&
    slugError &&
    'status' in slugError &&
    slugError.status === 404
  ) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <h1 className="text-2xl font-semibold">Shop does not exist</h1>
      </div>
    );
  }

  return (
    <div className="bg-white" style={brandStyle}>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <NavBar
          shopName={shopName}
          shopId={slug ?? ''}
          logoUrl={resolvedBranding.logoUrl}
          colors={resolvedBranding.colors}
          onCheckout={() => navigate(`/shops/${slug}/checkout`)}
        />
      </div>
      <HeroSection
        heroImageUrl={resolvedBranding.heroImageUrl}
        colors={resolvedBranding.colors}
      />
      <CategoryFilterBar categories={categories} />
      <div className="w-full flex items-center justify-center flex-col mt-4">
        <CustomerMenuList
          groupedItems={groupedItems}
          categoryLabels={categoryLabels}
          categoryCounts={categoryCounts}
          onAddToCart={handleAddToCart}
        />
      </div>
      <Footer />
    </div>
  );
};

export default ShopView;
