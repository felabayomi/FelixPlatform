import { Compass, ShieldAlert, Trees, Waves } from "lucide-react";
import { getWildlifeHabitats } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function HabitatsPage() {
    const habitats = await getWildlifeHabitats();
    const featuredHabitats = habitats.filter((item) => item.featured).slice(0, 3);
    const regionCount = new Set(habitats.map((item) => item.region).filter(Boolean)).size;

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <section className="section-shell overflow-hidden p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
                    <div>
                        <p className="soft-label">Habitats & Ecosystems</p>
                        <h1 className="mt-3 text-4xl font-semibold text-white">Understand the spaces wildlife depends on.</h1>
                        <p className="mt-4 max-w-3xl text-slate-300">
                            Wildlife-Pedia treats habitats as living systems where biodiversity, livelihoods, and safety often overlap. The more people understand the landscape, the easier it becomes to protect species and reduce avoidable conflict.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-2xl font-semibold text-emerald-300">{habitats.length}</p>
                                <p className="mt-1 text-sm text-slate-300">Habitat guides</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-2xl font-semibold text-emerald-300">{regionCount || 1}</p>
                                <p className="mt-1 text-sm text-slate-300">Regional ecosystem lenses</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-2xl font-semibold text-emerald-300">24/7</p>
                                <p className="mt-1 text-sm text-slate-300">Awareness value</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10">
                            <img
                                src={featuredHabitats[0]?.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"}
                                alt={featuredHabitats[0]?.title || "Wildlife habitat"}
                                className="h-64 w-full object-cover"
                            />
                        </div>
                        {featuredHabitats.slice(1).map((item) => (
                            <div key={item.id} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Featured habitat</p>
                                <h2 className="mt-2 text-lg font-semibold text-white">{item.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="glass-panel rounded-[1.4rem] p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200"><Trees className="h-4 w-4" /> What to notice</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">Look for movement routes, water access, nesting zones, and pressure points where people and wildlife use the same space differently.</p>
                </div>
                <div className="glass-panel rounded-[1.4rem] p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-100"><ShieldAlert className="h-4 w-4" /> Where pressure grows</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">Conflict often rises where habitats are shrinking, routes are blocked, or public awareness is lower than the actual level of risk.</p>
                </div>
                <div className="glass-panel rounded-[1.4rem] p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200"><Compass className="h-4 w-4" /> Why habitats matter</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">Protecting habitats means protecting behavior, migration, breeding space, food webs, and the long-term stability of shared landscapes.</p>
                </div>
            </section>

            <div className="mt-8 space-y-5">
                {habitats.map((habitat, index) => (
                    <article key={habitat.id} className="glass-panel overflow-hidden rounded-[1.5rem] border border-white/10">
                        <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
                            {habitat.image ? <img src={habitat.image} alt={habitat.title} className="h-full min-h-[260px] w-full object-cover" /> : null}
                            <div className="p-6">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-emerald-100">{habitat.region || "Habitat profile"}</span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Ecosystem {index + 1}</span>
                                </div>
                                <h2 className="mt-3 text-2xl font-semibold text-white">{habitat.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-300">{habitat.summary}</p>
                                <p className="mt-4 text-sm leading-7 text-slate-300">{habitat.body}</p>

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
                                        <strong className="block">Human interaction</strong>
                                        <span>{habitat.humanInteraction || "Shared access, local livelihoods, and wildlife movement all shape this landscape."}</span>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">
                                        <strong className="inline-flex items-center gap-2"><Waves className="h-4 w-4" /> Why stewardship matters</strong>
                                        <p className="mt-2">Healthier habitats support species survival, safer coexistence, and stronger resilience for nearby communities.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
