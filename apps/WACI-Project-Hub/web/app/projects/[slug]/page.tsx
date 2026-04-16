import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { getPublicProjectBySlug } from "@/lib/waci-server";

export default async function ProjectDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const project = await getPublicProjectBySlug(slug);

    if (!project) return notFound();

    return (
        <>
            <SiteHeader />

            <section className="section">
                <div className="container grid-2" style={{ alignItems: "start" }}>
                    <div className="card" style={{ padding: 28 }}>
                        <div className="badge badge-pilot">{project.status}</div>
                        <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", marginBottom: 10 }}>
                            {project.title}
                        </h1>
                        <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 18 }}>
                            {project.location}
                        </div>
                        <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: 18 }}>
                            {project.summary}
                        </p>

                        <div
                            style={{
                                marginTop: 22,
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            <span className="pill">{project.focus}</span>
                            <span className="pill">{project.duration}</span>
                            <span className="pill">{project.monthlyFunding} monthly</span>
                        </div>

                        <div style={{ marginTop: 32 }}>
                            <h3>Objectives</h3>
                            <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                                {project.objectives.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <h3>Deliverables</h3>
                            <ul style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                                {project.deliverables.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <aside
                        className="card"
                        style={{
                            padding: 24,
                            position: "sticky",
                            top: 96,
                        }}
                    >
                        <div className="badge badge-open">Open for grantee flow</div>
                        <h3 style={{ fontSize: 26, marginBottom: 10 }}>Project summary</h3>

                        <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                            <Info label="Status" value={project.status} />
                            <Info label="Location" value={project.location} />
                            <Info label="Duration" value={project.duration} />
                            <Info label="Funding" value={project.monthlyFunding} />
                        </div>

                        <Link href={`/apply/${slug}`} className="btn btn-primary">
                            Apply for this Project
                        </Link>
                    </aside>
                </div>
            </section>

            <SiteFooter />
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 14,
            }}
        >
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 4 }}>
                {label}
            </div>
            <div style={{ fontWeight: 800 }}>{value}</div>
        </div>
    );
}
