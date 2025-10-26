import { useParams } from 'react-router-dom';
import { groupItemsByCategory } from '../utils/groupItemsByCategory';
import { dummyItems } from '../features/customer/data/dummyMenuData';
import { Item } from '../features/restaurantOwner-old/types';
import NavBar from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import CategoryFilterBar from '../components/CategoryFilterBar';
import CustomerMenuList from '../features/customer/components/CustomerMenuList';
import Footer from '../components/footer';

type ShopParams = {
  shopId: string;
};
const ShopView = () => {
  const { shopId } = useParams<ShopParams>();

  ///// FIRE API CALL
  ///// If failed, redirect them to <NotFound/>

  const groupedItems = groupItemsByCategory(dummyItems);

  const handleAddToCart = (item: Item) => {
    console.log('Added to cart:', item);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <NavBar />
      </div>
      <HeroSection />
      <CategoryFilterBar />
      <div className="w-full flex items-center justify-center flex-col">
        <h2 className="text-xl font-semibold">{shopId}</h2>
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
