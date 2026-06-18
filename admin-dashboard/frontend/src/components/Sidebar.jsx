import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import API from '../services/api';

const coreLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/quote-requests', label: 'Quote Requests' },
    { to: '/platform-content', label: 'Platform Content' },
    { to: '/products', label: 'Products' },
    { to: '/orders', label: 'Orders' },
    { to: '/bookings', label: 'Bookings' },
    { to: '/categories', label: 'Categories' },
    { to: '/users', label: 'Users' },
];

const fallbackProjectLinks = [
    { to: 'https://www.felixconsult.co/', label: 'FelixConsult', slug: 'felix-consult', publishedUrl: 'www.felixconsult.co' },
    { to: 'https://travelcenterhub.com/', label: 'Travel Center Hub', slug: 'travelcenterhub', publishedUrl: 'travelcenterhub.com' },
    { to: '/products', label: 'Felix Store', slug: 'felix-store', publishedUrl: 'storeapp.felixplatforms.com' },
    { to: '/bookings', label: 'A & F Laundry', slug: 'aflaundry', publishedUrl: 'laundryapp.felixplatforms.com' },
    {
        to: '/dailyfelix-wordofday',
        label: 'DailyFelix Word of Day',
        slug: 'dailyfelix-wordofday',
        publishedUrl: 'faithhouse.app',
    },
    {
        to: '/wildlife-pedia',
        label: 'Wildlife-Pedia',
        slug: 'wildlife-pedia',
        publishedUrl: 'wildlife-pedia.com',
    },
    {
        to: '/waci-project-hub',
        label: 'WACI Project Hub',
        slug: 'waci-project-hub',
    },
    {
        to: '/waci',
        label: 'WACI',
        slug: 'waci',
        publishedUrl: 'wildlifeafrica.org',
    },
    { to: '/adrian-store', label: 'Adrian Store', slug: 'adrian-store', publishedUrl: 'shopwithadrian.com' },
    { to: '/expedition-america', label: 'Expedition America (50USAStates)', slug: 'expedition-america', publishedUrl: 'expeditionamerica.online' },
    { to: '/expedition-america-app', label: 'Expedition America (Standalone)', slug: 'expedition-america-standalone', publishedUrl: 'expeditionamerica.us' },
    { to: '/city-tour-hub', label: 'City Tour Hub', slug: 'city-tour-hub', publishedUrl: 'tours.citydiscoverer.guide' },
    {
        to: '/citydayint-international',
        label: 'CityDayInt International',
        slug: 'citydayint-international',
        publishedUrl: 'international.citydiscoverer.guide',
    },
    {
        to: '/cityofday-daily',
        label: 'CityOfDay Daily',
        slug: 'cityofday-daily',
        publishedUrl: 'daily.citydiscoverer.guide',
    },
    { to: '/document-formatter', label: 'Document Formatter', slug: 'document-formatter', publishedUrl: 'formatter.felixplatforms.com' },
    { to: '/tfcgchat', label: 'TFCG Chat', slug: 'tfcgchat', publishedUrl: 'tfcgchat.felixconsult.co' },
    { to: '/felitrips', label: 'FeliTrips', slug: 'felitrips', publishedUrl: 'grouptours.citydiscoverer.guide' },
    { to: '/felix-travel-tv', label: 'Felix Travel TV', slug: 'felix-travel-tv', publishedUrl: 'traveltv.citydiscoverer.guide' },
    { to: '/waci-project-hub', label: 'WACI Project Hub', slug: 'waci-project-hub', publishedUrl: 'projecthub.wildlifeafrica.org' },
    { to: '/election-predictor', label: 'Election Predictor', slug: 'election-predictor', publishedUrl: 'electionpredictor.net' },
    { to: 'https://apps.apple.com/us/app/wildlifefilms/id6758022608', label: 'WildFilm Tracker', slug: 'wildfilm-tracker', publishedUrl: 'apps.apple.com' },
    { to: 'https://praxis-nexus.vercel.app/', label: 'Praxis Nexus', slug: 'praxis-nexus', publishedUrl: 'praxis-nexus.vercel.app' },
];

