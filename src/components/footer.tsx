import { useMsal } from '@azure/msal-react';

const Footer = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: ['openid'],
      redirectStartPage: '/owner',
    });
  };

  return (
    <footer className="w-full bg-gray-50 border-t mt-8">
      <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="text-sm text-gray-600 mb-3 sm:mb-0">
          &copy; 2025 Fair-Technology
        </div>
        <div className="flex flex-wrap gap-4">
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
          <a
            onClick={handleLogin}
            className="text-gray-700 hover:text-grey-100 hover:underline  text-sm cursor-pointer"
          >
            Admin Login
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
