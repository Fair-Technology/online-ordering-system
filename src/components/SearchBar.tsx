import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Icon } from './Icon';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search our menu e.g. Burger, Pizza...',
  onSearch,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    if (onSearch) onSearch(searchValue);
  };

  return (
    <div className="flex items-center bg-white rounded-full shadow-md w-[90%] md:w-[500px] overflow-hidden mx-auto">
      <span className="pl-4 pr-2 text-gray-500">{Icon(Search)}</span>

      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // stop form submit
            handleSearch(); // trigger search
          }
        }}
        placeholder={placeholder}
        className="flex-1 px-5 py-3 rounded-l-full text-gray-800 focus:outline-none"
      />

      {searchValue && (
        <button
          className="p-3 text-gray-500 hover:text-gray-700"
          onClick={() => setSearchValue('')}
        >
          {Icon(X)}
        </button>
      )}

      <button
        onClick={handleSearch}
        className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 h-10 flex items-center justify-center rounded-full"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBar;
