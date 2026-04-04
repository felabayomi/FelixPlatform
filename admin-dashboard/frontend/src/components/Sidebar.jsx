import { NavLink } from 'react-router-dom';

const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/orders', label: 'Orders' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/categories', label: 'Categories' },
    { to: '/users', label: 'Users' },
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>Felix Admin</h1>
                <p>Control your platform</p>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `sidebar-link${isActive ? ' active' : ''}`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
