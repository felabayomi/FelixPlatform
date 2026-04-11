import Link from "next/link";
import { getWildlifePediaSiteContent } from "@/lib/wildlife-api";

export default async function WildlifeSiteFooter() {
    const content = await getWildlifePediaSiteContent();
    const year = new Date().getFullYear();
    const reservedSlugs = new Set(["about", "species", "habitats", "safety", "projects", "blog", "report", "get-involved", "contact"]);
    const customPages = Array.isArray(content.pages)
        ? content.pages.filter((page) => page?.slug && page.showInNav !== false && !reservedSlugs.has(String(page.slug).toLowerCase()))
        : [];

    return (
        <footer className="border-t border-white/10 bg-[rgba(4,14,10,0.92)]">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr] lg:px-8">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">Wildlife-Pedia</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{content.footerTitle}</h2>
                    <p className="mt-3 max-w-xl text-sm text-slate-300">{content.footerText}</p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Explore</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        <li><Link href="/species" className="hover:text-white">Species Directory</Link></li>
                        <li><Link href="/habitats" className="hover:text-white">Habitats</Link></li>
                        <li><Link href="/safety" className="hover:text-white">Conflict & Safety</Link></li>
                        <li><Link href="/blog" className="hover:text-white">Insights</Link></li>
                        {customPages.slice(0, 4).map((page) => (
                            <li key={page.id || page.slug}>
                                <Link href={`/${page.slug}`} className="hover:text-white">{page.navigationLabel || page.title}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Take Action</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        <li><Link href="/report" className="hover:text-white">Report a Sighting</Link></li>
                        <li><Link href="/projects" className="hover:text-white">Conservation Projects</Link></li>
                        <li><Link href="/get-involved" className="hover:text-white">Volunteer / Donate</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Launch & Contact</h3>
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                        <p>{content.footerSubtext}</p>
                        <p>
                            Public domain:{" "}
                            <a href="https://wildlife-pedia.com" className="text-emerald-200 hover:text-white" target="_blank" rel="noreferrer">
                                wildlife-pedia.com
                            </a>
                        </p>
                        <p>
                            Email:{" "}
                            <a href={`mailto:${content.supportEmail}`} className="text-emerald-200 hover:text-white">
                                {content.supportEmail}
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-sm text-white/45 sm:px-6 lg:px-8">
                © {year} Wildlife-Pedia. All rights reserved.
            </div>
        </footer>
    );
}
