function ExpeditionAmerica() {
    const adminUrl = (import.meta.env.VITE_EXPEDITION_AMERICA_ADMIN_URL || 'https://expeditionamerica.online/admin').trim();

    return (
        <div className="page-section" style={{ gap: 16 }}>
            <h1>Expedition America (50USAStates)</h1>
            <p className="muted">
                This module hosts the dedicated Expedition America controls inside Felix Admin while keeping shared platform services
                (database, auth, media upload) centralized.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={adminUrl} target="_blank" rel="noreferrer" className="edit-button" style={{ textDecoration: 'none' }}>
                    Open Dedicated Admin
                </a>
                <a href="https://expeditionamerica.online" target="_blank" rel="noreferrer" className="cancel-button" style={{ textDecoration: 'none' }}>
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
                    title="Expedition America Admin"
                    src={adminUrl}
                    style={{ width: '100%', height: '70vh', border: 0 }}
                    loading="lazy"
                />
            </div>
        </div>
    );
}

export default ExpeditionAmerica;