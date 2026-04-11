import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import WildlifePageSections from "@/components/wildlife-page-sections";
import { getWildlifePageContent, getWildlifePediaSiteContent } from "@/lib/wildlife-api";

const safetyCards = [
    {
        title: "Before an encounter",
        points: [
            "Know the species common to your area and the times they are most active.",
            "Avoid moving alone in high-risk areas at dawn, dusk, or after dark.",
            "Secure food, livestock, and waste in wildlife-sensitive zones.",
        ],
    },
    {
        title: "During an encounter",
        points: [
            "Stay calm and avoid sudden movement or loud provocation.",
            "Give wildlife a clear escape path and keep a safe distance.",
            "Do not approach young animals or try to intervene physically.",
        ],
    },
    {
        title: "After an encounter",
        points: [
            "Report recurring sightings or risk hotspots through the proper local channels.",
            "Document place, time, and behavior rather than spreading panic.",
            "Support prevention, not retaliation, wherever possible.",
        ],
    },
];

export const dynamic = "force-dynamic";

export default async function SafetyPage() {
    const content = await getWildlifePediaSiteContent();
    const page = getWildlifePageContent(content, "safety");

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">{page?.title || "Human–Wildlife Conflict & Safety"}</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{page?.heroTitle || "Safety starts with understanding."}</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    {page?.heroText || "Wildlife-Pedia is not only about learning species names — it is about helping people make safer, more responsible decisions where wildlife and everyday life intersect."}
                </p>

                <div className="mt-8 grid gap-5 lg:grid-cols-3">
                    {safetyCards.map((card) => (
                        <article key={card.title} className="glass-panel rounded-[1.4rem] p-5">
                            <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                                {card.points.map((point) => (
                                    <p key={point} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> {point}</p>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>

                <WildlifePageSections sections={page?.sections} />

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-50">
                        <p className="inline-flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Important note</p>
                        <p className="mt-3 leading-7">Wildlife-Pedia provides educational guidance, not emergency response. In urgent danger, contact the relevant wildlife or emergency authorities in your area immediately.</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-emerald-300/20 bg-emerald-300/10 p-5 text-sm text-emerald-50">
                        <p className="inline-flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Prevention works best</p>
                        <p className="mt-3 leading-7">Awareness, planning, reporting, and community coordination are often the most effective ways to reduce repeated conflict and protect both people and wildlife.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
