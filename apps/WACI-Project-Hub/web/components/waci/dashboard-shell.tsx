import Link from "next/link";

export function DashboardShell({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
            <div className="grid-2" style={{ gridTemplateColumns: "280px 1fr" }}>
                <aside className="card" style={{ padding: 20, height: "fit-content" }}>
                    <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>
                        WACI Grantee
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                        <Link className="btn btn-secondary" href="/grantee/dashboard">
                            Dashboard
                        </Link>
                        <Link className="btn btn-secondary" href="/projects/hukia-airport">
                            Project View
                        </Link>
                        <Link className="btn btn-secondary" href="/volunteer/grant/offer-001">
                            Grant Offer
                        </Link>
                    </div>

                    <div
                        style={{
                            marginTop: 18,
                            borderTop: "1px solid var(--border)",
                            paddingTop: 18,
                            color: "var(--muted)",
                            lineHeight: 1.7,
                        }}
                    >
                        Public-facing project pages and private grantee execution live in separate
                        flows.
                    </div>
                </aside>

                <main>
                    <div style={{ marginBottom: 20 }}>
                        <h1 style={{ marginBottom: 8, fontSize: "clamp(32px, 5vw, 54px)" }}>
                            {title}
                        </h1>
                        {subtitle ? (
                            <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                                {subtitle}
                            </p>
                        ) : null}
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
}
