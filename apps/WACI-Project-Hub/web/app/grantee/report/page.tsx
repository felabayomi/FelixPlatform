"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { getMyScheduledReports, type WaciScheduledReport } from "@/lib/api";

export default function ReportPage() {
    const [reports, setReports] = useState<WaciScheduledReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getMyScheduledReports();
                setReports(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load reports.");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    return (
        <>
            <SiteHeader />

            <DashboardShell
                title="Report schedule"
                subtitle="Open each assigned reporting period, complete the narrative, and submit it into the approval chain."
            >
                <div className="card" style={{ padding: 32 }}>
                    {loading && <div style={{ color: "var(--muted)" }}>Loading report schedule...</div>}
                    {error && (
                        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", fontSize: 14 }}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div style={{ display: "grid", gap: 14 }}>
                            {reports.length === 0 && (
                                <div style={{ color: "var(--muted)" }}>No scheduled reports yet.</div>
                            )}

                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto",
                                        gap: 14,
                                        alignItems: "center",
                                        border: "1px solid var(--border)",
                                        borderRadius: 18,
                                        padding: 18,
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800 }}>
                                            {report.project_title} · Month {report.month_number}
                                        </div>
                                        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                                            Due {new Date(report.due_date).toLocaleDateString()} · Status: {report.status}
                                        </div>
                                    </div>
                                    <Link href={`/grantee/report/${report.id}`} className="btn btn-primary">
                                        Open Report
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardShell>

            <SiteFooter />
        </>
    );
}
