const STORAGE_KEY = 'orders_v1';

export interface GuestOrderItem {
  productName: string;
  quantity: number;
  lineTotalCents: number;
}

export interface GuestOrder {
  orderId: string;
  orderRef: string;
  status: string;
  items: GuestOrderItem[];
  subtotalCents: number;
  currency: string;
  customerName: string;
  createdAt: string;
  shopName: string;
  shopSlug: string;
}

export function saveGuestOrder(order: Omit<GuestOrder, never>): void {
  const orders = getGuestOrders();
  // Deduplicate by orderId
  const deduped = orders.filter((o) => o.orderId !== order.orderId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...deduped]));
}

export function getGuestOrders(): GuestOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestOrder[]) : [];
  } catch {
    return [];
  }
}
