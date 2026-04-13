export function GrantSummaryCard({
    summary,
}: {
    summary?: {
        project: string;
        duration: string;
        funding: string;
        currentStatus: string;
        nextReportDue: string;
    };
}) {
    const data = summary || {
        project: "HUKIA Airport Wildlife Hazard Control Unit",
        duration: "12 months",
        funding: "$300 / month",
        currentStatus: "Active",
        nextReportDue: "April 30",
    };

    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
                Grant summary
            </div>

            <div style={{ display: "grid", gap: 14 }}>
                <Row label="Project" value={data.project} />
                <Row label="Duration" value={data.duration} />
                <Row label="Funding" value={data.funding} />
                <Row label="Current status" value={data.currentStatus} />
                <Row label="Next report due" value={data.nextReportDue} />
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 12,
                borderBottom: "1px solid var(--border)",
                paddingBottom: 10,
            }}
        >
            <div style={{ color: "var(--muted)" }}>{label}</div>
            <div style={{ fontWeight: 700 }}>{value}</div>
        </div>
    );
}
