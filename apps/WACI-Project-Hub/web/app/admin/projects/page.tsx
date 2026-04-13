"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { getProjects, type WaciProject } from "@/lib/api";

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<WaciProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const rows = await getProjects();
                setProjects(rows);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load projects");
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
                title="Projects"
                subtitle="Open any project command center to continue the guided lifecycle workflow."
            >
                {loading && <div style={{ color: "var(--muted)" }}>Loading projects...</div>}
                {error && <div style={{ color: "#991b1b" }}>{error}</div>}

                {!loading && !error && (
                    <div style={{ display: "grid", gap: 16 }}>
                        {projects.length === 0 && (
                            <div className="card" style={{ padding: 24, color: "var(--muted)" }}>
                                No projects yet.
                            </div>
                        )}

                        {projects.map((project) => (
                            <div key={project.id} className="card" style={{ padding: 24, display: "grid", gap: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                    <div>
                                        <div className="pill" style={{ marginBottom: 8 }}>{project.status}</div>
                                        <div style={{ fontSize: 20, fontWeight: 800 }}>{project.title}</div>
                                        <div style={{ color: "var(--muted)", marginTop: 4 }}>{project.region || "No location"}</div>
                                    </div>
                                    <Link href={`/admin/projects/${project.id}`} className="btn btn-primary">
                                        Open Command Center
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DashboardShell>
            <SiteFooter />
        </>
    );
}
