import React from 'react';

import SearchBar from './SearchBar';

const HeroSection: React.FC = () => {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  return (
    <section
      className="relative h-72 md:h-96 bg-center bg-cover flex flex-col items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
      {/* Content */}
      <div className="relative z-10 text-center text-white space-y-6">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-wide bg-primary-500 inline-block px-6 py-2 rounded-md shadow-lg">
          Our Menu
        </h1>

        {/* Search Bar */}
        <SearchBar
          placeholder='Search for dishes, e.g. "Pizza, Burger..."'
          onSearch={handleSearch}
        />
      </div>
    </section>
  );
};

export default HeroSection;
