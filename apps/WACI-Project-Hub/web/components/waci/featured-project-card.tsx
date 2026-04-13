import Link from "next/link";
import type { WaciProject } from "@/lib/waci-data";

export function FeaturedProjectCard({ project }: { project: WaciProject }) {
    return (
        <div className="card" style={{ padding: 28 }}>
            <div className="badge badge-pilot">{project.status}</div>

            <div className="grid-2" style={{ marginTop: 18 }}>
                <div>
                    <h3 style={{ fontSize: 34, margin: "0 0 12px" }}>{project.title}</h3>
                    <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 17 }}>
                        {project.summary}
                    </p>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                        <span className="pill">{project.location}</span>
                        <span className="pill">{project.focus}</span>
                        <span className="pill">{project.duration}</span>
                    </div>
                </div>

                <div
                    style={{
                        borderRadius: 24,
                        padding: 22,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
                        Monthly funding
                    </div>
                    <div style={{ fontSize: 38, fontWeight: 800, marginBottom: 18 }}>
                        {project.monthlyFunding}
                    </div>

                    <div style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: 18 }}>
                        Start with one pilot, prove the workflow, and expand to more conservation
                        projects and volunteers later.
                    </div>

                    <Link href={`/projects/${project.slug}`} className="btn btn-primary">
                        View Project
                    </Link>
                </div>
            </div>
        </div>
    );
}
