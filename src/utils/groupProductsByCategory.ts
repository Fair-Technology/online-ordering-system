import { Product } from '../types/Product';

export function groupProductsByCategory(
  items?: Product[]
): Record<string, Product[]> {
  const safeItems = Array.isArray(items) ? items : [];

  const dynamicOrder: string[] = [];
  const grouped = safeItems.reduce<Record<string, Product[]>>((acc, item) => {
    const categoryId =
      item.categories && item.categories.length > 0
        ? item.categories[0].id.toLowerCase()
        : null;

    // skip if category is missing
    if (!categoryId) return acc;

    if (!dynamicOrder.includes(categoryId)) dynamicOrder.push(categoryId);
    if (!acc[categoryId]) acc[categoryId] = [];
    acc[categoryId].push(item);

    return acc;
  }, {});

  // build ordered result based on first-seen category order
  const ordered: Record<string, Product[]> = {};
  dynamicOrder.forEach((cat) => {
    ordered[cat] = grouped[cat];
  });

  return ordered;
}
