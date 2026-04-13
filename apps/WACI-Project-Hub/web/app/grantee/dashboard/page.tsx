import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { DashboardStatCard } from "@/components/waci/dashboard-stat-card";
import { ReportTimeline } from "@/components/waci/report-timeline";
import { PaymentTracker } from "@/components/waci/payment-tracker";
import { GrantSummaryCard } from "@/components/waci/grant-summary-card";
import { getDashboardData } from "@/lib/waci-server";

export default async function GranteeDashboardPage() {
    const dashboard = await getDashboardData();

    return (
        <>
            <SiteHeader />

            <DashboardShell
                title="Grantee dashboard"
                subtitle="A private execution view for accepted volunteers and grantees. This is where reporting, funding status, and project delivery are managed."
            >
                <div className="grid-3" style={{ marginBottom: 20 }}>
                    <DashboardStatCard
                        label="Active project"
                        value={dashboard?.activeProject || "1"}
                        helper="HUKIA Airport Wildlife Hazard Control Unit"
                    />
                    <DashboardStatCard
                        label="Next report due"
                        value={dashboard?.nextReportDue || "Apr 30"}
                        helper="Monthly reporting cycle"
                    />
                    <DashboardStatCard
                        label="Funding status"
                        value={dashboard?.fundingStatus || "On Track"}
                        helper="Next release depends on report approval"
                    />
                </div>

                <div className="grid-2">
                    <div style={{ display: "grid", gap: 20 }}>
                        <ReportTimeline rows={dashboard?.reportTimeline} />
                        <PaymentTracker rows={dashboard?.paymentRows} />
                    </div>

                    <div style={{ display: "grid", gap: 20 }}>
                        <GrantSummaryCard summary={dashboard?.grantSummary} />

                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
                                Quick actions
                            </div>

                            <div style={{ display: "grid", gap: 12 }}>
                                <a href={dashboard?.nextReportId ? `/grantee/report/${dashboard.nextReportId}` : "/grantee/report"} className="btn btn-primary">Submit Monthly Report</a>
                                <button className="btn btn-secondary">Upload Field Photos</button>
                                <button className="btn btn-secondary">Download Reporting Template</button>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                                Deliverables
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "var(--muted)" }}>
                                {(dashboard?.deliverables?.length ? dashboard.deliverables : ["Daily field logs", "Monthly report", "Final report"]).map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="card" style={{ padding: 24 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
                                Project notes
                            </div>
                            <div style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                                Keep public exploration pages separate from grantee execution pages.
                                The public side explains the project. The grantee side manages the work.
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardShell>

            <SiteFooter />
        </>
    );
}
