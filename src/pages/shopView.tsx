import { useMemo } from 'react';
import { groupProductsByCategory } from '../utils/groupProductsByCategory';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';
import { useGetShopMenuQuery } from '../store/api/shopsApi';
import NavBar from '../components/NavBar';
import { Product } from '../types/Product';
import type { ProductResponse } from '../store/api/backend-generated/apiClient';

const toLegacyProduct = (product: ProductResponse): Product => ({
  id: product.id,
  label: product.label,
  imageURL: product.media?.[0]?.url ?? '',
  description: product.description ?? '',
  isAvailable: product.isAvailable,
  price: product.price,
  categories: product.categoryDetails.map((category) => ({
    id: category.id,
    name: category.name,
  })),
  variantTypes: product.variantGroups.map((group) => ({
    id: group.id,
    label: group.label,
    variants: group.options.map((option) => ({
      id: option.id,
      label: option.label,
      imageURL: '',
      priceDelta: option.priceDelta.amount,
      isAvailable: option.isAvailable,
    })),
  })),
  addons: product.addonGroups.map((group) => ({
    id: group.id,
    label: group.label,
    options: group.options.map((option) => ({
      id: option.id,
      label: option.label,
      imageURL: '',
      priceDelta: option.priceDelta.amount,
      isAvailable: option.isAvailable,
    })),
  })),
});

const ShopView = () => {
  const shopId = '5988777b-a0dc-4a52-b06e-8ed35e01830a'; // At the moment we are hardcoding the shopId
  // use RTK Query hook (skip when no shopId)
  const { data: shopData } = useGetShopMenuQuery(shopId ?? '', {
    skip: !shopId,
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
