import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{value}</div>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <>
            <SiteHeader />

            <DashboardShell
                title="Admin Control Panel"
                subtitle="Manage projects, grants, reports, and funding releases."
            >
                <div className="grid-3" style={{ marginBottom: 28 }}>
                    <Stat label="Projects" value="1" />
                    <Stat label="Active Grants" value="1" />
                    <Stat label="Pending Reports" value="2" />
                </div>

                <div className="grid-2">
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Quick links</div>
                        <div style={{ display: "grid", gap: 10 }}>
                            <a href="/admin/projects" className="btn btn-secondary">Manage Projects</a>
                            <a href="/admin/grants" className="btn btn-secondary">Manage Grants</a>
                            <a href="/admin/reports" className="btn btn-secondary">Review Reports</a>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>System status</div>
                        <div style={{ display: "grid", gap: 10, color: "var(--muted)", fontSize: 14 }}>
                            <div>Backend: <strong style={{ color: "var(--primary)" }}>Connected</strong></div>
                            <div>Reporting cycle: <strong>Monthly</strong></div>
                            <div>Payment trigger: <strong>Report approval</strong></div>
                        </div>
                    </div>
                </div>
            </DashboardShell>

            <SiteFooter />
        </>
    );
}
