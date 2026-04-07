import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

const initialFormState = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    dropoffDate: '',
    dropoffTime: '',
    pickupDate: '',
    pickupTime: '',
    soapType: 'Tide Regular',
    hasHeavyItems: false,
    heavyItemsCount: 0,
    specialInstructions: ''
};

const statusActions = [
    { label: 'Scheduled', status: 'scheduled' },
    { label: 'In Progress', status: 'in-progress' },
    { label: 'Completed', status: 'completed' },
    { label: 'Cancelled', status: 'cancelled' }
];

const formatStatusLabel = (status = 'scheduled') => String(status)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateTime = (date, time) => {
    if (date && time) {
        return `${date} at ${time}`;
    }

    return date || time || '—';
};

const formatCreatedAt = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

function Bookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creatingBooking, setCreatingBooking] = useState(false);
    const [updatingBookingId, setUpdatingBookingId] = useState(null);
    const [bookingForm, setBookingForm] = useState(initialFormState);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadBookings = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await API.get('/api/admin/aflaundry/appointments');
            setBookings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error loading A&F Laundry bookings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const updateBooking = async (bookingId, payload, successMessage) => {
        setUpdatingBookingId(bookingId);
        setError('');
        setMessage('');

        try {
            const res = await API.patch(`/api/admin/aflaundry/appointments/${bookingId}`, payload);
            setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, ...res.data } : booking)));
            setMessage(successMessage || `Booking updated to ${formatStatusLabel(res.data.status)}.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating booking.');
        } finally {
            setUpdatingBookingId(null);
        }
    };

    const handleFormChange = (event) => {
        const { name, type, value, checked } = event.target;

        setBookingForm((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'hasHeavyItems' && !checked ? { heavyItemsCount: 0 } : {})
        }));
    };

    const handleCreateBooking = async (event) => {
        event.preventDefault();
        setCreatingBooking(true);
        setError('');
        setMessage('');

        try {
            const payload = {
                ...bookingForm,
                heavyItemsCount: bookingForm.hasHeavyItems ? Number(bookingForm.heavyItemsCount || 0) : 0,
                pickupDate: bookingForm.pickupDate || null,
                pickupTime: bookingForm.pickupTime || null,
                specialInstructions: bookingForm.specialInstructions || ''
            };

            const res = await API.post('/api/admin/aflaundry/appointments', payload);
            setBookings((current) => [res.data, ...current]);
            setBookingForm(initialFormState);
            setMessage(`Booking created for ${res.data.customerName}.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error creating booking.');
        } finally {
            setCreatingBooking(false);
        }
    };

    const handleSchedulePickup = (booking) => {
        if (typeof window === 'undefined') {
            return;
        }

        const pickupDate = window.prompt('Enter the pickup date (YYYY-MM-DD).', booking.pickupDate || '');
        if (pickupDate === null) {
            return;
        }

        const pickupTime = window.prompt('Enter the pickup time (HH:MM).', booking.pickupTime || '');
        if (pickupTime === null) {
            return;
        }

        const specialInstructions = window.prompt(
            'Update special instructions if needed.',
            booking.specialInstructions || ''
        );

        if (specialInstructions === null) {
            return;
        }

        updateBooking(
            booking.id,
            {
                pickupDate: pickupDate || null,
                pickupTime: pickupTime || null,
                specialInstructions,
                status: booking.status === 'cancelled' ? 'scheduled' : booking.status
            },
            `Pickup updated for ${booking.customerName}.`
        );
    };

    const stats = useMemo(() => ({
        totalBookings: bookings.length,
        scheduled: bookings.filter((booking) => booking.status === 'scheduled').length,
        inProgress: bookings.filter((booking) => booking.status === 'in-progress').length,
        completed: bookings.filter((booking) => booking.status === 'completed').length,
        cancelled: bookings.filter((booking) => booking.status === 'cancelled').length
    }), [bookings]);

    return (
        <div className="page-section">
            <div className="page-header section-actions">
                <div>
                    <h1>Laundry Bookings</h1>
                    <p className="muted">View live A&F Laundry appointments, take bookings from the admin desk, and update job status.</p>
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
                    <span className="muted">In Progress</span>
                    <strong>{stats.inProgress}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Completed</span>
                    <strong>{stats.completed}</strong>
                </div>
                <div className="stat-card">
                    <span className="muted">Cancelled</span>
                    <strong>{stats.cancelled}</strong>
                </div>
            </div>

            <div className="record-card" style={{ marginBottom: '16px' }}>
                <div className="page-header" style={{ marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ marginBottom: '4px' }}>Take a booking</h3>
                        <p className="muted" style={{ margin: 0 }}>Create a new customer appointment directly from the admin dashboard.</p>
                    </div>
                </div>

                <form className="edit-form" onSubmit={handleCreateBooking}>
                    <div className="details-grid">
                        <div>
                            <span className="muted">Customer name</span>
                            <input name="customerName" value={bookingForm.customerName} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <span className="muted">Phone</span>
                            <input name="customerPhone" value={bookingForm.customerPhone} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <span className="muted">Email</span>
                            <input type="email" name="customerEmail" value={bookingForm.customerEmail} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <span className="muted">Dropoff date</span>
                            <input type="date" name="dropoffDate" value={bookingForm.dropoffDate} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <span className="muted">Dropoff time</span>
                            <input type="time" name="dropoffTime" value={bookingForm.dropoffTime} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <span className="muted">Pickup date</span>
                            <input type="date" name="pickupDate" value={bookingForm.pickupDate} onChange={handleFormChange} />
                        </div>
                        <div>
                            <span className="muted">Pickup time</span>
                            <input type="time" name="pickupTime" value={bookingForm.pickupTime} onChange={handleFormChange} />
                        </div>
                        <div>
                            <span className="muted">Soap type</span>
                            <input name="soapType" value={bookingForm.soapType} onChange={handleFormChange} required />
                        </div>
                        <div>
                            <span className="muted">Heavy items count</span>
                            <input type="number" min="0" name="heavyItemsCount" value={bookingForm.heavyItemsCount} onChange={handleFormChange} disabled={!bookingForm.hasHeavyItems} />
                        </div>
                    </div>

                    <label className="muted" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="checkbox" name="hasHeavyItems" checked={bookingForm.hasHeavyItems} onChange={handleFormChange} />
                        Includes heavy items
                    </label>

                    <input
                        name="specialInstructions"
                        value={bookingForm.specialInstructions}
                        onChange={handleFormChange}
                        placeholder="Special instructions, stain notes, gate code, or pickup info"
                    />

                    <button type="submit" className="edit-button" disabled={creatingBooking}>
                        {creatingBooking ? 'Saving booking...' : 'Create Booking'}
                    </button>
                </form>
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
            {loading ? <p className="empty-state">Loading bookings...</p> : null}

            {!loading && !bookings.length ? (
                <p className="empty-state">No A&F Laundry bookings found yet.</p>
            ) : null}

            <div className="record-list">
                {bookings.map((booking) => (
                    <div key={booking.id} className="record-card">
                        <div className="record-header">
                            <div>
                                <h3>{booking.customerName || 'Laundry booking'}</h3>
                                <p className="muted">Booking ID: {booking.id}</p>
                            </div>
                            <div className="record-meta">
                                <span className={`status-badge status-${String(booking.status || 'scheduled').toLowerCase().replace(/[\s_]+/g, '-')}`}>
                                    {formatStatusLabel(booking.status)}
                                </span>
                                <span className="meta-badge">A & F Laundry</span>
                            </div>
                        </div>

                        <div className="details-grid">
                            <div>
                                <span className="muted">Dropoff</span>
                                <strong>{formatDateTime(booking.dropoffDate, booking.dropoffTime)}</strong>
                            </div>
                            <div>
                                <span className="muted">Pickup</span>
                                <strong>{formatDateTime(booking.pickupDate, booking.pickupTime)}</strong>
                            </div>
                            <div>
                                <span className="muted">Phone</span>
                                <strong>{booking.customerPhone || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Email</span>
                                <strong>{booking.customerEmail || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Soap</span>
                                <strong>{booking.soapType || '—'}</strong>
                            </div>
                            <div>
                                <span className="muted">Heavy items</span>
                                <strong>{booking.hasHeavyItems ? `${booking.heavyItemsCount || 0} item(s)` : 'No'}</strong>
                            </div>
                            <div>
                                <span className="muted">Created</span>
                                <strong>{formatCreatedAt(booking.createdAt)}</strong>
                            </div>
                        </div>

                        <div className="quote-action-grid">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={updatingBookingId === booking.id}
                                onClick={() => handleSchedulePickup(booking)}
                            >
                                {updatingBookingId === booking.id ? 'Updating...' : 'Edit Pickup'}
                            </button>
                        </div>

                        <div className="status-action-row">
                            {statusActions.map((action) => {
                                const isActive = (booking.status || 'scheduled') === action.status;

                                return (
                                    <button
                                        key={`${booking.id}-${action.label}`}
                                        type="button"
                                        className={`status-action-button${isActive ? ' active' : ''}`}
                                        disabled={updatingBookingId === booking.id}
                                        onClick={() => updateBooking(booking.id, { status: action.status }, `Booking moved to ${action.label}.`)}
                                    >
                                        {updatingBookingId === booking.id ? 'Updating...' : action.label}
                                    </button>
                                );
                            })}
                        </div>

                        {booking.specialInstructions ? (
                            <p className="muted"><strong>Special Instructions:</strong> {booking.specialInstructions}</p>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Bookings;
