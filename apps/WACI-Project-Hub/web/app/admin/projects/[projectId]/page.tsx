"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import {
    approveReport,
    generateGrantOfferFromProject,
    getPayments,
    getProjectById,
    getProjectGrant,
    getProjectReports,
    sendGrantOffer,
    type WaciGrantOffer,
    type WaciProject,
    type WaciReport,
} from "@/lib/api";

function splitLines(value?: string) {
    return String(value || "")
        .split(/\r?\n|;|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}

const LIFECYCLE_STEPS = [
    "Draft",
    "Grant Generated",
    "Offer Sent",
    "Accepted",
    "Reporting",
    "Funding",
];

export default function AdminProjectDetailPage() {
    const params = useParams<{ projectId: string }>();
    const [project, setProject] = useState<WaciProject | null>(null);
    const [grant, setGrant] = useState<WaciGrantOffer | null>(null);
    const [reports, setReports] = useState<WaciReport[]>([]);
    const [latestFundingStatus, setLatestFundingStatus] = useState<string>("-");
    const [volunteerName, setVolunteerName] = useState("");
    const [volunteerEmail, setVolunteerEmail] = useState("");
    const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadWorkflow = async () => {
        const found = await getProjectById(params.projectId);

        const [currentGrant, projectReports, payments] = await Promise.all([
            getProjectGrant(found.id),
            getProjectReports(found.id),
            getPayments({ project_id: Number(found.id) }),
        ]);

        const fundingStatus = payments[0]?.status || "-";

        setProject(found);
        setGrant(currentGrant);
        setReports(projectReports);
        setLatestFundingStatus(fundingStatus);
        setVolunteerName(currentGrant?.volunteer_name || "");
        setVolunteerEmail(currentGrant?.volunteer_email || "");
    };

    useEffect(() => {
        const load = async () => {
            try {
                await loadWorkflow();
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load project");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [params.projectId]);

    const handleGenerateGrant = async () => {
        if (!project) return;
        setActionLoading(true);
        setError(null);
        setWorkflowMessage(null);
        try {
            await generateGrantOfferFromProject(project.id);
            setWorkflowMessage("Grant offer generated from project.");
            await loadWorkflow();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate grant offer");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendOffer = async () => {
        if (!grant) return;
        setActionLoading(true);
        setError(null);
        setWorkflowMessage(null);
        try {
            await sendGrantOffer(grant.id, {
                volunteer_name: volunteerName,
                volunteer_email: volunteerEmail,
            });
            setWorkflowMessage("Offer sent. Volunteer can now accept via secure link.");
            await loadWorkflow();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to send offer");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveReport = async (reportId: number) => {
        setActionLoading(true);
        setError(null);
        setWorkflowMessage(null);
        try {
            await approveReport(reportId, "Approved from project command center");
            setWorkflowMessage("Report approved and funding advanced.");
            await loadWorkflow();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to approve report");
        } finally {
            setActionLoading(false);
        }
    };

    const grantStatus = grant?.status || "none";
    const latestReport = reports[0] || null;
    const reportStatus = latestReport?.status || "none";
    const canGenerate = project?.status === "draft" || project?.status === "published";
    const canSend = grantStatus === "draft";
    const canOpenDashboard = grantStatus === "accepted" || project?.status === "active";
    const reportNeedsApproval = (status: string) => status === "pending" || status === "late" || status === "submitted";
    const pendingReports = reports.filter((item) => reportNeedsApproval(item.status));
    const canApproveReport = pendingReports.length > 0;
    const hasGrant = !!grant || project?.status === "grant_generated" || project?.status === "offer_sent" || project?.status === "active";
    const offerSent = grantStatus === "sent" || grantStatus === "accepted" || project?.status === "offer_sent" || project?.status === "active";
    const accepted = grantStatus === "accepted" || project?.status === "active";
    const reportingStarted = reports.length > 0 || reportStatus !== "none";
    const fundingReleased = ["released", "paid", "processed", "completed"].includes(String(latestFundingStatus).toLowerCase());

    let lifecycleIndex = 0;
    if (hasGrant) lifecycleIndex = 1;
    if (offerSent) lifecycleIndex = 2;
    if (accepted) lifecycleIndex = 3;
    if (reportingStarted) lifecycleIndex = 4;
    if (fundingReleased) lifecycleIndex = 5;

    const nextAction = canGenerate
        ? "Generate Grant Offer"
        : canSend
            ? "Assign Grantee + Send Offer"
            : grantStatus === "sent"
                ? "Waiting for acceptance"
                : canApproveReport
                    ? "Approve submitted report"
                    : canOpenDashboard
                        ? "Open Dashboard"
                        : "Monitor lifecycle";

    const objectives = splitLines(project?.objectives);
    const deliverables = splitLines(project?.deliverables);
    const reporting = splitLines(project?.expectations);

    return (
        <>
            <SiteHeader />
            <DashboardShell
                title="Project Control Center"
                subtitle="Single-page lifecycle control for grant generation, offer sending, acceptance, reporting, and funding progression."
            >
                {loading && <div style={{ color: "var(--muted)" }}>Loading project...</div>}
                {error && <div style={{ color: "#991b1b" }}>{error}</div>}
                {workflowMessage && <div style={{ color: "#166534" }}>{workflowMessage}</div>}

                {project && (
                    <div className="card" style={{ padding: 24, display: "grid", gap: 18 }}>
                        <LifecycleStrip activeIndex={lifecycleIndex} />

                        <div className="card" style={{ padding: 16, border: "1px solid var(--border)" }}>
                            <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 4 }}>Next guided action</div>
                            <div style={{ fontWeight: 800, fontSize: 20 }}>{nextAction}</div>
                        </div>

                        <div>
                            <div className="pill" style={{ marginBottom: 10 }}>{project.status}</div>
                            <h2 style={{ margin: 0 }}>{project.title}</h2>
                            <div style={{ color: "var(--muted)", marginTop: 6 }}>{project.region || "No location set"}</div>
                        </div>

                        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>{project.purpose}</p>

                        <div className="grid-3">
                            <Info label="Slug" value={project.slug} />
                            <Info label="Assignments" value={String(project.assignment_count || 0)} />
                            <Info label="Status" value={project.status} />
                        </div>

                        <Section label="Objectives" items={objectives} />
                        <Section label="Deliverables" items={deliverables} />
                        <Section label="Reporting" items={reporting} />

                        <div className="grid-3">
                            <Info label="Grant status" value={grantStatus} />
                            <Info label="Latest report" value={reportStatus} />
                            <Info label="Funding status" value={latestFundingStatus} />
                        </div>

                        {grant && (
                            <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
                                <div style={{ fontWeight: 800 }}>Grantee assignment</div>
                                <input
                                    value={volunteerName}
                                    onChange={(e) => setVolunteerName(e.target.value)}
                                    placeholder="Volunteer full name"
                                    style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                                />
                                <input
                                    value={volunteerEmail}
                                    onChange={(e) => setVolunteerEmail(e.target.value)}
                                    placeholder="Volunteer email"
                                    style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {canGenerate && (
                                <button className="btn btn-primary" onClick={handleGenerateGrant} disabled={actionLoading}>
                                    {actionLoading ? "Generating..." : "Generate Grant Offer"}
                                </button>
                            )}
                            {canSend && grant && (
                                <button className="btn btn-primary" onClick={handleSendOffer} disabled={actionLoading}>
                                    {actionLoading ? "Sending..." : "Assign Grantee + Send Offer"}
                                </button>
                            )}
                            {canOpenDashboard && (
                                <Link href="/grantee/dashboard" className="btn btn-secondary">
                                    Open Dashboard
                                </Link>
                            )}
                            <Link href="/admin/projects/create" className="btn btn-secondary">
                                Back to Creator
                            </Link>
                            {grant && (
                                <Link href={`/admin/grants/${grant.id}`} className="btn btn-secondary">
                                    Open Grant Offer
                                </Link>
                            )}
                        </div>

                        {grantStatus === "sent" && (
                            <div className="card" style={{ padding: 16 }}>
                                <div style={{ fontWeight: 800, marginBottom: 6 }}>Waiting for acceptance</div>
                                <div style={{ color: "var(--muted)" }}>
                                    Offer has been sent. This page will automatically unlock dashboard and reporting actions once accepted.
                                </div>
                            </div>
                        )}

                        {project.status === "active" && (
                            <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
                                <div style={{ fontWeight: 800 }}>Reports</div>
                                {reports.length === 0 && <div style={{ color: "var(--muted)" }}>No reports submitted yet.</div>}

                                {reports.map((item) => (
                                    <div key={item.id} className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                            <div style={{ fontWeight: 700 }}>{item.report_month}</div>
                                            <div className="pill">{item.status}</div>
                                        </div>
                                        <div style={{ color: "var(--muted)" }}>{item.summary}</div>
                                        {reportNeedsApproval(item.status) && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleApproveReport(item.id)}
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? "Approving..." : "Approve Report"}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DashboardShell>
            <SiteFooter />
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="card" style={{ padding: 16 }}>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>{label}</div>
            <div style={{ fontWeight: 700 }}>{value}</div>
        </div>
    );
}

function Section({ label, items }: { label: string; items: string[] }) {
    return (
        <div>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{label}</div>
            <div className="card" style={{ padding: 18 }}>
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
                    {items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>None added</li>}
                </ul>
            </div>
        </div>
    );
}

function LifecycleStrip({ activeIndex }: { activeIndex: number }) {
    return (
        <div className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Lifecycle Progress</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {LIFECYCLE_STEPS.map((step, index) => {
                    const isDone = index <= activeIndex;
                    const isCurrent = index === activeIndex;
                    return (
                        <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    border: `1px solid ${isDone ? "#15803d" : "var(--border)"}`,
                                    background: isCurrent ? "#dcfce7" : isDone ? "#f0fdf4" : "transparent",
                                    color: isDone ? "#166534" : "var(--muted)",
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                {index + 1}. {step}
                            </div>

                            {index < LIFECYCLE_STEPS.length - 1 && (
                                <span
                                    className="timeline-connector"
                                    aria-hidden="true"
                                    style={{
                                        color: isDone ? "#15803d" : "var(--muted)",
                                        fontSize: 11,
                                        lineHeight: 1,
                                    }}
                                >
                                    -&gt;
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .timeline-connector {
                    display: inline;
                }

                @media (max-width: 768px) {
                    .timeline-connector {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
