import Link from "next/link";
import { getWildlifePediaSiteContent } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
    const content = await getWildlifePediaSiteContent();

    return (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Contact</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Talk to the Wildlife-Pedia team.</h1>
                <p className="mt-4 text-slate-300">
                    Reach out for partnerships, educational collaboration, volunteer interest, species adoption support, or public awareness initiatives.
                </p>

                <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                    <p className="font-semibold text-white">Support email</p>
                    <p className="mt-1">{content.supportEmail}</p>
                </div>
            </div>

            <div className="section-shell p-6 sm:p-8">
                <h2 className="text-2xl font-semibold text-white">Quick actions</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <p>Use Wildlife-Pedia to report sightings, get involved, and support wildlife protection through the A & F Wildlife Foundation.</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/report" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">Report a sighting</Link>
                    <Link href="/get-involved" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/40">Get involved</Link>
                </div>
            </div>
        </div>
    );
}
