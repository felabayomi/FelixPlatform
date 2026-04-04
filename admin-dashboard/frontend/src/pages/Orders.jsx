import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const number = Number(value);
    return Number.isNaN(number) ? '—' : `$${number.toFixed(2)}`;
};

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const statusActions = [
        { label: 'Pending', status: 'pending', payment_status: 'pending' },
        { label: 'Paid', status: 'processing', payment_status: 'paid' },
        { label: 'Processing', status: 'processing', payment_status: 'paid' },
        { label: 'Packed', status: 'packed', payment_status: 'paid' },
        { label: 'Shipped / Mailed', status: 'shipped', payment_status: 'paid' },
        { label: 'Delivered', status: 'delivered', payment_status: 'paid' },
        { label: 'Completed', status: 'completed', payment_status: 'paid' },
        { label: 'Cancelled', status: 'cancelled' }
    ];

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await API.get('/orders');
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error loading orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const updateOrderStatus = async (orderId, payload) => {
        setUpdatingOrderId(orderId);
        setError('');
        setMessage('');

        try {
            const res = await API.patch(`/orders/${orderId}/status`, payload);
            setOrders((current) => current.map((order) => (order.id === orderId ? res.data : order)));
            setMessage(`Order updated to ${res.data.status}${res.data.payment_status ? ` / ${res.data.payment_status}` : ''}.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating order status.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + Number(order.final_total ?? order.total ?? 0);
        }, 0);

        return {
            totalOrders: orders.length,
            storeOrders: orders.filter((order) => (order.app_name || 'Felix Store') === 'Felix Store').length,
            laundryOrders: orders.filter((order) => order.app_name === 'A & F Laundry').length,
            totalRevenue: formatMoney(totalRevenue)
        };
    }, [orders]);

    return (
        <div className="page-section">
            <div className="page-header section-actions">
                <div>
                    <h1>Orders</h1>
                    <p className="muted">Track Felix Store purchases and platform order totals from `/orders`.</p>
                </div>
                <button type="button" className="edit-button refresh-button" onClick={loadOrders}>
                    Refresh Orders
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="muted">Total Orders</span>
                    <strong>{stats.totalOrders}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Felix Store</span>
                    <strong>{stats.storeOrders}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">A &amp; F Laundry</span>
                    <strong>{stats.laundryOrders}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Revenue Snapshot</span>
                    <strong>{stats.totalRevenue}</strong>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
            {loading ? <p className="empty-state">Loading orders...</p> : null}

            {!loading && !orders.length ? (
                <p className="empty-state">No orders found yet.</p>
            ) : null}

            <div className="record-list">
                {orders.map((order) => (
                    <div key={order.id} className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>{order.app_name || 'Platform Order'}</h3>
                                <p className="muted">Order ID: {order.id}</p>
                            </div>
                            <div className="record-meta">
                                <span className={`status-badge status-${String(order.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                    {order.status || 'pending'}
                                </span>
                                <span className="meta-badge">{order.payment_status || 'pending payment'}</span>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div>
                                <span className="muted">Final Total</span>
                                <strong>{formatMoney(order.final_total ?? order.total)}</strong>
                            </div>
                            <div>
                                <span className="muted">Subtotal</span>
                                <strong>{formatMoney(order.subtotal)}</strong>
                            </div>
                            <div>
                                <span className="muted">Delivery</span>
                                <strong>{formatMoney(order.delivery_fee)}</strong>
                            </div>
                            <div>
                                <span className="muted">Tax</span>
                                <strong>{formatMoney(order.tax)}</strong>
                            </div>
                            <div>
                                <span className="muted">Payment Method</span>
                                <strong>{order.payment_method || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Delivery Type</span>
                                <strong>{order.delivery_type || '—'}</strong>
                            </div>
                        </div>

                        {order.notes ? <p className="muted"><strong>Notes:</strong> {order.notes}</p> : null}

                        <div className="status-action-row">
                            {statusActions.map((action) => {
                                const isActive = (order.status || 'pending') === action.status
                                    && (!action.payment_status || (order.payment_status || 'pending') === action.payment_status);

                                return (
                                    <button
                                        key={`${order.id}-${action.label}`}
                                        type="button"
                                        className={`status-action-button${isActive ? ' active' : ''}`}
                                        disabled={updatingOrderId === order.id}
                                        onClick={() => updateOrderStatus(order.id, {
                                            status: action.status,
                                            payment_status: action.payment_status || order.payment_status
                                        })}
                                    >
                                        {updatingOrderId === order.id ? 'Updating...' : action.label}
                                    </button>
                                );
                            })}
                        </div>

                        <h4>Items</h4>
                        {Array.isArray(order.items) && order.items.length ? (
                            <ul className="detail-list">
                                {order.items.map((item) => (
                                    <li key={item.id || `${order.id}-${item.product_id}`}>
                                        <strong>{item.product_name_snapshot || 'Unnamed item'}</strong>
                                        <span>
                                            {item.measured_quantity ?? item.quantity ?? 1}
                                            {item.unit ? ` ${item.unit}` : ''} · {item.price_type || 'fixed'} · {formatMoney(item.line_total ?? item.price)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="empty-state">No order items recorded.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Orders;
