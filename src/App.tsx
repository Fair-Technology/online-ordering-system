import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RestaurantOwnerDashboardPage from './features/restaurantOwner/pages/RestaurantOwnerDashboard';
import CustomerDashboard from './features/customer/pages/CustomerDashboard';
import NavBar from './sharedComponents/NavBar';
import HeroSection from './sharedComponents/HeroSection';
import CategoryFilterBar from './sharedComponents/CategoryFilterBar';
import LoginOwner from './login'

const App: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Entire page content scrolls */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <NavBar />
        </div>
        <HeroSection />
        <CategoryFilterBar />
        <main className="bg-app-gradient p-6">
          <Router>
            <Routes>
              <Route path="/" element={<CustomerDashboard />} />
              <Route path="/ownerlogin" element={<LoginOwner />} />
              <Route path="/restaurantOwner/*" element={<RestaurantOwnerDashboardPage />}
              />
            </Routes>
          </Router>
        </main>
      </div>
    </div>
  );
};

export default App;
