function CityTourHub() {
    const adminUrl = (import.meta.env.VITE_CITYTOURHUB_ADMIN_URL || 'https://citytourhub.vercel.app/admin/tours').trim();

    return (
        <div className="page-section" style={{ gap: 16 }}>
            <h1>City Tour Hub</h1>
            <p className="muted">
                City Discoverer group tours — manage tours, view signups, local picks requests,
                contact messages, newsletter subscribers and user account requests.
                Uses the shared Felix Platform database and email infrastructure.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={adminUrl} target="_blank" rel="noreferrer" className="edit-button" style={{ textDecoration: 'none' }}>
                    Open Tour Admin
                </a>
                <a href="https://citytourhub.vercel.app" target="_blank" rel="noreferrer" className="cancel-button" style={{ textDecoration: 'none' }}>
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
                    src={adminUrl}
                    title="City Tour Hub Admin"
                    style={{ width: '100%', height: '75vh', border: 'none' }}
                />
            </div>
        </div>
    );
}

export default CityTourHub;
