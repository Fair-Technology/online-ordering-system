import React from 'react';
import ItemCard from '../../../components/ItemCard';
import { Product } from '../../../types/Product';

type CategoryLabelMap = Record<string, string>;

interface CustomerMenuListProps {
  groupedItems: Record<string, Product[]>;
  categoryLabels: CategoryLabelMap;
  categoryCounts: Record<string, number>;
  onAddToCart: (item: Product) => void;
}

const CustomerMenuList: React.FC<CustomerMenuListProps> = ({
  groupedItems,
  categoryLabels,
  categoryCounts,
  onAddToCart,
}) => {
  const hasAnyMultiItemCategory = Object.values(groupedItems).some(
    (items) => items.length > 1
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16 px-4 sm:px-6">
      {Object.entries(groupedItems).map(([categoryId, items]) => (
        <section
          key={categoryId}
          id={categoryId}
          className="scroll-mt-36"
        >
          <h2 className="mb-6 inline-flex items-center rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white">
            <span>{categoryLabels[categoryId] ?? categoryId}</span>
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
              {categoryCounts[categoryId] ?? items.length}
            </span>
          </h2>

          <div
            className={`menu-rail-mobile ${!hasAnyMultiItemCategory && items.length === 1 ? 'menu-rail-single' : ''}`}
          >
            {items.map((item) => (
              <div key={`${categoryId}-${item.id}`}>
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
