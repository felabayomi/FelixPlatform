export function SiteFooter() {
    return (
        <footer className="section" style={{ paddingTop: 24 }}>
            <div
                className="container card"
                style={{
                    padding: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>WACI Project Hub</div>
                    <div style={{ color: "var(--muted)", maxWidth: 560 }}>
                        A structured platform for conservation projects, grantee execution,
                        and measurable reporting.
                    </div>
                </div>

                <div style={{ color: "var(--muted)" }}>
                    © 2026 WACI. Built for public transparency and grantee execution.
                </div>
            </div>
        </footer>
    );
}
