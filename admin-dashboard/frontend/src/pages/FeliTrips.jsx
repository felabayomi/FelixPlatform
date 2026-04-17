function FeliTrips() {
    const links = [
        {
            label: 'Published URL',
            href: 'https://grouptours.citydiscoverer.guide',
            description: 'Primary production domain for FeliTrips group tours.',
        },
        {
            label: 'Vercel fallback',
            href: 'https://felitrips.vercel.app',
            description: 'Direct Vercel alias for diagnostics and fallback access.',
        },
        {
            label: 'Tour Setup',
            href: 'https://felitrips.vercel.app/setup',
            description: 'Paste a groupcitytours.com link to parse and publish a new tour.',
        },
    ];

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>FeliTrips</h1>
                <p className="muted">
                    Group travel marketing platform. Paste a groupcitytours.com link to auto-parse and publish a conversion-focused tour page with AI enrichment.
                </p>
            </div>

            <div className="list-card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>How It Works</h3>
                <div className="dashboard-link-grid" style={{ marginTop: 12 }}>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>1. Parse Tour</strong>
                        <span>Visit /setup, paste a groupcitytours.com link, click Parse. AI enriches the content automatically.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>2. Publish</strong>
                        <span>Click "Publish This Tour" to make it live on the home page immediately.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Stripe Webhook</strong>
                        <span>Set endpoint to https://felitrips.vercel.app/api/webhooks/stripe in Stripe Dashboard for auto-confirmation.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Email Drip</strong>
                        <span>Confirmed reservations receive automated welcome → meet team → prep guide → checklist → countdown emails via Resend.</span>
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

export default FeliTrips;
