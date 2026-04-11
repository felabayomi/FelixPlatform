import Link from "next/link";
import { ArrowLeft, Leaf, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { getWildlifeSpeciesBySlug } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function SpeciesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const species = await getWildlifeSpeciesBySlug(slug);

    if (!species) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-4">
                <Link href="/species" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-emerald-300/40 hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Back to species
                </Link>
            </div>

            <article className="section-shell overflow-hidden p-6 sm:p-8">
                {species.image ? <img src={species.image} alt={species.name} className="mb-6 h-[360px] w-full rounded-[1.4rem] object-cover" /> : null}

                <p className="soft-label">Species Profile</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{species.name}</h1>
                {species.scientificName ? <p className="mt-2 text-lg italic text-slate-300">{species.scientificName}</p> : null}
                <p className="mt-4 max-w-4xl text-slate-300">{species.summary}</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="glass-panel rounded-[1.2rem] p-4 text-sm text-slate-300"><strong className="block text-white">Habitat</strong>{species.habitat || "Not specified"}</div>
                    <div className="glass-panel rounded-[1.2rem] p-4 text-sm text-slate-300"><strong className="block text-white">Range</strong>{species.rangeText || "Not specified"}</div>
                    <div className="glass-panel rounded-[1.2rem] p-4 text-sm text-slate-300"><strong className="block text-white">Diet</strong>{species.diet || "Not specified"}</div>
                    <div className="glass-panel rounded-[1.2rem] p-4 text-sm text-slate-300"><strong className="block text-white">Status</strong>{species.conservationStatus || "Not specified"}</div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4 text-base leading-8 text-slate-200">
                        {String(species.body || "")
                            .split(/\n{2,}/)
                            .filter(Boolean)
                            .map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                    </div>

                    <div className="space-y-4">
                        <div className="glass-panel rounded-[1.4rem] p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Coexistence tip</p>
                            <p className="mt-3 inline-flex items-start gap-2 text-sm leading-7 text-slate-300"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> {species.coexistenceTips || "Keep a respectful distance and follow local wildlife guidance."}</p>
                        </div>
                        <div className="glass-panel rounded-[1.4rem] p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/80">Risk level</p>
                            <p className="mt-3 inline-flex items-start gap-2 text-sm leading-7 text-slate-300"><ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-amber-200" /> {species.riskLevel || "Varies by context and location."}</p>
                        </div>
                        <div className="glass-panel rounded-[1.4rem] p-5">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Why it matters</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-300">
                                <p className="inline-flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-300" /> Healthy ecosystems depend on informed protection.</p>
                                <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-300" /> Better local awareness helps reduce avoidable conflict.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
