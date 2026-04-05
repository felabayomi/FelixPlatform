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
        { label: 'Pending', status: 'pending' },
        { label: 'Reviewing', status: 'reviewing' },
        { label: 'Quote Sent', status: 'quoted' },
        { label: 'Accepted', status: 'accepted' },
        { label: 'Payment Arranged', status: 'payment_arranged' },
        { label: 'Processing', status: 'processing' },
        { label: 'Completed', status: 'completed' },
        { label: 'Cancelled', status: 'cancelled' }
    ];

    const buildActionPayload = (order, action) => {
        const requiresQuoteDetails = ['reviewing', 'quoted', 'accepted', 'payment_arranged'].includes(action.status);

        if (!requiresQuoteDetails || typeof window === 'undefined') {
            return {
                status: action.status,
                quoted_price: order.quoted_price ?? null,
                admin_notes: order.admin_notes || ''
            };
        }

        const quotedPriceInput = window.prompt(
            'Enter the quoted price for this request (leave blank to keep current value).',
            order.quoted_price ?? ''
        );

        if (quotedPriceInput === null) {
            return null;
        }

        const adminNotesInput = window.prompt(
            'Add admin notes for this request (optional).',
            order.admin_notes || ''
        );

        if (adminNotesInput === null) {
            return null;
        }

        return {
            status: action.status,
            quoted_price: quotedPriceInput,
            admin_notes: adminNotesInput
        };
    };

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await API.get('/quote-requests');
            const allRequests = Array.isArray(res.data) ? res.data : [];
            setOrders(allRequests.filter((order) => order.app_name !== 'A & F Laundry'));
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
            const res = await API.patch(`/quote-requests/${orderId}`, {
                status: payload.status,
                admin_notes: payload.admin_notes,
                quoted_price: payload.quoted_price,
            });
            setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...res.data } : order)));
            setMessage(`Quote request updated to ${res.data.status}.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating order status.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const stats = useMemo(() => {
        const referenceValue = orders.reduce((sum, order) => {
            return sum + Number(order.quoted_price ?? 0);
        }, 0);

        return {
            totalOrders: orders.length,
            quoteRequested: orders.filter((order) => ['pending', 'reviewing'].includes(order.status)).length,
            quoteSent: orders.filter((order) => ['quoted', 'accepted', 'payment_arranged'].includes(order.status)).length,
            referenceValue: formatMoney(referenceValue)
        };
    }, [orders]);

    return (
        <div className="page-section">
            <div className="page-header section-actions">
                <div>
                    <h1>Felix Store Quotes</h1>
                    <p className="muted">Review store quote requests, add pricing, and move approved jobs toward fulfillment.</p>
                </div>
                <button type="button" className="edit-button refresh-button" onClick={loadOrders}>
                    Refresh Quotes
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="muted">Total Orders</span>
                    <strong>{stats.totalOrders}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Quote Requested</span>
                    <strong>{stats.quoteRequested}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Quote Sent / Awaiting Approval</span>
                    <strong>{stats.quoteSent}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Reference Value</span>
                    <strong>{stats.referenceValue}</strong>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
            {loading ? <p className="empty-state">Loading orders...</p> : null}

            {!loading && !orders.length ? (
                <p className="empty-state">No store quote requests found yet.</p>
            ) : null}

            <div className="record-list">
                {orders.map((order) => (
                    <div key={order.id} className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>{order.product_name || 'Store request'}</h3>
                                <p className="muted">Request ID: {order.id}</p>
                            </div>
                            <div className="record-meta">
                                <span className={`status-badge status-${String(order.status || 'pending').toLowerCase().replace(/[\s_]+/g, '-')}`}>
                                    {String(order.status || 'pending').replace(/_/g, ' ')}
                                </span>
                                <span className="meta-badge">{order.app_name || 'Felix Store'}</span>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div>
                                <span className="muted">Quoted Price</span>
                                <strong>{formatMoney(order.quoted_price)}</strong>
                            </div>
                            <div>
                                <span className="muted">Requested Quantity</span>
                                <strong>{order.quantity || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Requester</span>
                                <strong>{order.contact_name || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Phone</span>
                                <strong>{order.contact_phone || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Email</span>
                                <strong>{order.contact_email || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Created</span>
                                <strong>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Fulfillment</span>
                                <strong>{order.preferred_fulfillment || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Admin Notes</span>
                                <strong>{order.admin_notes || '—'}</strong>
                            </div>
                        </div>

                        {order.details ? <p className="muted"><strong>Request Details:</strong> {order.details}</p> : null}

                        <div className="status-action-row">
                            {statusActions.map((action) => {
                                const isActive = (order.status || 'pending') === action.status;

                                return (
                                    <button
                                        key={`${order.id}-${action.label}`}
                                        type="button"
                                        className={`status-action-button${isActive ? ' active' : ''}`}
                                        disabled={updatingOrderId === order.id}
                                        onClick={() => {
                                            const payload = buildActionPayload(order, action);
                                            if (payload) {
                                                updateOrderStatus(order.id, payload);
                                            }
                                        }}
                                    >
                                        {updatingOrderId === order.id ? 'Updating...' : action.label}
                                    </button>
                                );
                            })}
                        </div>

                        <h4>Quote Summary</h4>
                        <p className="muted">Use the status buttons above to review, quote, approve, or close this request.</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Orders;
