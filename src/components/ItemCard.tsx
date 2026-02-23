// ItemCard.tsx - Concise presentational card that derives shopId from URL and opens ProductModal
import React, { useState } from 'react';
import Button from './Button';
import ProductModal, { Product as ModalProduct } from './ProductModal';
import { formatDollars } from '../utils/money';

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
      <div
        className="rounded-xl shadow-md bg-white overflow-hidden flex flex-col cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <div className="w-full aspect-[4/3] overflow-hidden">
          <img
            src={product.imageURL || 'https://via.placeholder.com/320x180'}
            alt={product.label}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-[var(--brand-secondary)] line-clamp-1">
            {product.label}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base">
            {formatDollars(displayPrice)}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm line-clamp-2">
            {product.description}
          </p>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="w-full text-xs sm:text-sm"
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
