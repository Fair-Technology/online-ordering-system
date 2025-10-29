import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Icon } from './Icon';
import { useShopsGetByIdQuery } from '../store/api/ownerApi';

// const navLinks = ['Menu', 'Our Purpose', 'About Us'];

const NavBar: React.FC = () => {
  const [shopName, setShopName] = useState('');

  // derive shopId from first path segment, e.g. /kfc -> "kfc"
  const parts =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)
      : [];
  const shopId = '5988777b-a0dc-4a52-b06e-8ed35e01830a'; //we will hardcode for demo purpose

  // use RTK Query hook (skip when no shopId)
  const { data: shopData } = useShopsGetByIdQuery(shopId ?? '', {
    skip: !shopId,
  });

  useEffect(() => {
    if (shopData?.name) setShopName(shopData.name);
  }, [shopData]);

  return (
    <header className="bg-gradient-to-r from-white to-primary-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
            alt="Delicio"
            className="h-8 w-8"
          />
          <span className="text-primary-600 font-bold text-xl">{shopName}</span>
        </div>

        {/* Nav Links */}
        {/* <nav className="hidden md:flex gap-4">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="px-3 py-2 rounded-full text-gray-800 hover:bg-primary-200 transition-colors"
            >
              {link}
            </a>
          ))}
        </nav> */}

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <button className="relative">
            {Icon(ShoppingBag, { className: 'text-primary-600' })}
            <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full px-1">
              1
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
