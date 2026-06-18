function FelixTravelTV() {
    const links = [
        {
            label: 'Live App',
            href: 'https://traveltv.citydiscoverer.guide/',
            description: 'Frontend (Vercel) — React showcase with AI-generated travel slides, video player, and news reader.',
        },
        {
            label: 'API Server',
            href: 'https://felix-travel-tv-api.onrender.com',
            description: 'Backend (Render) — Express + PostgreSQL API powering slides, articles, and playback state.',
        },
        {
            label: 'Admin Panel',
            href: 'https://traveltv.citydiscoverer.guide/admin',
            description: 'Admin interface for managing content, broadcast queue, and playback.',
        },
    ];

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>Felix Travel TV</h1>
                <p className="muted">
                    AI-powered travel content showcase. Features a live broadcast view, news reader with voice playback,
                    AI-generated destination slides, and video queue management.
                </p>
            </div>

            <div className="list-card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Architecture</h3>
                <div className="dashboard-link-grid" style={{ marginTop: 12 }}>
                    <div className="management-link" role="status">
                        <strong>Frontend</strong>
                        <span>React + Vite SPA deployed on Vercel. Uses <code>VITE_ADMIN_PIN</code> for admin access.</span>
                    </div>
                    <div className="management-link" role="status">
                        <strong>Backend</strong>
                        <span>Express + Drizzle + PostgreSQL on Render. Requires <code>TRAVEL_TV_OPEN_AI_KEY</code> and <code>DATABASE_URL</code>.</span>
                    </div>
                    <div className="management-link" role="status">
                        <strong>GitHub</strong>
                        <span>Source in <code>apps/FelixTravelTV</code> within the FelixPlatform monorepo.</span>
                    </div>
                </div>
            </div>

            <div className="list-card">
                <div className="dashboard-link-grid">
                    {links.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="management-link"
                        >
                            <strong>{item.label}</strong>
                            <span>{item.description}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FelixTravelTV;
