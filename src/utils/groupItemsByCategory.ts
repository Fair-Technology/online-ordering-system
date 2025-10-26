import { Item } from '../features/restaurantOwner-old/types';

// keep a fixed order of categories
const CATEGORY_ORDER = [
  'mains',
  'sides',
  'drinks',
  'snacks',
  'desserts',
  'others',
];

export function groupItemsByCategory(items: Item[]): Record<string, Item[]> {
  // 1. Group items
  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const category = item.category || 'others';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // 2. Reorder based on CATEGORY_ORDER
  const ordered: Record<string, Item[]> = {};
  CATEGORY_ORDER.forEach((cat) => {
    if (grouped[cat]) {
      ordered[cat] = grouped[cat];
    }
  });

  return ordered;
}
