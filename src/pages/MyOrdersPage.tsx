import React, { CSSProperties, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import NavBar from '../components/NavBar';
import Footer from '../components/footer';
import { getGuestOrders } from '../utils/guestOrders';
import { formatDollars } from '../utils/money';
import { useGetShopBySlugQuery } from '../services/api';
import { resolveShopBranding, type ShopWithBranding } from '../utils/branding';

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-blue-100 text-blue-700',
};

const MyOrdersPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Shop branding — same pattern as CheckoutPage
  const { data: shopData } = useGetShopBySlugQuery(slug ?? '', {
    skip: !slug,
  });
  const resolvedShopData = shopData as ShopWithBranding | undefined;
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

  // Only show orders for this shop
  const orders = getGuestOrders().filter((o) => o.shopSlug === slug);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="bg-white min-h-screen flex flex-col" style={brandStyle}>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <NavBar
          shopName={shopName}
          shopId={slug ?? ''}
          logoUrl={resolvedBranding.logoUrl}
          colors={resolvedBranding.colors}
        />
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: resolvedBranding.colors.primary }}
        >
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Receipt className="w-16 h-16 text-gray-200 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700">
              No orders yet
            </h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Looks like you haven't placed any orders here. Browse the menu and
              place your first order!
            </p>
            <button
              className="mt-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: resolvedBranding.colors.primary }}
              onClick={() => navigate(`/shops/${slug}`)}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>

            {orders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl shadow-md divide-y"
              >
                {/* Order header */}
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">
                        #{order.orderRef ?? '—'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusColors[order.status ?? ''] ??
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.status?.replace('_', ' ') ?? 'unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {order.shopName} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">
                      {order.currency?.toUpperCase() ?? ''}{' '}
                      {formatDollars((order.subtotalCents ?? 0) / 100)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-4 space-y-1.5">
                  {(order.items ?? []).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm text-gray-700"
                    >
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatDollars((item.lineTotalCents ?? 0) / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MyOrdersPage;
