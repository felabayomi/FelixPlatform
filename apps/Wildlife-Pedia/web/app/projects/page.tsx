import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getWildlifeProjects } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
    const projects = await getWildlifeProjects();

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Conservation Projects</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Support field-linked wildlife action.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    These projects connect Wildlife-Pedia’s educational layer to public participation, coexistence awareness, and the ongoing work of the A & F Wildlife Foundation.
                </p>

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <article key={project.id} className="glass-panel overflow-hidden rounded-[1.5rem] p-0">
                            {project.image ? <img src={project.image} alt={project.title} className="h-48 w-full object-cover" /> : null}
                            <div className="p-5">
                                <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{project.status || "Active"}</p>
                                <h2 className="mt-3 text-xl font-semibold text-white">{project.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-300">{project.summary}</p>
                                <p className="mt-3 text-sm leading-7 text-slate-300">{project.body}</p>
                                <Link href={project.ctaLink || "/get-involved"} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">
                                    {project.ctaLabel || "Learn more"} <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
