import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag } from 'lucide-react';
import { Icon } from './Icon';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loadCart,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  incrementItem,
  decrementItem,
  removeItem,
  clearCart,
} from '../store/slices/cartSlice';
import { useGetShopsSlugBySlugQuery } from '../services/api';
import { formatDollars } from '../utils/money';

const NavBar: React.FC = () => {
  const [shopName, setShopName] = useState('');
  const [open, setOpen] = useState(false);

  const { shopId: shopSlug } = useParams<{ shopId: string }>();
  const { data: shopData } = useGetShopsSlugBySlugQuery(shopSlug ?? '', {
    skip: !shopSlug,
  });
  const shopId = shopData?.id ?? '';

  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);

  useEffect(() => {
    if (shopData?.name) setShopName(shopData.name);
  }, [shopData]);

  useEffect(() => {
    if (!shopId) return;
    dispatch(loadCart({ shopId }));
  }, [dispatch, shopId]);

  // ref for the cart button so we can position the portal dropdown
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  // compute dropdown position when opening and update on resize/scroll
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setDropdownPos(null);
      return;
    }
    const DROPDOWN_WIDTH = 384; // matches w-96
    function compute() {
      const rect = buttonRef.current!.getBoundingClientRect();
      const left = Math.min(
        Math.max(rect.right - DROPDOWN_WIDTH, 8),
        window.innerWidth - DROPDOWN_WIDTH - 8
      );
      const top = rect.bottom + window.scrollY + 8;
      setDropdownPos({ left, top, width: DROPDOWN_WIDTH });
    }
    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
    };
  }, [open]);

  // close cart when clicking outside button/dropdown
  useEffect(() => {
    if (!open) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;

      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;

      setOpen(false);
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [open]);

  function handleCheckout() {
    // const payload = {
    //   shopId,
    //   createdAt: new Date().toISOString(),
    //   itemCount: cartItems.reduce((s, it) => s + it.quantity, 0),
    //   totalAmount: cartTotal,
    //   items: cartItems.map((it) => ({
    //     productId: it.id,
    //     variantId: it.variantId,
    //     addonOptionIds: it.addonOptionIds,
    //     unitPrice: it.price,
    //     quantity: it.quantity,
    //   })),
    // };
    // TODO: call backend orders API, then dispatch(clearCart()) on success
  }

  return (
    <header className="bg-gradient-to-r from-white to-primary-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png"
            alt="Delicio"
            className="h-8 w-8"
          />
          <span className="text-primary-600 font-bold text-xl">{shopName}</span>
        </div>

        <div className="flex items-center gap-4 relative">
          <button
            ref={buttonRef}
            className="relative"
            onClick={() => setOpen((v) => !v)}
            aria-label="Cart"
          >
            {Icon(ShoppingBag, { className: 'text-primary-600' })}
            <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full px-1">
              {cartCount}
            </span>
          </button>

          {/* render dropdown via portal anchored to button */}
          {open &&
            dropdownPos &&
            createPortal(
              <div
                ref={dropdownRef}
                role="dialog"
                aria-label="Cart dropdown"
                style={{
                  position: 'absolute',
                  left: dropdownPos.left,
                  top: dropdownPos.top,
                  width: dropdownPos.width,
                  zIndex: 9999,
                }}
              >
                <div className="bg-white shadow-lg rounded-md p-3">
                  <h4 className="font-semibold mb-2">Your Order</h4>
                  {cartItems.length === 0 ? (
                    <div className="text-sm text-gray-500">No items yet</div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-auto space-y-2">
                        {cartItems.map((it) => (
                          <div
                            key={it.key}
                            className="flex items-center gap-3 text-sm py-2 px-1 rounded hover:bg-gray-50"
                          >
                            <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                              {it.imageUrl ? (
                                <img
                                  src={it.imageUrl}
                                  alt={it.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs text-gray-500">
                                  No image
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {it.name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {it.quantity} × {formatDollars(it.price)} ={' '}
                                {formatDollars(it.quantity * it.price)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-1">
                                <button
                                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                                  onClick={() =>
                                    dispatch(decrementItem({ key: it.key }))
                                  }
                                >
                                  -
                                </button>
                                <div className="text-xs px-2">
                                  {it.quantity}
                                </div>
                                <button
                                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                                  onClick={() =>
                                    dispatch(incrementItem({ key: it.key }))
                                  }
                                >
                                  +
                                </button>
                              </div>
                              <button
                                className="text-xs text-red-500"
                                onClick={() =>
                                  dispatch(removeItem({ key: it.key }))
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-2 mt-2 flex items-center justify-between">
                        <div className="font-semibold">Total</div>
                        <div className="font-semibold">
                          {formatDollars(cartTotal)}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          className="flex-1 bg-primary-500 text-white px-3 py-2 rounded"
                          onClick={handleCheckout}
                        >
                          Checkout
                        </button>
                        <button
                          className="px-3 py-2 border rounded"
                          onClick={() => dispatch(clearCart())}
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
