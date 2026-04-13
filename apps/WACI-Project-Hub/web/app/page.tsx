import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { HeroSection } from "@/components/waci/hero-section";
import { StatStrip } from "@/components/waci/stat-strip";
import { SectionTitle } from "@/components/waci/section-title";
import { FeaturedProjectCard } from "@/components/waci/featured-project-card";
import { HowItWorks } from "@/components/waci/how-it-works";
import { MotionSection } from "@/components/waci/motion-section";
import { projects } from "@/lib/waci-data";
import { getLandingStats, getPublicProjects } from "@/lib/waci-server";

export default async function HomePage() {
    const [stats, backendProjects] = await Promise.all([
        getLandingStats(),
        getPublicProjects(),
    ]);
    const featured = backendProjects[0] || projects[0];

    return (
        <>
            <SiteHeader />
            <HeroSection />
            <StatStrip stats={stats} />

            <section className="section">
                <div className="container">
                    <SectionTitle
                        eyebrow="Public platform"
                        title="A platform first, then projects, then grantee execution."
                        subtitle="The landing page should introduce WACI, establish trust, explain the grant workflow, and only then guide users into specific projects."
                    />
                    <MotionSection>
                        <FeaturedProjectCard project={featured} />
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
                        <a href="/projects" className="btn btn-primary">
                            Explore Projects
                        </a>
                        <a href="/grantee/dashboard" className="btn btn-secondary">
                            View Grantee Interface
                        </a>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </>
    );
}
