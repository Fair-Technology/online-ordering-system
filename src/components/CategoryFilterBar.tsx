import React, { useEffect, useState } from 'react';

// if one need to add more categories or arrange the order then one should update the CATEGORY_ORDER in groupItemsByCategory.ts
const categories = ['mains', 'sides', 'drinks', 'snacks', 'desserts'];

const CategoryFilterBar: React.FC = () => {
  const [selected, setSelected] = useState('mains');

  // Scroll to section when clicking
  const handleClick = (category: string) => {
    setSelected(category);
    document.getElementById(category)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  // Highlight section when scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries.find((entry) => entry.isIntersecting);
        if (visibleSection) setSelected(visibleSection.target.id);
      },
      { threshold: 0.3 } // active when 30% visible
    );

    categories.forEach((cat) => {
      const el = document.getElementById(cat);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[64px] z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 px-6 py-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleClick(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selected === cat
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilterBar;
