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
        { label: 'Scheduled', status: 'scheduled' },
        { label: 'Pickup Scheduled', status: 'pickup_scheduled' },
        { label: 'Picked Up', status: 'picked_up' },
        { label: 'In Progress', status: 'in_progress' },
        { label: 'Out for Delivery', status: 'out_for_delivery' },
        { label: 'Delivered', status: 'delivered' },
        { label: 'Completed', status: 'completed' },
        { label: 'Cancelled', status: 'cancelled' }
    ];

    const loadBookings = async () => {
        setLoading(true);
        setError('');

        try {
            const [bookingsRes, productsRes] = await Promise.all([
                API.get('/bookings'),
                API.get('/products')
            ]);

            setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
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
            const res = await API.patch(`/bookings/${bookingId}/status`, payload);
            setBookings((current) => current.map((booking) => (booking.id === bookingId ? res.data : booking)));
            setMessage(`Booking updated to ${res.data.status}.`);
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
        const scheduled = bookings.filter((booking) => booking.status === 'scheduled').length;
        const completed = bookings.filter((booking) => booking.status === 'completed').length;
        const estimatedWeight = bookings.reduce((sum, booking) => sum + Number(booking.weight_estimate || 0), 0);

        return {
            totalBookings: bookings.length,
            scheduled,
            completed,
            estimatedWeight
        };
    }, [bookings]);

    return (
        <div className="page-section">
            <div className="page-header section-actions">
                <div>
                    <h1>Laundry Bookings</h1>
                    <p className="muted">View pickup, delivery, scheduling, and contact details from `/bookings`.</p>
                </div>
                <button type="button" className="edit-button refresh-button" onClick={loadBookings}>
                    Refresh Bookings
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="muted">Total Bookings</span>
                    <strong>{stats.totalBookings}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Scheduled</span>
                    <strong>{stats.scheduled}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Completed</span>
                    <strong>{stats.completed}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Estimated Weight</span>
                    <strong>{stats.estimatedWeight} lbs</strong>
                </div>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
            {loading ? <p className="empty-state">Loading bookings...</p> : null}

            {!loading && !bookings.length ? (
                <p className="empty-state">No bookings found yet.</p>
            ) : null}

            <div className="record-list">
                {bookings.map((booking) => (
                    <div key={booking.id} className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>{getProductName(booking.product_id)}</h3>
                                <p className="muted">Booking ID: {booking.id}</p>
                            </div>
                            <div className="record-meta">
                                <span className={`status-badge status-${String(booking.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                    {booking.status || 'pending'}
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
                                <span className="muted">Driver</span>
                                <strong>{booking.assigned_driver || 'Unassigned'}</strong>
                            </div>
                            <div>
                                <span className="muted">Contact</span>
                                <strong>{booking.contact_name || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Phone</span>
                                <strong>{booking.contact_phone || '—'}</strong>
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
                                        onClick={() => updateBookingStatus(booking.id, { status: action.status })}
                                    >
                                        {updatingBookingId === booking.id ? 'Updating...' : action.label}
                                    </button>
                                );
                            })}
                        </div>

                        {booking.pickup_address ? <p className="muted"><strong>Pickup:</strong> {booking.pickup_address}</p> : null}
                        {booking.delivery_address ? <p className="muted"><strong>Delivery:</strong> {booking.delivery_address}</p> : null}
                        {booking.special_instructions ? <p className="muted"><strong>Instructions:</strong> {booking.special_instructions}</p> : null}
                        {booking.notes ? <p className="muted"><strong>Notes:</strong> {booking.notes}</p> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Bookings;
