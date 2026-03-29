/**
 * Formats an ISO date string into a human-readable medium date and short time.
 * Uses the browser's locale for localisation.
 * e.g. "2024-03-15T10:30:00Z" → "Mar 15, 2024, 10:30 AM"
 */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/**
 * Converts a raw API status string to a display-friendly label.
 * Replaces underscores with spaces and capitalises the first letter.
 * e.g. "pending_payment" → "Pending payment"
 */
export const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
