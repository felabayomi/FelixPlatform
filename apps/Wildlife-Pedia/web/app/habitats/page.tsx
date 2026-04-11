import { getWildlifeHabitats } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function HabitatsPage() {
    const habitats = await getWildlifeHabitats();

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Habitats & Ecosystems</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Understand the spaces wildlife depends on.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Wildlife-Pedia treats habitats as living systems where biodiversity, livelihoods, and safety often overlap.
                </p>

                <div className="mt-8 space-y-5">
                    {habitats.map((habitat) => (
                        <article key={habitat.id} className="glass-panel overflow-hidden rounded-[1.5rem] border border-white/10">
                            <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
                                {habitat.image ? <img src={habitat.image} alt={habitat.title} className="h-full min-h-[240px] w-full object-cover" /> : null}
                                <div className="p-6">
                                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{habitat.region || "Habitat profile"}</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-white">{habitat.title}</h2>
                                    <p className="mt-3 text-sm leading-7 text-slate-300">{habitat.summary}</p>
                                    <p className="mt-4 text-sm leading-7 text-slate-300">{habitat.body}</p>
                                    {habitat.humanInteraction ? (
                                        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
                                            <strong className="block">Human interaction</strong>
                                            <span>{habitat.humanInteraction}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
