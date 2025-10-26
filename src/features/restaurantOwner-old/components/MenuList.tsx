import { Item } from '../types';

interface MenuListProps {
  items: Item[];
}

const sizeLabelMap: Record<string, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
};

const MenuList: React.FC<MenuListProps> = ({ items }) => {
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Menu Items</h2>

      {items.length === 0 ? (
        <p className="text-gray-500 italic">No items available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg shadow-sm bg-white">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 text-sm font-semibold text-gray-600">
                  SN
                </th>

                <th className="px-4 py-2 text-sm font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-600">
                  Description
                </th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-600">
                  Price
                </th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-600">
                  Sizes
                </th>
                <th className="px-4 py-2 text-sm font-semibold text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  {/* SN */}
                  <td className="px-4 py-2 text-gray-600">{index + 1}</td>

                  {/* Name */}
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {item.name}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-2 text-gray-700">
                    {item.description}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-2 text-gray-900 font-semibold">
                    ${item.price.toFixed(2)}
                  </td>

                  {/* Sizes */}
                  <td className="px-4 py-2 text-gray-700">
                    {Array.isArray(item.size)
                      ? item.size.map((s) => sizeLabelMap[s] || s).join(', ')
                      : sizeLabelMap[item.size] || item.size}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MenuList;
