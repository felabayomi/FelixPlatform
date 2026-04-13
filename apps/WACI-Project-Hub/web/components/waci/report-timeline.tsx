const reports = [
    { month: "Month 1", status: "Approved", due: "Jan 31" },
    { month: "Month 2", status: "Submitted", due: "Feb 28" },
    { month: "Month 3", status: "Processing", due: "Mar 31" },
    { month: "Month 4", status: "Locked", due: "Apr 30" },
];

type StatusConfig = { label: string; emoji: string; bg: string; color: string };

function getStatusConfig(status: string): StatusConfig {
    const s = status.toLowerCase();
    if (s === "approved" || s === "paid") return { label: "Approved", emoji: "✅", bg: "#dcfce7", color: "#166534" };
    if (s === "submitted") return { label: "Submitted", emoji: "📨", bg: "#dbeafe", color: "#1e40af" };
    if (s === "processing" || s === "under review") return { label: "Processing", emoji: "⏳", bg: "#fef9c3", color: "#854d0e" };
    if (s === "due soon" || s === "late") return { label: s === "late" ? "Late" : "Due Soon", emoji: "⚠️", bg: "#ffedd5", color: "#9a3412" };
    if (s === "locked") return { label: "Locked", emoji: "🔒", bg: "#f1f5f9", color: "#475569" };
    return { label: status, emoji: "🕐", bg: "#f1f5f9", color: "#64748b" };
}

export function ReportTimeline({
    rows,
}: {
    rows?: Array<{ month: string; status: string; due: string }>;
}) {
    const items = rows && rows.length ? rows : reports;

    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
                Reporting timeline
            </div>

            <div style={{ display: "grid", gap: 12 }}>
                {items.map((item) => {
                    const cfg = getStatusConfig(item.status);
                    return (
                        <div
                            key={item.month}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                border: "1px solid var(--border)",
                                borderRadius: 18,
                                padding: 16,
                                background: "var(--surface)",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 800 }}>{item.month}</div>
                                <div style={{ color: "var(--muted)", fontSize: 13 }}>Due: {item.due}</div>
                            </div>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "5px 12px",
                                    borderRadius: 999,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    background: cfg.bg,
                                    color: cfg.color,
                                }}
                            >
                                {cfg.emoji} {cfg.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
