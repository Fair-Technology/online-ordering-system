import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OnlineOrderingSystem from './pages/onlineOrderingSystem';
import ShopView from './pages/shopView';
import OwnerDashboard from './pages/ownerDashboard/ownerDashboard';
import NotFound from './pages/notFound';
import ProtectedRoute from './routes/ProtectedRoute';
import UserCreation from './pages/user-creation';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OnlineOrderingSystem />} />
        <Route path="/user-creation" element={<UserCreation />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/owner/*" element={<OwnerDashboard />} />
        </Route>
        <Route path="/:shopId" element={<ShopView />} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
