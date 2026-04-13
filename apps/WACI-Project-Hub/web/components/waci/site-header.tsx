import Link from "next/link";

export function SiteHeader() {
    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 20,
                backdropFilter: "blur(12px)",
                background: "rgba(246, 244, 238, 0.82)",
                borderBottom: "1px solid rgba(16,36,29,0.06)",
            }}
        >
            <div
                className="container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: 76,
                    gap: 20,
                }}
            >
                <Link href="/" style={{ fontWeight: 800, fontSize: 18 }}>
                    WACI Project Hub
                </Link>

                <nav
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                        color: "var(--muted)",
                        fontWeight: 600,
                    }}
                >
                    <Link href="/">Home</Link>
                    <Link href="/projects">Projects</Link>
                    <Link href="/grantee/dashboard">Grantee Dashboard</Link>
                    <Link href="/projects" className="btn btn-primary">
                        Explore Projects
                    </Link>
                </nav>
            </div>
        </header>
    );
}
