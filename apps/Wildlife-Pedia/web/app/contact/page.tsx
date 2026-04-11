import Link from "next/link";
import WildlifePageSections from "@/components/wildlife-page-sections";
import { getWildlifePageContent, getWildlifePediaSiteContent } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
    const content = await getWildlifePediaSiteContent();
    const page = getWildlifePageContent(content, "contact");

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="section-shell p-6 sm:p-8">
                    <p className="soft-label">{page?.title || "Contact"}</p>
                    <h1 className="mt-3 text-4xl font-semibold text-white">{page?.heroTitle || "Talk to the Wildlife-Pedia team."}</h1>
                    <p className="mt-4 text-slate-300">
                        {page?.heroText || "Reach out for school collaborations, conservation partnerships, volunteer opportunities, species-support inquiries, or public awareness campaigns."}
                    </p>

                    <div className="mt-6 space-y-3 rounded-[1.4rem] border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                        <div>
                            <p className="font-semibold text-white">Support email</p>
                            <p className="mt-1">{content.supportEmail}</p>
                        </div>
                        <ul className="space-y-2 text-slate-300">
                            <li>• Education and school outreach</li>
                            <li>• Campaigns and community awareness</li>
                            <li>• Volunteering, giving, and species adoption</li>
                            <li>• Media, storytelling, and conservation visibility</li>
                        </ul>
                    </div>
                </div>

                <div className="section-shell p-6 sm:p-8">
                    <h2 className="text-2xl font-semibold text-white">Start with the fastest path</h2>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                        <p>{page?.intro || "If your goal is immediate action, Wildlife-Pedia already gives you direct routes to report a sighting, support a species, or join the wider conservation network."}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/report" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">Report a sighting</Link>
                        <Link href="/get-involved" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/40">Get involved</Link>
                    </div>
                </div>
            </div>

            <WildlifePageSections sections={page?.sections} />
        </div>
    );
}
