import { NavLink, useLocation } from 'react-router-dom';

const links = [
    { to: '/dashboard', label: 'Dashboard' },
    {
        to: '/waci',
        label: 'WACI',
        children: [
            { hash: '#overview', label: 'Overview' },
            { hash: '#programs', label: 'Programs' },
            { hash: '#stories', label: 'Stories' },
            { hash: '#resources', label: 'Resources' },
            { hash: '#newsletter-subscribers', label: 'Newsletter Subscribers' },
            { hash: '#volunteers', label: 'Volunteers' },
            { hash: '#partner-requests', label: 'Partner Requests' },
            { hash: '#donors-sponsors', label: 'Donors/Sponsors' },
        ],
    },
    { to: '/adrian-store', label: 'Adrian Store' },
    { to: '/document-formatter', label: 'Document Formatter' },
    { to: '/quote-requests', label: 'Quote Requests' },
    { to: '/platform-content', label: 'Platform Content' },
    { to: '/products', label: 'Products' },
    { to: '/orders', label: 'Orders' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/categories', label: 'Categories' },
    { to: '/users', label: 'Users' },
];

function Sidebar() {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>Felix Admin</h1>
                <p>Control your platform</p>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => (
                    <div key={link.to} className="sidebar-group">
                        <NavLink
                            to={link.to}
                            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                        >
                            {link.label}
                        </NavLink>

                        {link.children?.length ? (
                            <div className="sidebar-subnav">
                                {link.children.map((child) => {
                                    const isActive = location.pathname === link.to && location.hash === child.hash;

                                    return (
                                        <NavLink
                                            key={`${link.to}${child.hash}`}
                                            to={`${link.to}${child.hash}`}
                                            className={() => `sidebar-sublink${isActive ? ' active' : ''}`}
                                        >
                                            {child.label}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
