import Link from "next/link";
import { ArrowRight, MapPin, ShieldAlert } from "lucide-react";
import { getWildlifeSpecies } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function SpeciesPage() {
    const species = await getWildlifeSpecies();

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <div className="max-w-3xl">
                    <p className="soft-label">Species Directory</p>
                    <h1 className="mt-3 text-4xl font-semibold text-white">Discover species, behavior, and conservation context.</h1>
                    <p className="mt-4 text-slate-300">
                        Wildlife-Pedia profiles are designed to make species knowledge practical — from habitat and diet to conservation status and coexistence tips.
                    </p>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {species.map((item) => (
                        <article key={item.id} className="glass-panel overflow-hidden rounded-[1.5rem] border border-white/10">
                            {item.image ? <img src={item.image} alt={item.name} className="h-52 w-full object-cover" /> : null}
                            <div className="p-5">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                    {item.conservationStatus ? <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-emerald-100">{item.conservationStatus}</span> : null}
                                    {item.rangeText ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {item.rangeText}</span> : null}
                                </div>
                                <h2 className="mt-3 text-xl font-semibold text-white">{item.name}</h2>
                                {item.scientificName ? <p className="mt-1 text-sm italic text-slate-400">{item.scientificName}</p> : null}
                                <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>
                                {item.riskLevel ? (
                                    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                                        <ShieldAlert className="h-3.5 w-3.5" /> {item.riskLevel}
                                    </p>
                                ) : null}
                                <Link href={`/species/${encodeURIComponent(item.slug)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">
                                    Open full profile <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
