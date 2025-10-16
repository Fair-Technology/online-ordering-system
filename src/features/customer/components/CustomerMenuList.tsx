import React from 'react';
import ItemCard from '../../../components/ItemCard';
import { Item } from '../../restaurantOwner/types';

interface CustomerMenuListProps {
  groupedItems: Record<string, Item[]>;
  onAddToCart: (item: Item) => void;
}

const CustomerMenuList: React.FC<CustomerMenuListProps> = ({
  groupedItems,
  onAddToCart,
}) => {
  return (
    <div className="max-w-7xl mx-auto space-y-16 px-4">
      {Object.entries(groupedItems).map(([category, items]) => (
        <section
          key={category}
          id={category}
          className="scroll-mt-36" // offsets sticky filter bar
        >
          {/* Category Heading */}
          <h2 className="inline-block bg-primary-500 text-white font-bold px-4 py-2 rounded-md mb-6">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h2>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-accent-200 bg-white shadow-sm p-4 rounded-lg hover:shadow-md transition"
                onClick={() => onAddToCart(item)}
              >
                <ItemCard
                  name={item.name}
                  price={`$${item.price.toFixed(2)}`}
                  imageUrl={item.imageUrl || ''}
                  eta="20-25 min"
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CustomerMenuList;
