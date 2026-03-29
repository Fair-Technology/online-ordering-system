import React from 'react';
import { ICON_MAP } from '../../utils/iconMap';
import ProductCard from './ProductCard';
import { Product } from '../../types/Product';

type CategoryLabelMap = Record<string, string>;

interface MenuListProps {
  groupedItems: Record<string, Product[]>;
  categoryLabels: CategoryLabelMap;
  categoryCounts: Record<string, number>;
  categoryIcons: Record<string, string>;
  onAddToCart: (item: Product) => void;
}

/**
 * MenuList — Renders all menu categories and their product cards.
 *
 * Each category section has an `id` matching its slug (from slugifyCategoryName)
 * so that CategoryFilterBar can scroll to it and detect which section is in view.
 *
 * The `menu-rail-mobile` CSS class provides a horizontal scroll rail on mobile
 * and switches to a responsive grid at sm/md/lg breakpoints (see main.css).
 * `menu-rail-single` is applied when a category has only one product to prevent
 * the single card from stretching to full width on mobile.
 */
const MenuList: React.FC<MenuListProps> = ({
  groupedItems,
  categoryLabels,
  categoryCounts,
  categoryIcons,
  onAddToCart,
}) => {
  const hasAnyMultiItemCategory = Object.values(groupedItems).some(
    (items) => items.length > 1,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16 px-4 sm:px-6">
      {Object.entries(groupedItems).map(([categoryId, items]) => {
        const iconName = categoryIcons[categoryId];
        const IconComponent = iconName ? ICON_MAP[iconName] : null;
        return (
          <section key={categoryId} id={categoryId} className="scroll-mt-36">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              {IconComponent && (
                <IconComponent className="h-4 w-4 text-gray-400" />
              )}
              <span>{categoryLabels[categoryId] ?? categoryId}</span>
              <span className="ml-1 text-sm font-normal text-gray-400">
                ({categoryCounts[categoryId] ?? items.length})
              </span>
            </h2>

            <div
              className={`menu-rail-mobile ${!hasAnyMultiItemCategory && items.length === 1 ? 'menu-rail-single' : ''}`}
            >
              {items.map((item) => (
                <div key={`${categoryId}-${item.id}`} className="h-full">
                  <ProductCard
                    product={item}
                    onAddToCart={() => onAddToCart?.(item)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default MenuList;
