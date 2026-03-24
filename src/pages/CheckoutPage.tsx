import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import { CheckoutPageSkeleton } from '../components/Skeletons';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import NavBar from '../components/NavBar';
import Footer from '../components/footer';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loadCart,
  selectCartItems,
  selectCartTotal,
  incrementItem,
  decrementItem,
  removeItem,
  clearCart,
} from '../store/slices/cartSlice';
import { formatDollars } from '../utils/money';
import {
  useGetShopBySlugQuery,
  useGetOrderByPaymentIntentQuery,
  useCreateOrderMutation,
  type CheckoutResponse,
} from '../services/api';
import { resolveShopBranding, type ShopWithBranding } from '../utils/branding';
import { saveGuestOrder } from '../utils/guestOrders';

// Load Stripe at module level (PCI + performance requirement)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

// --- Payment step (must be inside <Elements>) ---
interface PaymentStepProps {
  subtotalCents: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  subtotalCents,
  currency,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    setPaying(false);
    if (result.error) {
      onError(result.error.message ?? 'Payment failed');
    } else if (result.paymentIntent?.status === 'succeeded') {
      onSuccess(result.paymentIntent.id);
    }
  }

  const isReady = stripe && elements && elementReady;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Total:{' '}
        <span className="font-semibold text-gray-800">
          {currency.toUpperCase()} {formatDollars(subtotalCents / 100)}
        </span>
      </div>

      {/* Loading skeleton shown until Stripe iframe is ready */}
      {!elementReady && (
        <div className="space-y-3">
          <div className="skeleton h-11 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-11 rounded-xl" />
            <div className="skeleton h-11 rounded-xl" />
          </div>
          <p className="text-xs text-center text-gray-400">Loading payment form…</p>
        </div>
      )}

      <PaymentElement onReady={() => setElementReady(true)} />

      <button
        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handlePay}
        disabled={!isReady || paying}
      >
        {paying
          ? 'Processing…'
          : !isReady
            ? 'Loading…'
            : `Pay ${currency.toUpperCase()} ${formatDollars(subtotalCents / 100)}`}
      </button>
    </div>
  );
};

