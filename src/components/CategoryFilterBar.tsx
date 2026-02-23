import React, { useEffect, useState } from 'react';
type CategoryOption = { id: string; label: string; count?: number };

interface CategoryFilterBarProps {
  categories: CategoryOption[];
}

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ categories }) => {
  const [selected, setSelected] = useState(() => categories[0]?.id ?? '');
  const [hovered, setHovered] = useState('');

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
            onMouseEnter={() => setHovered(cat.id)}
            onMouseLeave={() => setHovered('')}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
            style={
              selected === cat.id
                ? {
                    backgroundColor: 'var(--brand-primary)',
                    color: '#fff',
                  }
                : hovered === cat.id
                  ? {
                      backgroundColor: 'var(--brand-tertiary)',
                      color: '#fff',
                      border: '1px solid var(--brand-tertiary)',
                    }
                  : {
                      backgroundColor: 'var(--brand-background)',
                      color: 'var(--brand-secondary)',
                      border: '1px solid var(--brand-tertiary)',
                    }
            }
          >
            <span>{cat.label}</span>
            {typeof cat.count === 'number' ? (
              <span className="ml-2 text-xs opacity-80">{cat.count}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilterBar;
