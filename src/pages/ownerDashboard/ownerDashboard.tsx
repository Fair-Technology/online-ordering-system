import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './sidebar';
import TopBar from './topBar';
import DashboardHome from './views/DashboardHome';
import ShopsPage from './views/ShopsPage';
import ProductsPage from './views/ProductsPage';
import SettingsPage from './views/SettingsPage';
import AuthHandler from '../../components/AuthHandler';

const OwnerDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Authentication Handler - handles user saving after login */}
      <AuthHandler />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="shops" element={<ShopsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/owner" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
