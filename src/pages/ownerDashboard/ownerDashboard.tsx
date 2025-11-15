import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './sidebar';
import TopBar from './topBar';
import DashboardHome from './views/DashboardHome';
import ProductCategoriesPage from './views/ProductCategoriesPage';
import AssociationsModule from './views/AssociationsModule';
import OrdersModule from './views/OrdersModule';
import UsersModule from './views/UsersModule';
import ShopsPage from './views/ShopsPage';
import ShopProductsPage from './views/ShopProductsPage';

const OwnerDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route
                path="products/categories"
                element={<ProductCategoriesPage />}
              />
              <Route path="shops" element={<ShopsPage />} />
              <Route path="shops/:shopId" element={<ShopProductsPage />} />
              <Route path="associations" element={<AssociationsModule />} />
              <Route path="orders" element={<OrdersModule />} />
              <Route path="users" element={<UsersModule />} />
              <Route path="*" element={<Navigate to="/owner" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
