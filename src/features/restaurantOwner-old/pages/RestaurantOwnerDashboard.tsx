import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import MenuPage from "./MenuPage";

const RestaurantOwnerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Local navigation for restaurant owner */}
      <nav className="p-4 bg-white shadow-md flex space-x-4">
        <Link
          to="/restaurantOwner"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Overview
        </Link>
        <Link
          to="/restaurantOwner/orders"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Orders
        </Link>
        <Link
          to="/restaurantOwner/menu"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Menu Management
        </Link>
      </nav>

      {/* Nested routes */}
      <Routes>
        <Route
          path="/"
          element={
            <h1 className="p-6 text-2xl font-bold">
              Welcome, Restaurant Owner!
            </h1>
          }
        />
        <Route
          path="orders"
          element={<h1 className="p-6 text-2xl font-bold">Orders Page</h1>}
        />
        <Route path="menu" element={<MenuPage />} />
      </Routes>
    </div>
  );
};

export default RestaurantOwnerDashboard;
