function DailyFelixWordOfDay() {
    const links = [
        {
            label: 'Public site',
            href: 'https://faithhouse.app',
            description: 'Primary DailyFelix domain (Cloudflare Pages custom domain).',
        },
        {
            label: 'Pages fallback',
            href: 'https://dailyfelix-wordofday.pages.dev',
            description: 'Cloudflare Pages project domain for direct access and troubleshooting.',
        },
        {
            label: 'Admin route',
            href: 'https://faithhouse.app/admin/felixdgreat',
            description: 'DailyFelix admin route used for content management login.',
        },
    ];

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>DailyFelix Word of Day</h1>
                <p className="muted">
                    DailyFelix is now listed in the main admin dashboard. Use the links below to open the public app and admin route.
                </p>
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

export default DailyFelixWordOfDay;
