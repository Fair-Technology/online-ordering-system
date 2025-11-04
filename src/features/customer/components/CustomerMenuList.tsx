import React from 'react';
import ItemCard from '../../../components/ItemCard';
import { Product } from '../../restaurantOwner-old/types';

interface CustomerMenuListProps {
  groupedItems: Record<string, Product[]>;
  onAddToCart: (item: Product) => void;
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
                key={`${category}-${item.id}`}
                className="border border-accent-200 bg-white shadow-sm p-4 rounded-lg hover:shadow-md transition"
              >
                <ItemCard
                  product={item as any}
                  onAddToCart={() => onAddToCart && onAddToCart(item)}
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
