export function StatStrip({
    stats,
}: {
    stats?: Array<{ label: string; value: string }>;
}) {
    const rows = stats && stats.length
        ? stats
        : [
            { label: "Projects", value: "1" },
            { label: "Countries", value: "1" },
            { label: "Active Grantees", value: "1" },
            { label: "Reporting Model", value: "Monthly" },
        ];

    return (
        <section className="section" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <div className="container grid-4">
                {rows.map((item) => (
                    <div key={item.label} className="card" style={{ padding: 22 }}>
                        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 6 }}>
                            {item.value}
                        </div>
                        <div style={{ color: "var(--muted)", fontWeight: 600 }}>
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
