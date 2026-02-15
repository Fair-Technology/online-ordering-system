import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OnlineOrderingSystem from './pages/onlineOrderingSystem';
import ShopView from './pages/shopView';
import NotFound from './pages/notFound';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OnlineOrderingSystem />} />
        <Route path="/shops/:slug" element={<ShopView />} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
