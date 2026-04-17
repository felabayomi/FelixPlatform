import Link from "next/link";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { HeroSection } from "@/components/waci/hero-section";
import { StatStrip } from "@/components/waci/stat-strip";
import { SectionTitle } from "@/components/waci/section-title";
import { HowItWorks } from "@/components/waci/how-it-works";
import { MotionSection } from "@/components/waci/motion-section";
import { getLandingStats, getPublicProjects } from "@/lib/waci-server";

export default async function HomePage() {
    const [stats, backendProjects] = await Promise.all([
        getLandingStats(),
        getPublicProjects(),
    ]);

    return (
        <>
            <SiteHeader />
            <HeroSection />
            <StatStrip stats={stats} />

            <section className="section">
                <div className="container">
                    <SectionTitle
                        eyebrow="Active projects"
                        title="Conservation projects, built on accountable monthly delivery."
                        subtitle="Each project is field-operated, grant-funded, and reported monthly."
                    />
                    <MotionSection>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {backendProjects.map((p) => (
                                <div
                                    key={p.slug}
                                    className="card"
                                    style={{
                                        padding: "18px 24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                            <span className="badge badge-pilot">{p.status}</span>
                                            <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.location}</span>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 17 }}>{p.title}</div>
                                        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>{p.focus}</div>
                                    </div>
                                    <Link href={`/projects/${p.slug}`} className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                                        View project
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </MotionSection>
                </div>
            </section>

            <HowItWorks />

            <section className="section">
                <div className="container card" style={{ padding: 28 }}>
                    <SectionTitle
                        eyebrow="Built for scale"
                        title="Start with one pilot. Expand into a full conservation system."
                        subtitle="Today it begins with airport wildlife hazard control. Tomorrow it can support more projects, more volunteers, more grants, and stronger reporting."
                    />
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <a
                            href="https://www.wildlifeafrica.org/?source=donate#join"
                            className="btn btn-primary"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Donate
                        </a>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </>
    );
}

