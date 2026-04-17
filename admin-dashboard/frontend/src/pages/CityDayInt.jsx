function CityDayInt() {
    const links = [
        {
            label: 'Published URL',
            href: 'https://international.citydiscoverer.guide',
            description: 'Primary production domain for CityDayInt International.',
        },
        {
            label: 'Vercel fallback',
            href: 'https://citydayint-international.vercel.app',
            description: 'Direct Vercel alias for diagnostics and fallback access.',
        },
    ];

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>CityDayInt International</h1>
                <p className="muted">
                    CityDayInt is now mounted in Felix Admin. Use the links below to open the live experience and fallback URL.
                </p>
            </div>

            <div className="list-card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Auto-Scheduler Guidelines</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                    Automatic scheduling is now active via Vercel Cron.
                </p>
                <div className="dashboard-link-grid" style={{ marginTop: 12 }}>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Generate Tomorrow</strong>
                        <span>Runs daily at 3:00 PM EST (20:00 UTC) and queues the next city.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Auto Publish</strong>
                        <span>Runs daily at 9:00 AM EST (14:00 UTC) and publishes any due scheduled city.</span>
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

export default CityDayInt;
