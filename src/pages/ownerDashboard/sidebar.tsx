import React from 'react';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { icon: HomeIcon, label: 'Dashboard', to: '/owner' },
    { icon: BuildingStorefrontIcon, label: 'Shops', to: '/owner/shops' },
    { icon: CubeIcon, label: 'Products', to: '/owner/products' },
    { icon: CogIcon, label: 'Settings', to: '/owner/settings' },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-lg border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <span className="text-xl font-semibold text-red-800">
          Administrator
        </span>
      </div>

      {/* Menu Items */}
      <nav className="mt-6">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/owner' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={index}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              to={item.to}
            >
              <IconComponent className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
