/**
 * Tailwind class strings for order/payment status badge colours.
 * Keyed by the raw status string returned by the API.
 *
 * Usage:
 *   const cls = STATUS_COLORS[order.status] ?? DEFAULT_STATUS_COLOR;
 *   <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>...</span>
 */
export const STATUS_COLORS: Record<string, string> = {
  paid:            'bg-green-100 text-green-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  failed:          'bg-red-100 text-red-700',
  cancelled:       'bg-gray-100 text-gray-600',
  refunded:        'bg-blue-100 text-blue-700',
};

/** Fallback classes when the status is unknown or not in STATUS_COLORS. */
export const DEFAULT_STATUS_COLOR = 'bg-gray-100 text-gray-600';
