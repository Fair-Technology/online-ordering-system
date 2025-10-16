import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Icon } from './Icon';

// const navLinks = ['Menu', 'Our Purpose', 'About Us'];

const NavBar: React.FC = () => (
  <header className="bg-gradient-to-r from-white to-primary-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
      {/* Brand Logo */}
      <div className="flex items-center gap-2">
        <img
          src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
          alt="Delicio"
          className="h-8 w-8"
        />
        <span className="text-primary-600 font-bold text-xl">
          Mew Mew Food Order
        </span>
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

export default NavBar;
