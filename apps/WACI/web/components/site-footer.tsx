import Link from "next/link";
import { getSiteContent } from "@/lib/api";

export default async function SiteFooter() {
    const year = new Date().getFullYear();
    const content = await getSiteContent();

    return (
        <footer className="border-t border-white/10 bg-[rgba(4,14,10,0.92)]">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.65fr_0.65fr_0.9fr] lg:px-8">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">WACI</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{content.footerTitle || "Wildlife Africa Conservation Initiative"}</h2>
                    <p className="mt-3 max-w-xl text-sm text-slate-300">
                        {content.footerText || "Inspiring a growing generation for Africa’s wildlife through conservation learning, public storytelling, community action, and shared Felix platform operations."}
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Explore</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        <li><Link href="/#about" className="hover:text-white">About WACI</Link></li>
                        <li><Link href="/#programs" className="hover:text-white">What We Do</Link></li>
                        <li><Link href="/#learn" className="hover:text-white">Learn</Link></li>
                        <li><Link href="/stories" className="hover:text-white">Stories &amp; Media</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Take Action</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        <li><Link href="/#join" className="hover:text-white">Join the Network</Link></li>
                        <li><Link href="/submit-story" className="hover:text-white">Submit a Story</Link></li>
                        <li><Link href="/#join" className="hover:text-white">Volunteer</Link></li>
                        <li><Link href="/#join" className="hover:text-white">Partner With Us</Link></li>
                        <li><Link href="/#join" className="hover:text-white">Donate</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Platform Note</h3>
                    <p className="mt-3 text-sm text-slate-300">
                        {content.footerSubtext || "Public website for wildlifeafrica.org, connected to the Felix Platform shared backend, database, admin dashboard, auth, and email stack."}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-sm text-white/45 sm:px-6 lg:px-8">
                © {year} Wildlife Africa Conservation Initiative. All rights reserved.
            </div>
        </footer>
    );
}
