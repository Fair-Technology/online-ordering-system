import { groupProductsByCategory } from '../utils/groupProductsByCategory';
import { Product } from '../features/restaurantOwner-old/types';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';
import { useShopsMenuQuery } from '../store/api/ownerApi';
import NavBar from '../components/NavBar';

const ShopView = () => {
  const shopId = '5988777b-a0dc-4a52-b06e-8ed35e01830a'; // At the moment we are hardcoding the shopId
  // use RTK Query hook (skip when no shopId)
  const { data: shopData } = useShopsMenuQuery(shopId ?? '', {
    skip: !shopId,
  });

  const groupedItems = groupProductsByCategory(shopData?.products || []);

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
