function CityOfDay() {
    const links = [
        {
            label: 'Published URL',
            href: 'https://daily.citydiscoverer.guide',
            description: 'Primary production domain for CityOfDay Daily.',
        },
        {
            label: 'Vercel fallback',
            href: 'https://cityofday-daily.vercel.app',
            description: 'Direct Vercel alias for diagnostics and fallback access.',
        },
    ];

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>CityOfDay Daily</h1>
                <p className="muted">
                    CityOfDay is now mounted in Felix Admin. Use the links below to open the live USA-only experience and fallback URL.
                </p>
            </div>

            <div className="list-card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Auto-Scheduler Guidelines</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                    Automatic scheduling is active via Vercel Cron and is restricted to one USA city per day.
                </p>
                <div className="dashboard-link-grid" style={{ marginTop: 12 }}>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Generate Tomorrow</strong>
                        <span>Runs daily at 3:00 PM Eastern and queues exactly one next-day USA city.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Auto Approve</strong>
                        <span>Runs daily at 9:00 AM Eastern and publishes only the due city scheduled for that day.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>USA-only Guardrail</strong>
                        <span>The scheduler pool is limited to US destinations and the AI prompt is set to US travel context only.</span>
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

export default CityOfDay;