// ItemCard.tsx - Concise presentational card that derives shopId from URL and opens ProductModal
import React, { useState } from 'react';
import Button from './Button';
import ProductModal, { Product as ModalProduct } from './ProductModal';

export type Product = ModalProduct;

type AddToCartPayload = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantId?: string;
  addonOptionIds?: string[];
};

type ItemCardProps = {
  product: Product;
  onAddToCart?: (payload: AddToCartPayload) => void;
};

const ItemCard: React.FC<ItemCardProps> = ({ product, onAddToCart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayPrice =
    typeof product.price === 'number' && Number.isFinite(product.price)
      ? product.price
      : 0;

  // derive shopId from URL so we can pass to modal (optional)
  const parts =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)
      : [];
  const shopId = parts[0];

  return (
    <>
      <div className="rounded-xl shadow-md bg-white overflow-hidden flex flex-col">
        <img
          src={product.imageURL || 'https://via.placeholder.com/320x180'}
          alt={product.label}
          className="w-full h-36 md:h-44 lg:h-48 object-cover"
        />
        <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
          <h3 className="text-lg font-bold text-secondary-500">
            {product.label}
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            ${displayPrice.toFixed(2)}
          </p>
          <p className="text-gray-500 text-sm line-clamp-2">
            {product.description}
          </p>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsModalOpen(true)}
            >
              View Details
            </Button>
          </div>
        </div>
      </div>

      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shopId={shopId}
        onAddToCart={(payload) => {
          onAddToCart && onAddToCart(payload);
        }}
      />
    </>
  );
};

export default ItemCard;
