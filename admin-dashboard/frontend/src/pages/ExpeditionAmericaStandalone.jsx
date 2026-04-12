function ExpeditionAmericaStandalone() {
    const baseUrl = (
        import.meta.env.VITE_EXPEDITION_AMERICA_APP_SITE_URL
        || 'https://expedition-america-kj011p40q-felabayomis-projects.vercel.app'
    ).trim().replace(/\/$/, '');
    const adminUrl = (
        import.meta.env.VITE_EXPEDITION_AMERICA_APP_ADMIN_URL
        || `${baseUrl}/admin`
    ).trim();

    return (
        <div className="page-section" style={{ gap: 16 }}>
            <h1>Expedition America (Standalone Project)</h1>
            <p className="muted">
                This module is isolated from the 50USAStates integration and points to the standalone Expedition America deployment.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={adminUrl} target="_blank" rel="noreferrer" className="edit-button" style={{ textDecoration: 'none' }}>
                    Open Dedicated Admin
                </a>
                <a href={baseUrl} target="_blank" rel="noreferrer" className="cancel-button" style={{ textDecoration: 'none' }}>
                    Open Frontend Site
                </a>
            </div>

            <div
                style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    minHeight: '70vh',
                    background: '#fff',
                }}
            >
                <iframe
                    title="Expedition America Standalone Admin"
                    src={adminUrl}
                    style={{ width: '100%', height: '70vh', border: 0 }}
                    loading="lazy"
                />
            </div>
        </div>
    );
}

export default ExpeditionAmericaStandalone;
