import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { CartItem } from '../store/slices/cartSlice';
import {
  useInitiateCheckoutMutation,
  type CheckoutResponse,
} from '../services/checkoutApi';
import { formatDollars } from '../utils/money';

// Load Stripe at module level (PCI + performance requirement)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  cartItems: CartItem[];
  onSuccess: () => void;
}

// --- Payment step inner component (must be inside <Elements>) ---
interface PaymentStepProps {
  subtotalCents: number;
  currency: string;
  onSuccess: () => void;
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
      onSuccess();
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Total:{' '}
        <span className="font-semibold text-gray-800">
          {currency.toUpperCase()} {formatDollars(subtotalCents / 100)}
        </span>
      </div>
      <PaymentElement />
      <button
        className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        onClick={handlePay}
        disabled={!stripe || !elements || paying}
      >
        {paying ? 'Processing…' : 'Pay'}
      </button>
    </div>
  );
};

// --- Main modal ---
const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onClose,
  shopId,
  cartItems,
  onSuccess,
}) => {
  type Step = 'info' | 'payment' | 'success';
  const [step, setStep] = useState<Step>('info');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [initiateCheckout, { isLoading: isInitiating, error: initiateError }] =
    useInitiateCheckoutMutation();

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await initiateCheckout({
      shopId,
      items: cartItems.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
        selectedVariantOptionId: it.variantId,
        selectedAddonOptionIds: it.addonOptionIds,
      })),
      customerName: customerName || undefined,
      customerEmail: customerEmail || undefined,
    });
    if ('data' in result && result.data) {
      setCheckoutData(result.data);
      setStep('payment');
    }
  }

  function handlePaymentSuccess() {
    setStep('success');
  }

  function handlePaymentError(message: string) {
    setPaymentError(message);
  }

  if (!open) return null;

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {step === 'info' && 'Your details'}
            {step === 'payment' && 'Payment'}
            {step === 'success' && 'Order confirmed!'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Step: info */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com (optional)"
              />
            </div>
            {initiateError && (
              <p className="text-red-600 text-sm">
                {'data' in initiateError
                  ? (initiateError.data as any)?.error ?? 'Checkout failed'
                  : 'Checkout failed'}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              disabled={isInitiating}
            >
              {isInitiating ? 'Loading…' : 'Continue to payment'}
            </button>
          </form>
        )}

        {/* Step: payment */}
        {step === 'payment' && checkoutData && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: checkoutData.clientSecret }}
          >
            <PaymentStep
              subtotalCents={checkoutData.subtotalCents}
              currency={checkoutData.currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
            {paymentError && (
              <p className="text-red-600 text-sm mt-3">{paymentError}</p>
            )}
          </Elements>
        )}

        {/* Step: success */}
        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">✓</div>
            <p className="text-gray-700">
              Your order has been placed successfully. Thank you!
            </p>
            <button
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white px-6 py-2 rounded transition-colors"
              onClick={() => {
                onSuccess();
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default CheckoutModal;
