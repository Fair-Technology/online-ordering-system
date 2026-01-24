import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { groupProductsByCategory } from '../utils/groupProductsByCategory';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';
import {
  useShopsGetBySlugQuery,
  useShopsMenuQuery,
  type ProductDto,
} from '../services/api';
import NavBar from '../components/NavBar';
import { Product } from '../types/Product';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setActiveShop } from '../store/slices/shopSlice';

const toLegacyProduct = (product: ProductDto): Product => ({
  id: product.id,
  label: product.label,
  imageURL: '',
  description: product.description ?? '',
  isAvailable: product.isAvailable,
  price: product.price,
  categories: product.categories.map((category) => ({
    id: category.id,
    name: category.name,
  })),
  variantTypes: product.variantTypes.map((group) => ({
    id: group.id,
    label: group.label,
    variants: group.options.map((option) => ({
      id: option.id,
      label: option.label,
      imageURL: '',
      priceDelta: option.priceDelta,
      isAvailable: option.isAvailable,
    })),
  })),
  addons: product.addons.map((group) => ({
    id: group.id,
    label: group.label,
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label,
      imageURL: '',
      priceDelta: option.priceDelta,
      isAvailable: option.isAvailable,
    })),
  })),
});

const ShopView = () => {
  const { shopId: routeShopId, slug } = useParams<{
    shopId?: string;
    slug?: string;
  }>();
  const dispatch = useAppDispatch();
  const storedShopId = useAppSelector((state) => state.shop.activeShopId);

  const { data: shopDataBySlug } = useShopsGetBySlugQuery(slug ?? '', {
    skip: !slug,
  });
  const resolvedShopId =
    routeShopId ?? shopDataBySlug?.id ?? storedShopId ?? '';

  useEffect(() => {
    if (routeShopId) {
      dispatch(setActiveShop({ shopId: routeShopId }));
      return;
    }

    if (shopDataBySlug?.id) {
      dispatch(
        setActiveShop({ shopId: shopDataBySlug.id, slug: shopDataBySlug.slug })
      );
    }
  }, [dispatch, routeShopId, shopDataBySlug]);
  // use RTK Query hook (skip when no shopId)
  const { data: shopData } = useShopsMenuQuery(resolvedShopId ?? '', {
    skip: !resolvedShopId,
  });

  const normalizedProducts = useMemo<Product[]>(
    () => (shopData?.products ?? []).map(toLegacyProduct),
    [shopData?.products]
  );

  const groupedItems = groupProductsByCategory(normalizedProducts);
  console.log('Grouped items:', groupedItems);

  const handleAddToCart = (item: Product) => {
    console.log('Added to cart:', item);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <NavBar />
      </div>
      <HeroSection />
      <CategoryFilterBar />
      <div className="w-full flex items-center justify-center flex-col mt-4">
        <CustomerMenuList
          groupedItems={groupedItems}
          onAddToCart={handleAddToCart}
        />
      </div>
      <Footer />
    </>
  );
};

export default ShopView;
