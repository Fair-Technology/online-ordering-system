import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';

const OnlineOrderingSystem = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: ['openid', 'profile', 'email'],
      redirectStartPage: '/user-creation',
    });
  };

  const handleOwnerNavigation = () => {
    navigate('/owner');
  };

  return (
    <div className="h-screen w-full flex items-center justify-center flex-col bg-gray-50 px-4">
      <h1 className="text-3xl font-semibold text-gray-900 text-center">
        Welcome to Online Ordering System
      </h1>
      <p className="mt-3 text-center text-gray-600 max-w-xl">
        Launch your own shop experience or manage existing stores through our
        owner dashboard powered by Microsoft Entra ID.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleLogin}
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-800 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
        >
          Admin Signup/Login
        </button>
        {accounts.length > 0 && (
          <button
            onClick={handleOwnerNavigation}
            className="px-6 py-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Owner Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default OnlineOrderingSystem;
