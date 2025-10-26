import CustomerMenuList from '../components/CustomerMenuList';
import { Item } from '../../restaurantOwner-old/types';
import { dummyItems } from '../data/dummyMenuData';
import { groupItemsByCategory } from '../../../utils/groupItemsByCategory';

const CustomerDashboard: React.FC = () => {
  const handleAddToCart = (item: Item) => {
    console.log('Added to cart:', item);
  };

  // Group items by category
  const groupedItems = groupItemsByCategory(dummyItems);

  return (
    <div>
      <CustomerMenuList
        groupedItems={groupedItems}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default CustomerDashboard;
