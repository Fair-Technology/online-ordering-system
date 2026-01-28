import React, { useMemo, useState } from 'react';
import Button from './Button';
import TickCheckbox from './TickCheckbox';
import { useAppDispatch } from '../store/hooks';
import { addItem } from '../store/slices/cartSlice';

type VariantOption = {
  id: string;
  label: string;
  priceDelta?: number;
  imageURL?: string;
};
type VariantGroup = { id: string; label: string; variants: VariantOption[] };
type AddonOption = {
  id: string;
  label: string;
  priceDelta?: number;
  imageURL?: string;
};
type AddonGroup = { id: string; label: string; options: AddonOption[] };

export type Product = {
  id: string;
  label: string;
  imageURL?: string;
  description?: string;
  price: number;
  variantTypes?: VariantGroup[];
  addons?: AddonGroup[];
};

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (payload: any) => void; // returns payload added
  shopId?: string; // optional shop id to scope cart storage
}

/**
 * ProductModal
 * - Manages selection of variant + addons and quantity
 * - Calculates unit price and total
 * - Adds to Redux cart (shop-scoped)
 */
const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  shopId,
}) => {
  const dispatch = useAppDispatch();
  // determine effective shopId: explicit prop wins, otherwise try url-first-segment
  const urlParts =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean)
      : [];
  const effectiveShopId = shopId ?? urlParts[0];

  const initialVariantId = product.variantTypes?.[0]?.variants?.[0]?.id;
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | undefined
  >(initialVariantId);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set()
  );
  const [quantity, setQuantity] = useState<number>(1);

  const variantLookup = useMemo(() => {
    const m = new Map<string, VariantOption>();
    product.variantTypes?.forEach((g) =>
      g.variants.forEach((v) => m.set(v.id, v))
    );
    return m;
  }, [product]);

  const addonLookup = useMemo(() => {
    const m = new Map<string, AddonOption>();
    product.addons?.forEach((g) => g.options.forEach((o) => m.set(o.id, o)));
    return m;
  }, [product]);

  const unitPrice = useMemo(() => {
    const base = product.price || 0;
    const variantDelta = selectedVariantId
      ? variantLookup.get(selectedVariantId)?.priceDelta || 0
      : 0;
    const addonsDelta = Array.from(selectedAddonIds).reduce(
      (s, id) => s + (addonLookup.get(id)?.priceDelta || 0),
      0
    );
    return +(base + variantDelta + addonsDelta).toFixed(2);
  }, [
    product.price,
    selectedVariantId,
    selectedAddonIds,
    variantLookup,
    addonLookup,
  ]);

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddToCart() {
    // dispatch addItem to redux store (cart is persisted by slice)
    dispatch(
      addItem({
        shopId: effectiveShopId,
        item: {
          id: product.id,
          name: product.label,
          imageUrl: product.imageURL,
          price: unitPrice,
          quantity,
          variantId: selectedVariantId,
          addonOptionIds: Array.from(selectedAddonIds),
        },
      })
    );

    const payload = {
      id: product.id,
      name: product.label,
      unitPrice,
      quantity,
      variantId: selectedVariantId,
      addonOptionIds: Array.from(selectedAddonIds),
    };
    onAddToCart && onAddToCart(payload);
    // reset and close
    setQuantity(1);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto z-60 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{product.label}</h3>
          <button className="text-gray-600" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <img
              src={product.imageURL || 'https://via.placeholder.com/320x240'}
              alt={product.label}
              className="w-full h-48 object-cover rounded"
            />
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">{product.description}</p>

            {/* Variant groups */}
            {product.variantTypes?.map((group) => (
              <div key={group.id} className="mb-3">
                <div className="font-medium text-sm mb-2">{group.label}</div>
                <div className="flex gap-2 flex-wrap">
                  {group.variants.map((v) => (
                    <label
                      key={v.id}
                      className={`px-3 py-1 border rounded cursor-pointer text-sm ${
                        selectedVariantId === v.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`variant-${group.id}`}
                        value={v.id}
                        checked={selectedVariantId === v.id}
                        onChange={() => setSelectedVariantId(v.id)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <span>{v.label}</span>
                        {v.priceDelta ? (
                          <span className="text-xs text-gray-500">
                            +${v.priceDelta}
                          </span>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Addon groups using TickCheckbox */}
            {product.addons?.map((group) => (
              <div key={group.id} className="mb-3">
                <div className="font-medium text-sm mb-2">{group.label}</div>
                <div className="flex flex-col gap-2">
                  {group.options.map((opt) => (
                    <TickCheckbox
                      key={opt.id}
                      checked={selectedAddonIds.has(opt.id)}
                      onChange={() => toggleAddon(opt.id)}
                      label={opt.label}
                      hint={opt.priceDelta ? `+ $${opt.priceDelta}` : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center border rounded">
                <button
                  className="px-3 py-1 text-lg"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <div className="px-4">{quantity}</div>
                <button
                  className="px-3 py-1 text-lg"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <div className="ml-auto text-right">
                <div className="text-sm text-gray-500">Unit</div>
                <div className="text-xl font-semibold">
                  ${unitPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  Total ${(unitPrice * quantity).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                className="flex-1 bg-primary-500 text-white"
                onClick={handleAddToCart}
              >
                Add To Order
              </Button>
              <Button variant="outline" className="px-4" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
