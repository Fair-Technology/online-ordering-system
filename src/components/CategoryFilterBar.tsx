import React, { useEffect, useState } from 'react';
type CategoryOption = { id: string; label: string; count?: number };

interface CategoryFilterBarProps {
  categories: CategoryOption[];
}

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ categories }) => {
  const [selected, setSelected] = useState(() => categories[0]?.id ?? '');
  const [hovered, setHovered] = useState('');
  const STICKY_OFFSET = 140;

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
    setHovered('');
    document.getElementById(categoryId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    if (!categories.length) return;
    const lastCategoryId = categories[categories.length - 1]?.id ?? '';
    let ticking = false;

    const updateSelectedByScroll = () => {
      const anchorY = window.scrollY + STICKY_OFFSET + 8;
      let activeId = categories[0].id;

      for (const category of categories) {
        const sectionEl = document.getElementById(category.id);
        if (!sectionEl) continue;
        if (sectionEl.offsetTop <= anchorY) {
          activeId = category.id;
        } else {
          break;
        }
      }

      // Ensure the last section gets selected near page bottom even if its top
      // never crosses the anchor due to limited remaining scroll space.
      const scrollBottom = window.scrollY + window.innerHeight;
      const pageBottom = document.documentElement.scrollHeight;
      if (pageBottom - scrollBottom <= 4) {
        activeId = lastCategoryId || activeId;
      }

      setSelected((prev) => (prev === activeId ? prev : activeId));
    };

    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateSelectedByScroll();
        ticking = false;
      });
    };

    updateSelectedByScroll();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
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
