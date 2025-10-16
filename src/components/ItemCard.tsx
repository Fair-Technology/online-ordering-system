// ItemCard.tsx updated for responsive design and Tailwind classes
import React from 'react';
import Button from './Button';

interface ItemCardProps {
  name: string;
  price: string;
  imageUrl: string;
  eta: string;
}

const ItemCard: React.FC<ItemCardProps> = ({ name, price, imageUrl, eta }) => (
  <div className="rounded-xl shadow-md bg-white overflow-hidden flex flex-col">
    <img
      src={imageUrl}
      alt={name}
      className="w-full h-36 md:h-44 lg:h-48 object-cover"
    />
    <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
      <h3 className="text-lg font-bold text-secondary-500">{name}</h3>
      <p className="text-gray-600 text-sm md:text-base">{price}</p>
      <span className="text-[10px] md:text-xs bg-accent px-2 py-1 rounded-full w-max">
        {eta}
      </span>
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <Button className="w-full sm:w-auto">Add to Order</Button>
        <Button variant="outline" className="w-full sm:w-auto">
          View Details
        </Button>
      </div>
    </div>
  </div>
);

export default ItemCard;