// --- Main checkout page ---
const CheckoutPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);

  // Branding — same pattern as ShopView
  const { data: shopData, isLoading: isShopLoading } = useGetShopBySlugQuery(slug ?? '', {
    skip: !slug,
  });
  const resolvedShopData = shopData as ShopWithBranding | undefined;
  const resolvedShopId = shopData?.id ?? '';
  const resolvedBranding = resolveShopBranding(resolvedShopData?.branding);
  const shopName = resolvedShopData?.name ?? 'Online Ordering';

  const brandStyle = useMemo(
    () =>
      ({
        '--brand-primary': resolvedBranding.colors.primary,
        '--brand-secondary': resolvedBranding.colors.secondary,
        '--brand-tertiary': resolvedBranding.colors.tertiary,
        '--brand-background': resolvedBranding.colors.background,
      }) as CSSProperties,
    [resolvedBranding],
  );

  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty('--brand-primary', resolvedBranding.colors.primary);
    s.setProperty('--brand-secondary', resolvedBranding.colors.secondary);
    s.setProperty('--brand-tertiary', resolvedBranding.colors.tertiary);
    s.setProperty('--brand-background', resolvedBranding.colors.background);
  }, [resolvedBranding]);

  // Load cart using slug key (consistent with ItemCard)
  useEffect(() => {
    if (!slug) return;
    dispatch(loadCart({ shopId: slug }));
  }, [dispatch, slug]);

  // Checkout flow state
  type Step = 'info' | 'payment' | 'success';
  const [step, setStep] = useState<Step>('info');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(
    null,
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  // Controls polling — true until we get a successful order response
  const [polling, setPolling] = useState(false);

  const [initiateCheckout, { isLoading: isInitiating, error: initiateError }] =
    useCreateOrderMutation();

  // Poll every 2 s after payment succeeds until the backend confirms the order.
  // The backend processes the Stripe webhook asynchronously, so the first call
  // may return 404. pollingInterval keeps retrying until isSuccess is true.
  const { data: orderData, isSuccess: isOrderSuccess } =
    useGetOrderByPaymentIntentQuery(paymentIntentId ?? '', {
      skip: !paymentIntentId,
      pollingInterval: polling ? 2000 : 0,
    });

  // Stop polling and persist order locally once confirmed
  useEffect(() => {
    if (isOrderSuccess && orderData) {
      setPolling(false);
      saveGuestOrder({
        orderId: orderData.orderId,
        orderRef: orderData.orderRef,
        status: orderData.status,
        items: orderData.items.map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          lineTotalCents: it.lineTotalCents,
        })),
        subtotalCents: orderData.subtotalCents,
        currency: orderData.currency,
        customerName: orderData.customerName,
        createdAt: orderData.createdAt,
        shopName,
        shopSlug: slug ?? '',
      });
    }
  }, [isOrderSuccess, orderData, shopName, slug]);

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) return;
    const result = await initiateCheckout({
      shopId: resolvedShopId,
      items: cartItems.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        selectedVariantOptionId: it.variantId,
        selectedAddonOptionIds: it.addonOptionIds,
      })),
      customerName,
      customerEmail,
      customerPhone,
      customerNotes: customerNotes || undefined,
    });
    if ('data' in result && result.data) {
      setCheckoutData(result.data);
      setStep('payment');
    }
  }

  function handlePaymentSuccess(piId: string) {
    dispatch(clearCart());
    setPaymentIntentId(piId);
    setPolling(true);
    setStep('success');
  }

  // Helpers for success screen
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (isShopLoading) return <CheckoutPageSkeleton />;

  return (
    <div className="bg-gray-50/60 min-h-screen flex flex-col" style={brandStyle}>
      {/* Sticky NavBar */}
      <div className="sticky top-0 z-50">
        <NavBar
          shopName={shopName}
          shopId={slug ?? ''}
          logoUrl={resolvedBranding.logoUrl}
        />
      </div>

      {/* Main content — grows to push footer down */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: resolvedBranding.colors.primary }}
        >
          Checkout
        </h1>

        {step === 'success' ? (
          // ── Success screen ──────────────────────────────────────────────
          <div className="max-w-lg mx-auto space-y-6 py-6">
            {/* Icon + heading */}
            <div className="text-center space-y-3">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white text-4xl"
                style={{ backgroundColor: resolvedBranding.colors.primary }}
              >
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Order Confirmed!
              </h2>
              <p className="text-gray-500 text-sm">
                Thank you
                {orderData?.customerName ? `, ${orderData.customerName}` : ''}.
                Your order has been placed.
              </p>
            </div>

            {!isOrderSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div
                  className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin"
                  style={{ borderTopColor: resolvedBranding.colors.primary }}
                />
                <p className="text-sm text-gray-400">
                  Fetching your order details…
                </p>
              </div>
            ) : orderData ? (
              <div className="bg-white rounded-xl shadow-md divide-y">
                {/* Order meta */}
                <div className="p-5 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Reference</span>
                    <span className="font-semibold">#{orderData.orderRef}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="capitalize font-medium text-green-600">
                      {orderData.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Placed at</span>
                    <span>{formatDate(orderData.createdAt)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Items
                  </p>
                  {orderData.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {it.productName} × {it.quantity}
                      </span>
                      <span className="font-medium">
                        {formatDollars(it.lineTotalCents / 100)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="p-5 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {orderData.currency.toUpperCase()}{' '}
                    {formatDollars(orderData.subtotalCents / 100)}
                  </span>
                </div>
              </div>
            ) : null}

            <button
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white px-6 py-3 rounded-lg transition-colors font-medium"
              onClick={() => navigate(`/shops/${slug}`)}
            >
              Back to Menu
            </button>
          </div>
        ) : (
          // ── 2-column layout ─────────────────────────────────────────────
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left col — editable cart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Your Order</h2>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-gray-500">Your cart is empty.</p>
                  <button
                    className="text-sm font-medium underline"
                    style={{ color: resolvedBranding.colors.primary }}
                    onClick={() => navigate(`/shops/${slug}`)}
                  >
                    Back to Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((it) => (
                    <div
                      key={it.key}
                      className="flex items-center gap-3 py-3 border-b last:border-b-0"
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            No image
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {it.name}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {formatDollars(it.price)} each
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                            onClick={() =>
                              dispatch(decrementItem({ key: it.key }))
                            }
                          >
                            −
                          </button>
                          <span className="text-sm w-6 text-center">
                            {it.quantity}
                          </span>
                          <button
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                            onClick={() =>
                              dispatch(incrementItem({ key: it.key }))
                            }
                          >
                            +
                          </button>
                        </div>
                        <div className="text-sm font-medium">
                          {formatDollars(it.quantity * it.price)}
                        </div>
                        <button
                          className="text-xs text-red-400 hover:text-red-600"
                          onClick={() => dispatch(removeItem({ key: it.key }))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 text-sm">
                    <span>Total</span>
                    <span>{formatDollars(cartTotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right col — customer info + payment */}
            <div className="lg:sticky lg:top-24 bg-white rounded-xl shadow-md p-6">
              {step === 'info' && (
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold">Your Details</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Notes
                      <span className="text-gray-400 font-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] resize-none"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="Any special instructions for your order…"
                    />
                  </div>

                  {initiateError && (
                    <p className="text-red-600 text-sm">
                      {'data' in initiateError
                        ? ((initiateError.data as any)?.error ??
                          'Checkout failed')
                        : 'Checkout failed'}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
                    disabled={cartItems.length === 0 || isInitiating}
                  >
                    {isInitiating ? 'Loading…' : 'Continue to Payment'}
                  </button>
                </form>
              )}

              {step === 'payment' && checkoutData && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Payment</h2>
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret: checkoutData.clientSecret }}
                  >
                    <PaymentStep
                      subtotalCents={checkoutData.subtotalCents}
                      currency={checkoutData.currency}
                      onSuccess={handlePaymentSuccess}
                      onError={(msg) => setPaymentError(msg)}
                    />
                    {paymentError && (
                      <p className="text-red-600 text-sm mt-3">
                        {paymentError}
                      </p>
                    )}
                  </Elements>
                  <button
                    className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
                    onClick={() => setStep('info')}
                  >
                    Back to details
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