const projectChildrenBySlug = {
    'wildlife-pedia': [
        { hash: '#species', label: 'Species' },
        { hash: '#habitats', label: 'Habitats' },
        { hash: '#projects', label: 'Projects' },
        { hash: '#reports', label: 'Sightings' },
        { hash: '#volunteers', label: 'Volunteers' },
        { hash: '#donors', label: 'Donors' },
    ],
    'waci': [
        { hash: '#overview', label: 'Overview' },
        { hash: '#programs', label: 'Programs' },
        { hash: '#stories', label: 'Stories' },
        { hash: '#resources', label: 'Resources' },
        { hash: '#newsletter-subscribers', label: 'Newsletter Subscribers' },
        { hash: '#volunteers', label: 'Volunteers' },
        { hash: '#partner-requests', label: 'Partner Requests' },
        { hash: '#donors-sponsors', label: 'Donors/Sponsors' },
    ],
    'waci-project-hub': [
        { hash: '#projects', label: 'Projects' },
        { hash: '#assignments', label: 'Volunteer Assignments' },
        { hash: '#grant-offers', label: 'Grant Offers' },
        { hash: '#reports', label: 'Report Review' },
        { hash: '#payments', label: 'Payment Status' },
    ],
    'election-predictor': [
        { hash: '#races', label: 'Races' },
        { hash: '#featured-matchups', label: 'Featured Matchups' },
    ],
};

const normalizeHost = (urlValue) => {
    if (!urlValue) {
        return null;
    }

    const trimmed = String(urlValue).trim();
    if (!trimmed) {
        return null;
    }

    try {
        return new URL(trimmed).host;
    } catch (_error) {
        return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    }
};

function Sidebar() {
    const location = useLocation();
    const [registryLinks, setRegistryLinks] = useState([]);

    useEffect(() => {
        let isActive = true;

        API.get('/api/platform/projects/launched')
            .then((response) => {
                if (!isActive) {
                    return;
                }

                const rows = Array.isArray(response.data) ? response.data : [];
                const mapped = rows
                    .filter((row) => row?.show_in_sidebar && row?.admin_path)
                    .map((row) => ({
                        to: row.admin_path,
                        label: row.sidebar_label || row.name || row.slug,
                        slug: row.slug || null,
                        publishedUrl: normalizeHost(row.public_url),
                        children: row.slug ? (projectChildrenBySlug[row.slug] || []) : [],
                        sortOrder: Number(row.sort_order || 0),
                    }))
                    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

                setRegistryLinks(mapped);
            })
            .catch(() => {
                if (isActive) {
                    setRegistryLinks([]);
                }
            });

        return () => {
            isActive = false;
        };
    }, []);

    const links = useMemo(() => {
        const fallbackByKey = new Map(
            fallbackProjectLinks.map((link) => [link.slug || link.to, link]),
        );

        // Merge registry links into fallback so one launched project does not hide all others.
        for (const link of registryLinks) {
            const key = link.slug || link.to;
            fallbackByKey.set(key, {
                ...fallbackByKey.get(key),
                ...link,
            });
        }

        const rawProjectLinks = Array.from(fallbackByKey.values());
        const projectLinks = rawProjectLinks.map((link) => ({
            ...link,
            children: Array.isArray(link.children) && link.children.length
                ? link.children
                : (link.slug ? (projectChildrenBySlug[link.slug] || []) : []),
        }));
        return [...coreLinks, ...projectLinks];
    }, [registryLinks]);

    const [expandedGroups, setExpandedGroups] = useState(() => ({
        '/wildlife-pedia': location.pathname === '/wildlife-pedia',
        '/waci': location.pathname === '/waci',
        '/waci-project-hub': location.pathname === '/waci-project-hub',
        '/election-predictor': location.pathname === '/election-predictor',
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
                                    <span className="sidebar-link-label">{link.label}</span>
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

                            {link.publishedUrl ? (
                                <a
                                    className="sidebar-published-url"
                                    href={`https://${link.publishedUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {link.publishedUrl}
                                </a>
                            ) : null}

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
