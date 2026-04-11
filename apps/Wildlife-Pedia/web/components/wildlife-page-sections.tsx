import Link from "next/link";
import type { WildlifePageSection } from "@/lib/wildlife-api";

export default function WildlifePageSections({ sections }: { sections?: WildlifePageSection[] }) {
    const safeSections = Array.isArray(sections) ? sections.filter((section) => section?.title || section?.body || (section?.items || []).length) : [];

    if (!safeSections.length) {
        return null;
    }

    return (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {safeSections.map((section, index) => (
                <article key={section.id || index} className="glass-panel overflow-hidden rounded-[1.4rem] p-5">
                    {section.image ? <img src={section.image} alt={section.title || `Section ${index + 1}`} className="mb-4 h-40 w-full rounded-[1rem] object-cover" /> : null}
                    {section.eyebrow ? <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{section.eyebrow}</p> : null}
                    <h2 className="mt-2 text-xl font-semibold text-white">{section.title}</h2>
                    {section.body ? <p className="mt-3 text-sm leading-7 text-slate-300">{section.body}</p> : null}

                    {Array.isArray(section.items) && section.items.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {section.items.map((item) => (
                                <li key={item}>• {item}</li>
                            ))}
                        </ul>
                    ) : null}

                    {section.ctaLabel && section.ctaLink ? (
                        <Link href={section.ctaLink} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">
                            {section.ctaLabel}
                        </Link>
                    ) : null}
                </article>
            ))}
        </div>
    );
}
