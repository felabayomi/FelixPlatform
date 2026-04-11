import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const links = [
    { to: '/dashboard', label: 'Dashboard' },
    {
        to: '/wildlife-pedia',
        label: 'Wildlife-Pedia',
        children: [
            { hash: '#species', label: 'Species' },
            { hash: '#habitats', label: 'Habitats' },
            { hash: '#projects', label: 'Projects' },
            { hash: '#reports', label: 'Sightings' },
            { hash: '#volunteers', label: 'Volunteers' },
            { hash: '#donors', label: 'Donors' },
        ],
    },
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
    const [expandedGroups, setExpandedGroups] = useState(() => ({
        '/wildlife-pedia': location.pathname === '/wildlife-pedia',
        '/waci': location.pathname === '/waci',
    }));

    const toggleGroup = (groupKey) => {
        setExpandedGroups((current) => ({
            ...current,
            [groupKey]: !current[groupKey],
        }));
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>Felix Admin</h1>
                <p>Control your platform</p>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => {
                    const hasChildren = Array.isArray(link.children) && link.children.length > 0;
                    const isExpanded = hasChildren ? Boolean(expandedGroups[link.to]) : false;

                    return (
                        <div key={link.to} className="sidebar-group">
                            <div className="sidebar-link-row">
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) => `sidebar-link sidebar-link-main${isActive ? ' active' : ''}`}
                                >
                                    {link.label}
                                </NavLink>

                                {hasChildren ? (
                                    <button
                                        type="button"
                                        className={`sidebar-group-toggle${isExpanded ? ' expanded' : ''}`}
                                        onClick={() => toggleGroup(link.to)}
                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${link.label}`}
                                        aria-expanded={isExpanded}
                                    >
                                        <span>▸</span>
                                    </button>
                                ) : null}
                            </div>

                            {hasChildren && isExpanded ? (
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
                    );
                })}
            </nav>
        </aside>
    );
}

export default Sidebar;
