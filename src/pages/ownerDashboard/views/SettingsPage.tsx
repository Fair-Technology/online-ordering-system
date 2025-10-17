const SettingsPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">
          Update the preferences for your organisation and storefronts.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Contact email
          </label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="owner@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Default notification channel
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Email</option>
            <option>SMS</option>
            <option>Push notifications</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Receive weekly performance reports
          </span>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition">
            <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
          </button>
        </div>

        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
