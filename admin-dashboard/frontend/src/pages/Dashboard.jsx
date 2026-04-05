import { useEffect, useState } from 'react';
import API from '../services/api';

const sections = [
    'Products & services',
    'Document Formatter analytics',
    'Orders',
    'Laundry bookings',
    'Categories',
    'Users',
    'Subscriptions',
];

function Dashboard() {
    const [formatterSummary, setFormatterSummary] = useState(null);

    useEffect(() => {
        API.get('/api/admin/overview')
            .then((res) => setFormatterSummary(res.data.summary || null))
            .catch((error) => {
                console.error('Unable to load formatter summary for dashboard:', error);
            });
    }, []);

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>Admin Dashboard</h1>
                <p className="muted">
                    Manage Felix Store, A&F Laundry, Document Formatter, orders, bookings, users, and more.
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <strong>Backend API</strong>
                    <span>{import.meta.env.VITE_API_URL || 'https://felix-platform-backend.onrender.com'}</span>
                </div>
                <div className="stat-card">
                    <strong>Document Formatter jobs</strong>
                    <span>{formatterSummary?.total_jobs ?? 0} total exports logged</span>
                </div>
                <div className="stat-card">
                    <strong>PDF exports</strong>
                    <span>{formatterSummary?.pdf_jobs ?? 0} completed downloads</span>
                </div>
                <div className="stat-card">
                    <strong>Unique formatter users</strong>
                    <span>{formatterSummary?.unique_users ?? 0} active accounts</span>
                </div>
            </div>

            <div className="list-card">
                <h3>Management Sections</h3>
                <ul className="placeholder-list">
                    {sections.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;
