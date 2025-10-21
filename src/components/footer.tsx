import { useMsal } from '@azure/msal-react';
import { useEffect } from 'react';

const Footer = () => {
  const { instance, accounts } = useMsal();

  // User saving is now handled by AuthHandler component

  // Note: User saving is now handled by AuthHandler component in the owner dashboard
  // This useEffect is kept for debugging purposes only
  useEffect(() => {
    console.log('Footer useEffect triggered, accounts:', accounts.length);
    if (accounts.length > 0) {
      console.log('User found in footer (handled by AuthHandler)');
    }
  }, [accounts]);

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: ['openid', 'profile', 'email'],
      redirectStartPage: '/owner',
    });
  };

  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: '/',
    });
  };

  return (
    <footer className="w-full bg-gray-50 border-t mt-8">
      <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="text-sm text-gray-600 mb-3 sm:mb-0">
          &copy; 2025 Fair-Technology
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <a href="#" className="text-gray-700 hover:text-indigo-600 text-sm">
            Home
          </a>
          <a href="#" className="text-gray-700 hover:text-indigo-600 text-sm">
            About
          </a>
          <a href="#" className="text-gray-700 hover:text-indigo-600 text-sm">
            Contact
          </a>
          <a href="#" className="text-gray-700 hover:text-indigo-600 text-sm">
            Privacy
          </a>
          <a href="#" className="text-gray-700 hover:text-indigo-600 text-sm">
            Terms
          </a>

          {accounts.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Welcome, {accounts[0].name?.split(' ')[0] || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 text-sm cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="text-gray-700 hover:text-indigo-600 hover:underline text-sm cursor-pointer"
            >
              Admin Login
            </button>
          )}

          {/* User save status is now shown in console logs via AuthHandler */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
