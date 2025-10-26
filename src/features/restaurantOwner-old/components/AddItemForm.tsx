import React, { useState } from 'react';
import { Item } from '../types';

interface AddItemFormProps {
  onCancel: () => void;
  onSubmit: (item: Item) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onCancel, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [size, setSize] = React.useState('');
  const [isAvailable, setIsAvailable] = React.useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: Item = {
      id: crypto.randomUUID(),
      shopId: 'Shop_1', // This should be set appropriately later on by retrieving the actual shop ID
      name,
      description,
      price: typeof price === 'string' ? 0 : price,
      size,
      isAvailable,
      createdAt: new Date().toISOString(),
      category: 'mains',
    };

    console.log(newItem);

    onSubmit(newItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full border border-gray-300 p-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)} // store as array for consistency
              className="w-full border border-gray-300 p-2 rounded-md"
              required
            >
              <option value="">Select a size</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium">Available</label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemForm;
