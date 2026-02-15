import React, { useEffect, useState } from 'react';

type CategoryOption = { id: string; label: string };

interface CategoryFilterBarProps {
  categories: CategoryOption[];
}

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ categories }) => {
  const [selected, setSelected] = useState(() => categories[0]?.id ?? '');

  useEffect(() => {
    if (!categories.length) {
      setSelected('');
      return;
    }
    if (!selected || !categories.find((cat) => cat.id === selected)) {
      setSelected(categories[0].id);
    }
  }, [categories, selected]);

  const handleClick = (categoryId: string) => {
    setSelected(categoryId);
    document.getElementById(categoryId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    if (!categories.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries.find((entry) => entry.isIntersecting);
        if (visibleSection) setSelected(visibleSection.target.id);
      },
      { threshold: 0.3 }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  if (!categories.length) return null;

  return (
    <div className="sticky top-[64px] z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 px-6 py-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selected === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilterBar;
