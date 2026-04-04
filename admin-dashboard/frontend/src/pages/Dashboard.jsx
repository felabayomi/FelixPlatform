const sections = [
    'Products & services',
    'Orders',
    'Laundry bookings',
    'Categories',
    'Users',
    'Subscriptions',
];

function Dashboard() {
    return (
        <div className="page-section">
            <div className="page-header">
                <h1>Admin Dashboard</h1>
                <p className="muted">
                    Manage Felix Store, A&F Laundry, orders, bookings, users, and more.
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <strong>Backend API</strong>
                    <span>Running on `localhost:5000`</span>
                </div>
                <div className="stat-card">
                    <strong>Admin Frontend</strong>
                    <span>Running on `localhost:5173`</span>
                </div>
                <div className="stat-card">
                    <strong>Database</strong>
                    <span>Neon/Postgres connected</span>
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
