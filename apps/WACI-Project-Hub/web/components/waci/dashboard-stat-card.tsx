export function DashboardStatCard({
    label,
    value,
    helper,
}: {
    label: string;
    value: string;
    helper?: string;
}) {
    return (
        <div className="card" style={{ padding: 22 }}>
            <div style={{ color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>
                {label}
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 8 }}>{value}</div>
            {helper ? <div style={{ color: "var(--muted)" }}>{helper}</div> : null}
        </div>
    );
}
