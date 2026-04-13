"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com";

type Report = {
    id: number;
    project_title: string;
    volunteer_name: string;
    volunteer_email: string;
    report_month: string;
    summary: string;
    challenges?: string;
    next_steps?: string;
    status: string;
    is_late: boolean;
    submitted_at: string;
    due_date: string;
    admin_notes?: string;
};

function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("waci_hub_token");
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        pending: { bg: "#dbeafe", color: "#1e40af", label: "Pending" },
        approved: { bg: "#dcfce7", color: "#166534", label: "Approved" },
        rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
        revision_requested: { bg: "#ffedd5", color: "#9a3412", label: "Revision Requested" },
        late: { bg: "#fef9c3", color: "#854d0e", label: "Late" },
    };
    const cfg = styles[s] || { bg: "#f1f5f9", color: "#475569", label: status };
    return (
        <span
            style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.color,
            }}
        >
            {cfg.label}
        </span>
    );
}

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<number | null>(null);
    const [noteInput, setNoteInput] = useState<Record<number, string>>({});

    const fetchReports = async () => {
        const token = getToken();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/waci-hub/reports`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setReports(Array.isArray(data) ? data : data.reports ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load reports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const review = async (id: number, status: "approved" | "rejected" | "revision_requested") => {
        const token = getToken();
        setActionId(id);
        try {
            const res = status === "approved"
                ? await fetch(`${API_BASE}/api/waci-hub/reports/${id}/approve`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ admin_notes: noteInput[id] || undefined }),
                })
                : await fetch(`${API_BASE}/api/waci-hub/reports/${id}/review`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ status, admin_notes: noteInput[id] || undefined }),
                });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            await fetchReports();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Action failed.");
        } finally {
            setActionId(null);
        }
    };

    const pending = reports.filter((r) => r.status === "pending" || r.status === "late");
    const reviewed = reports.filter((r) => r.status !== "pending" && r.status !== "late");

    return (
        <>
            <SiteHeader />

            <DashboardShell
                title="Report Approvals"
                subtitle="Review submitted monthly reports and trigger payment releases upon approval."
            >
                {loading && (
                    <div style={{ color: "var(--muted)", padding: 20 }}>Loading reports…</div>
                )}
                {error && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            background: "#fee2e2",
                            color: "#991b1b",
                            marginBottom: 20,
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading && (
                    <>
                        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                            Awaiting review ({pending.length})
                        </div>

                        <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
                            {pending.length === 0 && (
                                <div className="card" style={{ padding: 20, color: "var(--muted)" }}>
                                    No reports pending review.
                                </div>
                            )}
                            {pending.map((r) => (
                                <div key={r.id} className="card" style={{ padding: 24 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            flexWrap: "wrap",
                                            gap: 10,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 16 }}>
                                                {r.project_title}
                                            </div>
                                            <div style={{ color: "var(--muted)", fontSize: 13 }}>
                                                {r.volunteer_name} · {r.volunteer_email} ·{" "}
                                                {new Date(r.report_month).toLocaleDateString("en-US", {
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </div>

                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                                            Summary
                                        </div>
                                        <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                                            {r.summary}
                                        </div>
                                    </div>

                                    {r.challenges && (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                                                Challenges
                                            </div>
                                            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                                                {r.challenges}
                                            </div>
                                        </div>
                                    )}

                                    {r.next_steps && (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
                                                Next steps
                                            </div>
                                            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                                                {r.next_steps}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 16 }}>
                                        <textarea
                                            value={noteInput[r.id] ?? ""}
                                            onChange={(e) =>
                                                setNoteInput((prev) => ({ ...prev, [r.id]: e.target.value }))
                                            }
                                            placeholder="Admin notes (optional)…"
                                            rows={2}
                                            style={{
                                                width: "100%",
                                                padding: "10px 12px",
                                                borderRadius: 10,
                                                border: "1px solid var(--border)",
                                                fontSize: 14,
                                                resize: "vertical",
                                                background: "var(--bg)",
                                                color: "inherit",
                                                fontFamily: "inherit",
                                                marginBottom: 12,
                                            }}
                                        />
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <button
                                                className="btn btn-primary"
                                                disabled={actionId === r.id}
                                                onClick={() => review(r.id, "approved")}
                                            >
                                                {actionId === r.id ? "Processing…" : "✅ Approve & Unlock Payment"}
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                disabled={actionId === r.id}
                                                onClick={() => review(r.id, "revision_requested")}
                                            >
                                                ✏️ Request Revision
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                disabled={actionId === r.id}
                                                onClick={() => review(r.id, "rejected")}
                                                style={{ color: "#991b1b" }}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {reviewed.length > 0 && (
                            <>
                                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                                    Reviewed ({reviewed.length})
                                </div>
                                <div style={{ display: "grid", gap: 12 }}>
                                    {reviewed.map((r) => (
                                        <div
                                            key={r.id}
                                            className="card"
                                            style={{
                                                padding: "16px 20px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: 10,
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{r.project_title}</div>
                                                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                                                    {r.volunteer_name} ·{" "}
                                                    {new Date(r.report_month).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                            </div>
                                            <StatusBadge status={r.status} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </DashboardShell>

            <SiteFooter />
        </>
    );
}
