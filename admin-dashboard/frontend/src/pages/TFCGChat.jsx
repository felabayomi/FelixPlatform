function TFCGChat() {
    const links = [
        {
            label: 'Published URL',
            href: 'https://tfcgchat.felixconsult.co',
            description: 'Primary production domain for TFCG Chat.',
        },
        {
            label: 'Vercel fallback',
            href: 'https://tfcgchat.vercel.app',
            description: 'Direct Vercel alias for diagnostics and fallback access.',
        },
    ];

    return (
        <div className="page-section">
            <div className="page-header">
                <h1>TFCG Chat</h1>
                <p className="muted">
                    AI-powered chat assistant for The Felix Consulting Group. Supports voice chat, image generation, and streaming responses.
                </p>
            </div>

            <div className="list-card" style={{ marginBottom: 16 }}>
                <h3 style={{ marginTop: 0 }}>Admin Controls</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                    Conversations can be deleted by providing the admin code in the app interface. The founder passphrase unlocks an elevated system prompt.
                </p>
                <div className="dashboard-link-grid" style={{ marginTop: 12 }}>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Admin Delete Code</strong>
                        <span>Required in the app to delete conversations. Set via TFCHAT_ADMIN_DELETE_CODE env var.</span>
                    </div>
                    <div className="management-link" role="status" aria-live="polite">
                        <strong>Founder Passphrase</strong>
                        <span>First message in a conversation triggers elevated mode. Set via TFCHAT_FOUNDER_PASSPHRASE env var.</span>
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

export default TFCGChat;
