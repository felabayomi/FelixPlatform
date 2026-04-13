import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { SectionTitle } from "@/components/waci/section-title";
import { ProjectCard } from "@/components/waci/project-card";
import { getPublicProjects } from "@/lib/waci-server";

export default async function ProjectsPage() {
    const projects = await getPublicProjects();

    return (
        <>
            <SiteHeader />

            <section className="section">
                <div className="container">
                    <SectionTitle
                        eyebrow="Public project directory"
                        title="Browse conservation projects"
                        subtitle="The airport pilot appears here as a featured project, not as the homepage itself."
                    />

                    <div className="grid-3">
                        {projects.map((project) => (
                            <ProjectCard key={project.slug} project={project} />
                        ))}
                    </div>
                </div>
            </section>

            <SiteFooter />
        </>
    );
}
