import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Receipt } from 'lucide-react';
import { Icon } from './Icon';
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
import { formatDollars } from '../utils/money';

interface NavBarProps {
  shopName: string;
  shopId: string;
  logoUrl: string;
  onCheckout?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  shopName,
  shopId,
  logoUrl,
  onCheckout,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);

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
        window.innerWidth - DROPDOWN_WIDTH - 8,
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

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/shops/${shopId}`)}
            aria-label={`Go to ${shopName}`}
          >
            <img
              src={logoUrl}
              alt={shopName}
              className="h-8 w-8 rounded object-cover ring-2 ring-[var(--brand-primary)]"
            />
            <span className="font-bold text-xl text-gray-900">{shopName}</span>
          </button>

          <div className="flex items-center gap-4 relative">
            <div className="relative group">
              <button
                className="relative text-gray-700"
                onClick={() => navigate(`/shops/${shopId}/my-orders`)}
                aria-label="My Orders"
              >
                {Icon(Receipt, { className: 'w-5 h-5' })}
              </button>
              <span className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                My Orders
              </span>
            </div>
            <div className="relative group">
              <button
                ref={buttonRef}
                className="relative text-gray-700"
                onClick={() => setOpen((v) => !v)}
                aria-label="Cart"
              >
                {Icon(ShoppingBag, { className: '' })}
                <span className="absolute -top-2 -right-2 text-white text-xs rounded-full px-1 bg-gray-900">
                  {cartCount}
                </span>
              </button>
              <span className="pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
                Cart
              </span>
            </div>

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
                  <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-100 p-4">
                    <h4 className="font-semibold mb-3 text-gray-900">Your Order</h4>
                    {cartItems.length === 0 ? (
                      <div className="text-sm text-gray-500">No items yet</div>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-auto space-y-2">
                          {cartItems.map((it) => (
                            <div
                              key={it.key}
                              className="flex items-center gap-3 text-sm py-2 px-2 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
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
                                    className="w-7 h-7 flex items-center justify-center text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                    onClick={() =>
                                      dispatch(decrementItem({ key: it.key }))
                                    }
                                  >
                                    -
                                  </button>
                                  <div className="text-xs px-2 font-medium">
                                    {it.quantity}
                                  </div>
                                  <button
                                    className="w-7 h-7 flex items-center justify-center text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
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
                            className="flex-1 bg-gray-900 hover:bg-[var(--brand-primary)] text-white px-4 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                            onClick={() => {
                              setOpen(false);
                              onCheckout?.();
                            }}
                          >
                            Checkout
                          </button>
                          <button
                            className="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={() => dispatch(clearCart())}
                          >
                            Clear
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </div>
      </header>
    </>
  );
};

export default NavBar;
