import { useLocation } from 'react-router-dom';

const pageTitles = {
    '/dashboard': 'Overview',
    '/products': 'Products',
    '/quote-requests': 'Quote Requests',
    '/orders': 'Orders',
    '/bookings': 'Bookings',
    '/categories': 'Categories',
    '/users': 'Users',
    '/login': 'Login',
};

function Navbar({ user, onLogout }) {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Admin Dashboard';

    return (
        <header className="navbar">
            <div>
                <p className="navbar-label">Felix Platform Admin</p>
                <h2>{title}</h2>
            </div>
            <div className="navbar-actions">
                <span className="status-pill">{user?.email || 'Backend Connected'}</span>
                {user ? (
                    <button type="button" className="logout-button" onClick={onLogout}>
                        Logout
                    </button>
                ) : null}
            </div>
        </header>
    );
}

export default Navbar;
