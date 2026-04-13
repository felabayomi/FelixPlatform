import Link from "next/link";
import type { WaciProject } from "@/lib/waci-data";

export function ProjectCard({ project }: { project: WaciProject }) {
    return (
        <div className="card" style={{ padding: 22 }}>
            <div
                style={{
                    height: 180,
                    borderRadius: 20,
                    background:
                        "linear-gradient(135deg, rgba(11,61,46,0.95), rgba(200,169,106,0.72))",
                    marginBottom: 18,
                }}
            />

            <div className="badge badge-pilot">{project.status}</div>

            <h3 style={{ fontSize: 24, marginBottom: 10 }}>{project.title}</h3>
            <div style={{ color: "var(--muted)", fontWeight: 600, marginBottom: 10 }}>
                {project.location}
            </div>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, minHeight: 84 }}>
                {project.summary}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
                <span className="pill">{project.focus}</span>
                <Link href={`/projects/${project.slug}`} className="btn btn-primary">
                    View Project
                </Link>
            </div>
        </div>
    );
}
