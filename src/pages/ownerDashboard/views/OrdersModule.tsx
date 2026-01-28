import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  useShopsListQuery,
  useShopsMenuQuery,
  useOrdersListByShopQuery,
  useOrdersListAllQuery,
  useOrdersCreateMutation,
  useOrdersUpdateStatusMutation,
  type ShopMenuDto,
  type Order as OrderResponse,
  type CreateOrderInput,
} from '../../../services/api';

type ShopOrder = OrderResponse;
type OrderStatus = ShopOrder['status'];
type ShopMenu = ShopMenuDto;
type ShopMenuProduct = ShopMenu['products'][number];
type NewOrderItem = CreateOrderInput['items'][number];
const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  placed: 'accepted',
  accepted: 'ready_for_pickup',
  ready_for_pickup: 'completed',
  completed: null,
  rejected: null,
  cancelled: null,
};

const OrdersModule = () => {
  const { data: shops = [], isLoading: shopsLoading } = useShopsListQuery();
  const [selectedShopId, setSelectedShopId] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | ''>(
    ''
  );
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerNotes: '',
    items: [] as NewOrderItem[],
    pendingEntryId: '',
    pendingVariantId: '',
    pendingQuantity: 1,
    pendingAddons: new Set<string>(),
  });
  const [adminFilters, setAdminFilters] = useState({ shopId: '', userId: '' });
  useEffect(() => {
    if (!selectedShopId && shops.length) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  const {
    data: shopOrders = [],
    isLoading: shopOrdersLoading,
    isError: shopOrdersError,
    refetch: refetchShopOrders,
  } = useOrdersListByShopQuery(
    {
      shopId: selectedShopId,
      status: orderStatusFilter || undefined,
    },
    { skip: !selectedShopId }
  );
  const shopOrdersErrorMessage = shopOrdersError
    ? 'Unable to load orders.'
    : null;

  const {
    data: menuResponse,
    isLoading: menuLoading,
  } = useShopsMenuQuery(selectedShopId ?? '', {
    skip: !selectedShopId,
  });
  const menu = menuResponse ?? null;

  const {
    data: adminOrders = [],
    isLoading: adminLoading,
    refetch: refetchAdminOrders,
  } = useOrdersListAllQuery({
    shopId: adminFilters.shopId || undefined,
    userId: adminFilters.userId || undefined,
  });
  const [createOrder, { isLoading: creatingOrder }] =
    useOrdersCreateMutation();
  const [updateOrderStatus] = useOrdersUpdateStatusMutation();

  useEffect(() => {
    if (shopOrders.length) {
      setSelectedOrder(shopOrders[0]);
    } else {
      setSelectedOrder(null);
    }
  }, [shopOrders]);

  const handleAdvanceStatus = async (order: ShopOrder) => {
    if (!selectedShopId) return;
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) {
      alert('Order is already terminal.');
      return;
    }
    setUpdatingOrderId(order.id);
    try {
      await updateOrderStatus({
        shopId: selectedShopId,
        orderId: order.id,
        updateOrderStatusInput: { nextStatus },
      }).unwrap();
      await refetchShopOrders();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Unable to advance order status.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const productsById = useMemo(() => {
    const map = new Map<string, ShopMenuProduct>();
    menu?.products?.forEach((product) => map.set(product.id, product));
    return map;
  }, [menu]);

  const pendingProduct = newOrderForm.pendingEntryId
    ? productsById.get(newOrderForm.pendingEntryId)
    : undefined;
  const pendingVariants = pendingProduct?.variantTypes.flatMap(
    (group) => group.options
  );
  const pendingAddons =
    pendingProduct?.addons.flatMap((group) =>
      group.options.map((option) => ({
        ...option,
        groupLabel: group.label,
      }))
    ) ?? [];

  const handleAddItem = () => {
    if (!pendingProduct || !newOrderForm.pendingVariantId) {
      alert('Select a product and variant first.');
      return;
    }
    const item: NewOrderItem = {
      productId: pendingProduct.id,
      productVariantId: newOrderForm.pendingVariantId,
      quantity: newOrderForm.pendingQuantity,
      addonOptionIds: Array.from(newOrderForm.pendingAddons),
    };
    setNewOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, item],
      pendingEntryId: '',
      pendingVariantId: '',
      pendingQuantity: 1,
      pendingAddons: new Set(),
    }));
  };

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedShopId) return;
    if (newOrderForm.items.length === 0) {
      alert('Add at least one item.');
      return;
    }
    try {
      await createOrder({
        shopId: selectedShopId,
        createOrderInput: {
          userId: 'admin-ui',
          customerName: newOrderForm.customerName,
          customerPhone: newOrderForm.customerPhone,
          customerNotes: newOrderForm.customerNotes,
          items: newOrderForm.items,
        },
      }).unwrap();
      setNewOrderForm({
        customerName: '',
        customerPhone: '',
        customerNotes: '',
        items: [],
        pendingEntryId: '',
        pendingVariantId: '',
        pendingQuantity: 1,
        pendingAddons: new Set(),
      });
      await refetchShopOrders();
      await refetchAdminOrders();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to create order.'
      );
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600">
            Monitor real-time order flow per shop, create new tickets, and audit
            every storefront from a single screen.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={selectedShopId}
            onChange={(event) => setSelectedShopId(event.target.value)}
            disabled={shopsLoading || shops.length === 0}
          >
            {shops.length === 0 ? (
              <option value="">
                {shopsLoading ? 'Loading shops…' : 'No shops available'}
              </option>
            ) : (
              shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))
            )}
          </select>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={orderStatusFilter}
            onChange={(event) =>
              setOrderStatusFilter(event.target.value as OrderStatus | '')
            }
          >
            <option value="">All statuses</option>
            {['placed', 'accepted', 'ready_for_pickup', 'completed', 'rejected', 'cancelled'].map(
              (status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Shop order board
            </h2>
            <p className="text-sm text-gray-600">
              Filter by status, inspect details, and promote orders with audit
              friendly confirmations.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {shopOrders.length} orders in view
          </p>
        </header>
        {shopOrdersLoading ? (
          <p className="text-sm text-gray-500">Loading orders…</p>
        ) : shopOrdersErrorMessage ? (
          <p className="text-sm text-red-600">{shopOrdersErrorMessage}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
              {shopOrders.map((order) => (
                <article
                  key={order.id}
                  className={`rounded-xl border px-4 py-3 cursor-pointer ${
                    selectedOrder?.id === order.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      #{order.id.slice(-6)} · {order.customerName}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(order.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.totalAmount.amount.toFixed(2)}{' '}
                      {order.totalAmount.currency}
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <div className="rounded-xl border border-gray-200 p-4 min-h-[28rem]">
              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        Order {selectedOrder.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedOrder.customerName} •{' '}
                        {selectedOrder.customerPhone || 'No phone'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700"
                    >
                      {selectedOrder.status}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="rounded-lg border border-gray-100 p-3"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {item.productNameSnapshot} × {item.quantity}
                        </p>
                        <p className="text-xs text-gray-500">
                          Variant: {item.variantLabelSnapshot}
                        </p>
                        {item.addons.length > 0 && (
                          <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                            {item.addons.map((addon) => (
                              <li key={addon.addonOptionId}>
                                {addon.nameSnapshot} (+{' '}
                                {addon.priceDeltaSnapshot.amount.toFixed(2)}{' '}
                                {addon.priceDeltaSnapshot.currency})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Notes: {selectedOrder.customerNotes || '—'}
                  </p>
                  {statusFlow[selectedOrder.status] ? (
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      disabled={updatingOrderId === selectedOrder.id}
                      onClick={() => handleAdvanceStatus(selectedOrder)}
                    >
                      {updatingOrderId === selectedOrder.id
                        ? 'Updating…'
                        : `Advance to ${statusFlow[selectedOrder.status]}`}
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Order is in a terminal state.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Select an order to review details.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Manual order entry
        </h2>
        {menuLoading ? (
          <p className="text-sm text-gray-500">Loading products…</p>
        ) : (
          <form className="space-y-4" onSubmit={handleCreateOrder}>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                className="rounded-md border border-gray-300 px-3 py-2"
                placeholder="Customer name"
                value={newOrderForm.customerName}
                onChange={(event) =>
                  setNewOrderForm((prev) => ({
                    ...prev,
                    customerName: event.target.value,
                  }))
                }
                required
              />
              <input
                className="rounded-md border border-gray-300 px-3 py-2"
                placeholder="Customer phone"
                value={newOrderForm.customerPhone}
                onChange={(event) =>
                  setNewOrderForm((prev) => ({
                    ...prev,
                    customerPhone: event.target.value,
                  }))
                }
              />
              <input
                className="rounded-md border border-gray-300 px-3 py-2"
                placeholder="Notes"
                value={newOrderForm.customerNotes}
                onChange={(event) =>
                  setNewOrderForm((prev) => ({
                    ...prev,
                    customerNotes: event.target.value,
                  }))
                }
              />
            </div>
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-4">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2"
                  value={newOrderForm.pendingEntryId}
                  onChange={(event) =>
                    setNewOrderForm((prev) => ({
                      ...prev,
                      pendingEntryId: event.target.value,
                      pendingVariantId: '',
                      pendingAddons: new Set(),
                    }))
                  }
                >
                  <option value="">Select product</option>
                  {menu?.products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-gray-300 px-3 py-2"
                  value={newOrderForm.pendingVariantId}
                  onChange={(event) =>
                    setNewOrderForm((prev) => ({
                      ...prev,
                      pendingVariantId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select variant</option>
                  {pendingVariants?.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label} (+{variant.priceDelta} USD)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="rounded-md border border-gray-300 px-3 py-2"
                  value={newOrderForm.pendingQuantity}
                  onChange={(event) =>
                    setNewOrderForm((prev) => ({
                      ...prev,
                      pendingQuantity: Number(event.target.value),
                    }))
                  }
                />
                <button
                  type="button"
                  className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm font-semibold hover:bg-gray-800"
                  onClick={handleAddItem}
                >
                  Add item
                </button>
              </div>
              {pendingAddons.length > 0 && (
                <div className="grid gap-2 md:grid-cols-3">
                      {pendingAddons.map((addon) => (
                        <label
                          key={addon.id}
                          className="flex items-center gap-2 text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2"
                        >
                      <input
                        type="checkbox"
                        checked={newOrderForm.pendingAddons.has(addon.id)}
                        onChange={(event) =>
                          setNewOrderForm((prev) => {
                            const pendingAddons = new Set(prev.pendingAddons);
                            if (event.target.checked) {
                              pendingAddons.add(addon.id);
                            } else {
                              pendingAddons.delete(addon.id);
                            }
                            return { ...prev, pendingAddons };
                          })
                        }
                      />
                      {addon.groupLabel}: {addon.label} (+ {addon.priceDelta} USD)
                    </label>
                  ))}
                </div>
              )}
            </div>
            {newOrderForm.items.length > 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Pending items
                </p>
                {newOrderForm.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex items-center justify-between text-sm text-gray-700"
                  >
                    <span>
                      {productsById.get(item.productId)?.label ?? item.productId}{' '}
                      × {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() =>
                        setNewOrderForm((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={creatingOrder}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {creatingOrder ? 'Submitting…' : 'Create order'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Administrative order log
            </h2>
            <p className="text-sm text-gray-600">
              Cross-shop visibility with filters by shop or customer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={adminFilters.shopId}
              onChange={(event) =>
                setAdminFilters((prev) => ({
                  ...prev,
                  shopId: event.target.value,
                }))
              }
            >
              <option value="">All shops</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Filter by user ID"
              value={adminFilters.userId}
              onChange={(event) =>
                setAdminFilters((prev) => ({
                  ...prev,
                  userId: event.target.value,
                }))
              }
            />
            <button
              type="button"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => refetchAdminOrders()}
            >
              Refresh
            </button>
          </div>
        </div>
        {adminLoading ? (
          <p className="text-sm text-gray-500">Loading orders…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Shop</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      #{order.id.slice(-6)}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{order.shopId}</td>
                    <td className="px-3 py-2 text-gray-600">{order.userId}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {order.status}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {order.totalAmount.amount.toFixed(2)}{' '}
                      {order.totalAmount.currency}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(order.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default OrdersModule;
