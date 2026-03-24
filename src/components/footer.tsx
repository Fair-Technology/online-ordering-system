const Footer = () => (
  <footer className="w-full bg-gray-50 border-t border-gray-200 mt-12">
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex flex-col gap-1">
        <span className="font-bold text-gray-900 text-base">Fair-Technology</span>
        <span className="text-xs text-gray-400">Online ordering, made simple.</span>
      </div>
      <nav className="flex gap-6 text-sm text-gray-500">
        <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
        <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
        <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
      </nav>
    </div>
    <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
      &copy; {new Date().getFullYear()} Fair-Technology. All rights reserved.
    </div>
  </footer>
);

export default Footer;
