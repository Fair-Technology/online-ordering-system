import { CSSProperties, useEffect, useMemo } from 'react';
import { ShopPageSkeleton } from '../components/Skeletons';
import { useParams, useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';
import {
  useGetShopBySlugQuery,
  useGetShopByIdQuery,
  useGetCatalogQuery,
  type CatalogCategoryDto,
  type CatalogProductDto,
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

type CategoryOption = { id: string; label: string; count: number; icon?: string };

const toCategoryId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toLegacyCatalogProduct = (
  product: CatalogProductDto,
  cat: CatalogCategoryDto
): Product => ({
  id: product.id ?? '',
  label: product.name ?? '',
  imageURL:
    [...(product.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]
      ?.url ?? '',
  description: product.description ?? '',
  isAvailable: product.isAvailable ?? true,
  price: centsToDollars(product.price ?? 0),
  categories: [{ id: cat.id ?? '', name: cat.name ?? '', icon: cat.icon ?? undefined }],
  specialInfo: (product.specialInfo ?? []).map((s) => ({
    icon: s.icon,
    name: s.name,
  })),
  variantTypes: ((product.variants ?? []) as any[]).map((group) => ({
    id: group.id ?? '',
    label: group.name ?? '',
    variants: (group.options ?? []).map((opt: any) => ({
      id: opt.id ?? '',
      label: opt.name ?? '',
      imageURL: '',
      priceDelta: centsToDollars(opt.priceDelta ?? 0),
      isAvailable: opt.isAvailable ?? true,
    })),
  })),
  addons: ((product.addons ?? []) as any[]).map((group) => ({
    id: group.id ?? '',
    label: group.name ?? '',
    options: (group.options ?? []).map((opt: any) => ({
      id: opt.id ?? '',
      label: opt.name ?? '',
      imageURL: '',
      priceDelta: centsToDollars(opt.priceDelta ?? 0),
      isAvailable: opt.isAvailable ?? true,
    })),
  })),
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

  const { data: catalogData } = useGetCatalogQuery(resolvedShopId, {
    skip: !resolvedShopId,
  });

  const visibleCategories = useMemo(
    () =>
      (catalogData?.categories ?? [])
        .filter((cat) => cat.name && (cat.products?.length ?? 0) > 0)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [catalogData]
  );

  const categories = useMemo<CategoryOption[]>(
    () =>
      visibleCategories.map((cat) => ({
        id: toCategoryId(cat.name!),
        label: cat.name!,
        count: cat.products?.length ?? 0,
        icon: cat.icon ?? undefined,
      })),
    [visibleCategories]
  );

  const categoryIcons = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        visibleCategories
          .filter((cat) => cat.icon)
          .map((cat) => [toCategoryId(cat.name!), cat.icon!])
      ),
    [visibleCategories]
  );

  const groupedItems = useMemo<Record<string, Product[]>>(() => {
    const grouped: Record<string, Product[]> = {};
    visibleCategories.forEach((cat) => {
      const id = toCategoryId(cat.name!);
      grouped[id] = (cat.products ?? [])
        .filter((p) => p.isAvailable !== false)
        .map((p) => toLegacyCatalogProduct(p, cat));
    });
    return grouped;
  }, [visibleCategories]);

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
    return <ShopPageSkeleton />;
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
    <div className="bg-gray-50/60 min-h-screen" style={brandStyle}>
      <div className="sticky top-0 z-50">
        <NavBar
          shopName={shopName}
          shopId={slug ?? ''}
          logoUrl={resolvedBranding.logoUrl}
          onCheckout={() => navigate(`/shops/${slug}/checkout`)}
        />
      </div>
      <HeroSection heroImageUrl={resolvedBranding.heroImageUrl} />
      <CategoryFilterBar categories={categories} />
      <div className="w-full flex items-center justify-center flex-col mt-4">
        <CustomerMenuList
          groupedItems={groupedItems}
          categoryLabels={categoryLabels}
          categoryCounts={categoryCounts}
          categoryIcons={categoryIcons}
          onAddToCart={handleAddToCart}
        />
      </div>
      <Footer />
    </div>
  );
};

export default ShopView;
