import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const managementLinks = [
    {
        to: '/adrian-store',
        label: 'Adrian Store workspace',
        description: 'Open Adrian content and product controls.',
        state: { adrianTab: 'content' },
    },
    {
        to: '/adrian-store',
        label: 'Adrian orders',
        description: 'Review paid Adrian Store checkouts.',
        state: { adrianTab: 'orders' },
    },
    {
        to: '/adrian-store',
        label: 'Adrian support',
        description: 'Manage Adrian customer support requests.',
        state: { adrianTab: 'support' },
    },
    {
        to: '/products',
        label: 'Products & services',
        description: 'Manage the shared Felix catalog.',
    },
    {
        to: '/quote-requests',
        label: 'Quote requests',
        description: 'Review quote-first customer requests.',
    },
    {
        to: '/bookings',
        label: 'Laundry bookings',
        description: 'Manage A&F Laundry pickups and drivers.',
    },
];

function Dashboard() {
    const [formatterSummary, setFormatterSummary] = useState(null);
    const [adrianSummary, setAdrianSummary] = useState({
        products: 0,
        orders: 0,
        support: 0,
    });

    useEffect(() => {
        Promise.all([
            API.get('/api/admin/overview').catch(() => ({ data: {} })),
            API.get('/products', {
                params: { app_name: 'Adrian Store', storefront_key: 'adrian-store' },
            }).catch(() => ({ data: [] })),
            API.get('/orders', {
                params: { app_name: 'Adrian Store', storefront_key: 'adrian-store' },
            }).catch(() => ({ data: [] })),
            API.get('/support-requests', {
                params: { app_name: 'Adrian Store', storefront_key: 'adrian-store' },
            }).catch(() => ({ data: [] })),
        ])
            .then(([overviewRes, productsRes, ordersRes, supportRes]) => {
                setFormatterSummary(overviewRes.data?.summary || null);
                setAdrianSummary({
                    products: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
                    orders: Array.isArray(ordersRes.data) ? ordersRes.data.length : 0,
                    support: Array.isArray(supportRes.data) ? supportRes.data.length : 0,
                });
            })
            .catch((error) => {
                console.error('Unable to load dashboard summary:', error);
            });
    }, []);

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>Admin Dashboard</h1>
                <p className="muted">
                    Manage Felix Store, Adrian Store, A&F Laundry, Document Formatter, orders, bookings, users, and more.
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <strong>Backend API</strong>
                    <span>{import.meta.env.VITE_API_URL || 'https://felix-platform-backend.onrender.com'}</span>
                </div>
                <div className="stat-card">
                    <strong>Adrian products</strong>
                    <span>{adrianSummary.products} items in the Adrian catalog</span>
                </div>
                <div className="stat-card">
                    <strong>Adrian orders</strong>
                    <span>{adrianSummary.orders} checkout orders recorded</span>
                </div>
                <div className="stat-card">
                    <strong>Adrian support</strong>
                    <span>{adrianSummary.support} support requests to manage</span>
                </div>
                <div className="stat-card">
                    <strong>Document Formatter jobs</strong>
                    <span>{formatterSummary?.total_jobs ?? 0} total exports logged</span>
                </div>
            </div>

            <div className="list-card">
                <div className="record-header">
                    <div>
                        <h3>Quick access</h3>
                        <p className="muted">Use these shortcuts to jump directly into the Adrian Store workspace from the main admin dashboard.</p>
                    </div>
                    <Link to="/adrian-store" state={{ adrianTab: 'content' }} className="edit-button preview-link">
                        Open Adrian Store
                    </Link>
                </div>

                <div className="dashboard-link-grid">
                    {managementLinks.map((item) => (
                        <Link key={`${item.to}-${item.label}`} to={item.to} state={item.state} className="management-link">
                            <strong>{item.label}</strong>
                            <span>{item.description}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
