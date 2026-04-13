"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { getScheduledReport, submitScheduledReport } from "@/lib/api";

type ReportDetail = {
    id: number;
    project_title?: string;
    month_number: number;
    due_date?: string;
    status: string;
    narrative?: string;
    attachments?: string[];
};

export default function GranteeReportDetailPage() {
    const params = useParams<{ reportId: string }>();
    const [report, setReport] = useState<ReportDetail | null>(null);
    const [narrative, setNarrative] = useState("");
    const [challenges, setChallenges] = useState("");
    const [nextSteps, setNextSteps] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getScheduledReport(params.reportId);
                setReport(data as ReportDetail);
                setNarrative(data.narrative || "");
                setAttachments(Array.isArray(data.attachments) ? data.attachments : []);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load report");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [params.reportId]);

    const handleAttach = () => {
        if (!attachmentUrl.trim()) return;
        setAttachments((prev) => [...prev, attachmentUrl.trim()]);
        setAttachmentUrl("");
    };

    const handleSubmit = async () => {
        if (!narrative.trim()) {
            setError("Narrative is required.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await submitScheduledReport(params.reportId, {
                narrative: narrative.trim(),
                attachments,
                challenges: challenges.trim() || undefined,
                next_steps: nextSteps.trim() || undefined,
            });
            const refreshed = await getScheduledReport(params.reportId);
            setReport(refreshed as ReportDetail);
            setSuccess("Report submitted for review.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to submit report");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <SiteHeader />
            <DashboardShell title="Report Detail" subtitle="Review the assigned reporting period and attach evidence for submission.">
                {loading && <div style={{ color: "var(--muted)" }}>Loading report...</div>}
                {error && <div style={{ color: "#991b1b" }}>{error}</div>}
                {report && (
                    <div className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
                        <div>
                            <div className="pill" style={{ marginBottom: 10 }}>{report.status}</div>
                            <h2 style={{ margin: 0 }}>{report.project_title || `Report ${report.id}`}</h2>
                            <div style={{ color: "var(--muted)", marginTop: 6 }}>
                                Month {report.month_number} · Due {report.due_date ? new Date(report.due_date).toLocaleDateString() : "TBD"}
                            </div>
                        </div>

                        <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder="Describe activities, wildlife observations, incidents, and outcomes for this reporting period..."
                            rows={7}
                            style={inputStyle}
                        />

                        <textarea
                            value={challenges}
                            onChange={(e) => setChallenges(e.target.value)}
                            placeholder="Challenges encountered"
                            rows={3}
                            style={inputStyle}
                        />

                        <textarea
                            value={nextSteps}
                            onChange={(e) => setNextSteps(e.target.value)}
                            placeholder="Next steps for the upcoming month"
                            rows={3}
                            style={inputStyle}
                        />

                        <div>
                            <div style={{ fontWeight: 800, marginBottom: 8 }}>Attachments</div>
                            <div style={{ display: "grid", gap: 8 }}>
                                {attachments.length ? attachments.map((attachment) => (
                                    <a key={attachment} href={attachment} target="_blank" rel="noreferrer">
                                        {attachment}
                                    </a>
                                )) : <div style={{ color: "var(--muted)" }}>No attachments yet.</div>}
                            </div>
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                            <input
                                value={attachmentUrl}
                                onChange={(e) => setAttachmentUrl(e.target.value)}
                                placeholder="Paste file URL to attach evidence"
                                style={inputStyle}
                            />
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="btn btn-secondary" onClick={handleAttach} type="button">
                                    Add Attachment
                                </button>
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                                    {saving ? "Submitting..." : "Submit Report"}
                                </button>
                                <Link href="/grantee/dashboard" className="btn btn-secondary">
                                    Back to Dashboard
                                </Link>
                            </div>
                            {success && <div style={{ color: "#166534" }}>{success}</div>}
                        </div>
                    </div>
                )}
            </DashboardShell>
            <SiteFooter />
        </>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    outline: "none",
    background: "white",
};
