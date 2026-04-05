import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingBookingId, setUpdatingBookingId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const statusActions = [
        { label: 'Pending', status: 'pending' },
        { label: 'Reviewing', status: 'reviewing' },
        { label: 'Quote Sent', status: 'quoted' },
        { label: 'Accepted', status: 'accepted' },
        { label: 'Pickup Scheduled', status: 'pickup_scheduled' },
        { label: 'Picked Up', status: 'picked_up' },
        { label: 'In Progress', status: 'in_progress' },
        { label: 'Out for Delivery', status: 'out_for_delivery' },
        { label: 'Delivered', status: 'delivered' },
        { label: 'Completed', status: 'completed' },
        { label: 'Cancelled', status: 'cancelled' }
    ];

    const buildActionPayload = (booking, action) => {
        const requiresQuoteDetails = ['reviewing', 'quoted', 'accepted', 'pickup_scheduled'].includes(action.status);

        if (!requiresQuoteDetails || typeof window === 'undefined') {
            return {
                status: action.status,
                quoted_price: booking.quoted_price ?? null,
                admin_notes: booking.admin_notes || ''
            };
        }

        const quotedPriceInput = window.prompt(
            'Enter the quoted price for this laundry request (leave blank to keep current value).',
            booking.quoted_price ?? ''
        );

        if (quotedPriceInput === null) {
            return null;
        }

        const adminNotesInput = window.prompt(
            'Add admin notes for pickup or delivery (optional).',
            booking.admin_notes || ''
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

    const loadBookings = async () => {
        setLoading(true);
        setError('');

        try {
            const [bookingsRes, productsRes] = await Promise.all([
                API.get('/quote-requests'),
                API.get('/products')
            ]);

            const allRequests = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
            setBookings(allRequests.filter((booking) => booking.app_name === 'A & F Laundry'));
            setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error loading bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const updateBookingStatus = async (bookingId, payload) => {
        setUpdatingBookingId(bookingId);
        setError('');
        setMessage('');

        try {
            const res = await API.patch(`/quote-requests/${bookingId}`, payload);
            setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, ...res.data } : booking)));
            setMessage(`Request updated to ${res.data.status}.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating booking status.');
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const getProductName = (productId) => {
        const product = products.find((item) => item.id === productId);
        return product?.name || 'Unknown service';
    };

    const stats = useMemo(() => {
        const quoteRequested = bookings.filter((booking) => ['pending', 'reviewing', 'quoted'].includes(booking.status)).length;
        const scheduled = bookings.filter((booking) => ['accepted', 'pickup_scheduled'].includes(booking.status)).length;
        const completed = bookings.filter((booking) => booking.status === 'completed').length;

        return {
            totalBookings: bookings.length,
            quoteRequested,
            scheduled,
            completed
        };
    }, [bookings]);

    return (
        <div className="page-section">
            <div className="page-header section-actions">
                <div>
                    <h1>Laundry Quote Requests</h1>
                    <p className="muted">Review incoming quote requests, approve pricing, and move accepted jobs into pickup and delivery.</p>
                </div>
                <button type="button" className="edit-button refresh-button" onClick={loadBookings}>
                    Refresh Quotes
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="muted">Total Bookings</span>
                    <strong>{stats.totalBookings}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Quote Queue</span>
                    <strong>{stats.quoteRequested}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Pickup Scheduled</span>
                    <strong>{stats.scheduled}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Completed</span>
                    <strong>{stats.completed}</strong>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
            {loading ? <p className="empty-state">Loading bookings...</p> : null}

            {!loading && !bookings.length ? (
                <p className="empty-state">No laundry quote requests found yet.</p>
            ) : null}

            <div className="record-list">
                {bookings.map((booking) => (
                    <div key={booking.id} className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>{getProductName(booking.product_id)}</h3>
                                <p className="muted">Request ID: {booking.id}</p>
                            </div>
                            <div className="record-meta">
                                <span className={`status-badge status-${String(booking.status || 'pending').toLowerCase().replace(/[\s_]+/g, '-')}`}>
                                    {String(booking.status || 'pending').replace(/_/g, ' ')}
                                </span>
                                <span className="meta-badge">{booking.app_name || 'A & F Laundry'}</span>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div>
                                <span className="muted">Service Date</span>
                                <strong>{booking.service_date || booking.booking_date || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Window</span>
                                <strong>{booking.service_window || booking.booking_time || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Weight Estimate</span>
                                <strong>{booking.weight_estimate ? `${booking.weight_estimate} lbs` : '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Quoted Price</span>
                                <strong>{booking.quoted_price ? `$${Number(booking.quoted_price).toFixed(2)}` : '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Contact</span>
                                <strong>{booking.contact_name || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Phone</span>
                                <strong>{booking.contact_phone || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Email</span>
                                <strong>{booking.contact_email || '—'}</strong>
                            </div>
                        </div>

                        <div className="status-action-row">
                            {statusActions.map((action) => {
                                const isActive = (booking.status || 'pending') === action.status;

                                return (
                                    <button
                                        key={`${booking.id}-${action.label}`}
                                        type="button"
                                        className={`status-action-button${isActive ? ' active' : ''}`}
                                        disabled={updatingBookingId === booking.id}
                                        onClick={() => {
                                            const payload = buildActionPayload(booking, action);
                                            if (payload) {
                                                updateBookingStatus(booking.id, payload);
                                            }
                                        }}
                                    >
                                        {updatingBookingId === booking.id ? 'Updating...' : action.label}
                                    </button>
                                );
                            })}
                        </div>

                        {booking.pickup_address ? <p className="muted"><strong>Pickup:</strong> {booking.pickup_address}</p> : null}
                        {booking.delivery_address ? <p className="muted"><strong>Delivery:</strong> {booking.delivery_address}</p> : null}
                        {booking.admin_notes ? <p className="muted"><strong>Admin Notes:</strong> {booking.admin_notes}</p> : null}
                        {booking.details ? <p className="muted"><strong>Request Details:</strong> {booking.details}</p> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Bookings;
