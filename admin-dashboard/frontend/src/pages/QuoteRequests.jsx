import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';

const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'reviewing', label: 'Reviewing' },
    { key: 'quoted', label: 'Quoted' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'completed', label: 'Completed' },
];

const quickStatuses = [
    { label: 'Pending', status: 'pending' },
    { label: 'Reviewing', status: 'reviewing' },
    { label: 'Quoted', status: 'quoted' },
    { label: 'Accepted', status: 'accepted' },
    { label: 'Completed', status: 'completed' },
];

const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const number = Number(value);
    return Number.isNaN(number) ? '—' : `$${number.toFixed(2)}`;
};

const formatStatusLabel = (value) => {
    if (!value) {
        return 'Pending';
    }

    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const matchesStatusFilter = (quote, filterKey) => {
    const status = String(quote?.status || 'pending').toLowerCase();

    switch (filterKey) {
        case 'pending':
            return ['pending'].includes(status);
        case 'reviewing':
            return ['reviewing'].includes(status);
        case 'quoted':
            return ['quoted'].includes(status);
        case 'accepted':
            return ['accepted', 'payment_arranged', 'processing', 'pickup_scheduled', 'picked_up', 'in_progress', 'out_for_delivery'].includes(status);
        case 'completed':
            return ['completed', 'delivered'].includes(status);
        case 'all':
        default:
            return true;
    }
};

const parseRequestedItems = (details) =>
    String(details || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace(/^-\s*/, ''));

const appendAuditNote = (notes, line) => [String(notes || '').trim(), line].filter(Boolean).join('\n');

function QuoteRequests() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [expandedQuoteId, setExpandedQuoteId] = useState(null);
    const [updatingQuoteId, setUpdatingQuoteId] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadQuotes = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await API.get('/quote-requests');
            const data = Array.isArray(res.data) ? res.data : [];
            setQuotes(data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error loading quote requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuotes();
    }, []);

    const filteredQuotes = useMemo(
        () => quotes.filter((quote) => matchesStatusFilter(quote, statusFilter)),
        [quotes, statusFilter],
    );

    const stats = useMemo(() => ({
        total: quotes.length,
        pending: quotes.filter((quote) => matchesStatusFilter(quote, 'pending')).length,
        reviewing: quotes.filter((quote) => matchesStatusFilter(quote, 'reviewing')).length,
        quoted: quotes.filter((quote) => matchesStatusFilter(quote, 'quoted')).length,
        accepted: quotes.filter((quote) => matchesStatusFilter(quote, 'accepted')).length,
        completed: quotes.filter((quote) => matchesStatusFilter(quote, 'completed')).length,
    }), [quotes]);

    const updateQuote = async (quote, payload, successMessage) => {
        setUpdatingQuoteId(quote.id);
        setMessage('');
        setError('');

        try {
            const res = await API.patch(`/quote-requests/${quote.id}`, payload);
            setQuotes((current) => current.map((item) => (item.id === quote.id ? { ...item, ...res.data } : item)));
            setMessage(successMessage || `Quote request updated to ${formatStatusLabel(res.data.status)}.`);
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Error updating quote request.');
        } finally {
            setUpdatingQuoteId(null);
        }
    };

    const handleSetPrice = (quote) => {
        if (typeof window === 'undefined') {
            return;
        }

        const quotedPriceInput = window.prompt(
            'Enter the quote price for this request.',
            quote.quoted_price ?? '',
        );

        if (quotedPriceInput === null) {
            return;
        }

        const adminNotesInput = window.prompt(
            'Add or update quote notes for this request.',
            quote.admin_notes || '',
        );

        if (adminNotesInput === null) {
            return;
        }

        updateQuote(
            quote,
            {
                status: quote.status === 'pending' ? 'reviewing' : (quote.status || 'reviewing'),
                quoted_price: quotedPriceInput,
                admin_notes: adminNotesInput,
            },
            `Quote price saved for ${quote.product_name || 'request'}.`,
        );
    };

    const handleApprove = (quote) => {
        updateQuote(
            quote,
            {
                status: 'accepted',
                quoted_price: quote.quoted_price ?? null,
                admin_notes: quote.admin_notes || '',
            },
            `Quote ${quote.id} approved.`,
        );
    };

    const handleConvertToOrder = (quote) => {
        updateQuote(
            quote,
            {
                status: 'processing',
                quoted_price: quote.quoted_price ?? null,
                admin_notes: appendAuditNote(
                    quote.admin_notes,
                    `Converted to order workflow on ${new Date().toLocaleString()}`,
                ),
            },
            `Quote ${quote.id} moved into order processing.`,
        );
    };

    const handleAssignPickup = (quote) => {
        if (typeof window === 'undefined') {
            return;
        }

        const pickupSchedule = window.prompt(
            'Enter the pickup schedule or arrangement details.',
            quote.pickup_schedule || quote.service_window || '',
        );

        if (pickupSchedule === null) {
            return;
        }

        const adminNotesInput = window.prompt(
            'Add pickup notes (optional).',
            quote.admin_notes || '',
        );

        if (adminNotesInput === null) {
            return;
        }

        updateQuote(
            quote,
            {
                status: 'pickup_scheduled',
                quoted_price: quote.quoted_price ?? null,
                admin_notes: adminNotesInput,
                pickup_schedule: pickupSchedule,
            },
            `Pickup scheduled for ${quote.product_name || 'laundry request'}.`,
        );
    };

    const handleAssignDriver = (quote) => {
        if (typeof window === 'undefined') {
            return;
        }

        const assignedDriver = window.prompt(
            'Enter the driver name or contact.',
            quote.assigned_driver || '',
        );

        if (assignedDriver === null) {
            return;
        }

        const adminNotesInput = window.prompt(
            'Add or update delivery notes (optional).',
            quote.admin_notes || '',
        );

        if (adminNotesInput === null) {
            return;
        }

        updateQuote(
            quote,
            {
                status: quote.status || 'pickup_scheduled',
                quoted_price: quote.quoted_price ?? null,
                admin_notes: adminNotesInput,
                assigned_driver: assignedDriver,
            },
            `Driver assigned for ${quote.product_name || 'laundry request'}.`,
        );
    };

    return (
        <div className="page-section">
            <div className="page-header section-actions">
                <div>
                    <h1>Quote Requests</h1>
                    <p className="muted">Review pending quotes, set prices, approve requests, convert store quotes to orders, and assign laundry pickup and drivers.</p>
                </div>
                <button type="button" className="edit-button refresh-button" onClick={loadQuotes}>
                    Refresh Quotes
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><span className="muted">All</span><strong>{stats.total}</strong></div>
                <div className="stat-card"><span className="muted">Pending</span><strong>{stats.pending}</strong></div>
                <div className="stat-card"><span className="muted">Reviewing</span><strong>{stats.reviewing}</strong></div>
                <div className="stat-card"><span className="muted">Quoted</span><strong>{stats.quoted}</strong></div>
                <div className="stat-card"><span className="muted">Accepted</span><strong>{stats.accepted}</strong></div>
                <div className="stat-card"><span className="muted">Completed</span><strong>{stats.completed}</strong></div>
            </div>

            <div className="filter-chip-row">
                {statusFilters.map((filter) => {
                    const isActive = statusFilter === filter.key;
                    return (
                        <button
                            key={filter.key}
                            type="button"
                            className={`filter-chip${isActive ? ' active' : ''}`}
                            onClick={() => setStatusFilter(filter.key)}
                        >
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {message ? <p className="message-success">{message}</p> : null}
            {error ? <p className="message-error">{error}</p> : null}
            {loading ? <p className="empty-state">Loading quote requests...</p> : null}
            {!loading && !filteredQuotes.length ? <p className="empty-state">No quote requests match this status yet.</p> : null}

            <div className="record-list">
                {filteredQuotes.map((quote) => {
                    const items = parseRequestedItems(quote.details);
                    const isLaundry = quote.app_name === 'A & F Laundry';
                    const isExpanded = expandedQuoteId === quote.id;

                    return (
                        <div key={quote.id} className="record-card">
                            <div className="record-header">
                                <div>
                                    <h3>{quote.product_name || 'Quote request'}</h3>
                                    <p className="muted">Request ID: {quote.id}</p>
                                </div>
                                <div className="record-meta">
                                    <span className={`status-badge status-${String(quote.status || 'pending').toLowerCase().replace(/[\s_]+/g, '-')}`}>
                                        {formatStatusLabel(quote.status)}
                                    </span>
                                    <span className="meta-badge">{quote.app_name || 'Felix Platform'}</span>
                                </div>
                            </div>

                            <div className="details-grid">
                                <div><span className="muted">Quoted Price</span><strong>{formatMoney(quote.quoted_price)}</strong></div>
                                <div><span className="muted">Quantity</span><strong>{quote.quantity || '—'}</strong></div>
                                <div><span className="muted">Requester</span><strong>{quote.contact_name || '—'}</strong></div>
                                <div><span className="muted">Phone</span><strong>{quote.contact_phone || '—'}</strong></div>
                                <div><span className="muted">Email</span><strong>{quote.contact_email || '—'}</strong></div>
                                <div><span className="muted">Created</span><strong>{quote.created_at ? new Date(quote.created_at).toLocaleString() : '—'}</strong></div>
                                <div><span className="muted">Fulfillment</span><strong>{quote.preferred_fulfillment || quote.service_window || '—'}</strong></div>
                                <div><span className="muted">Assigned Driver</span><strong>{quote.assigned_driver || '—'}</strong></div>
                            </div>

                            <div className="quote-action-grid">
                                <button
                                    type="button"
                                    className="edit-button"
                                    onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                                >
                                    {isExpanded ? 'Hide Quote' : 'Open Quote'}
                                </button>
                                <button type="button" className="secondary-button" onClick={() => handleSetPrice(quote)} disabled={updatingQuoteId === quote.id}>
                                    Set Price
                                </button>
                                <button type="button" className="edit-button" onClick={() => handleApprove(quote)} disabled={updatingQuoteId === quote.id}>
                                    Approve
                                </button>
                                {!isLaundry ? (
                                    <button type="button" className="secondary-button" onClick={() => handleConvertToOrder(quote)} disabled={updatingQuoteId === quote.id}>
                                        Convert to Order
                                    </button>
                                ) : null}
                                {isLaundry ? (
                                    <button type="button" className="secondary-button" onClick={() => handleAssignPickup(quote)} disabled={updatingQuoteId === quote.id}>
                                        Assign Laundry Pickup
                                    </button>
                                ) : null}
                                {isLaundry ? (
                                    <button type="button" className="secondary-button" onClick={() => handleAssignDriver(quote)} disabled={updatingQuoteId === quote.id}>
                                        Assign Driver
                                    </button>
                                ) : null}
                            </div>

                            <div className="status-action-row">
                                {quickStatuses.map((action) => {
                                    const isActive = (quote.status || 'pending') === action.status;

                                    return (
                                        <button
                                            key={`${quote.id}-${action.status}`}
                                            type="button"
                                            className={`status-action-button${isActive ? ' active' : ''}`}
                                            disabled={updatingQuoteId === quote.id}
                                            onClick={() => updateQuote(quote, {
                                                status: action.status,
                                                quoted_price: quote.quoted_price ?? null,
                                                admin_notes: quote.admin_notes || '',
                                            })}
                                        >
                                            {updatingQuoteId === quote.id ? 'Updating...' : action.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {isExpanded ? (
                                <div className="quote-detail-panel">
                                    <div>
                                        <h4>Items</h4>
                                        {items.length ? (
                                            <ul className="quote-items-list">
                                                {items.map((item) => <li key={`${quote.id}-${item}`}>{item}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="muted">No separate item list was provided for this request.</p>
                                        )}
                                    </div>

                                    <div>
                                        <h4>Request Notes</h4>
                                        <p className="muted quote-text-block">{quote.details || '—'}</p>
                                    </div>

                                    <div>
                                        <h4>Admin Notes</h4>
                                        <p className="muted quote-text-block">{quote.admin_notes || '—'}</p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default QuoteRequests;
