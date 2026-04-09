import Link from "next/link";

const actions = [
    {
        title: "Partner with WACI",
        text: "Collaborate on programs, sponsorship, field logistics, or storytelling campaigns.",
    },
    {
        title: "Support a campaign",
        text: "Help fund restoration, ranger support, education, and species protection work.",
    },
    {
        title: "Volunteer or advocate",
        text: "Contribute your time, network, and voice to expand conservation awareness.",
    },
];

export default function GetInvolvedPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Get involved</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Join the work of protecting Africa’s wildlife.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    This foundation page is ready for future donation, volunteer, and partner workflows while already connected to the shared Felix backend and contact system.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {actions.map((action) => (
                        <article key={action.title} className="glass-panel rounded-[1.4rem] p-5">
                            <h2 className="text-xl font-semibold text-white">{action.title}</h2>
                            <p className="mt-2 text-sm text-slate-300">{action.text}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-6">
                    <Link
                        href="/contact"
                        className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                    >
                        Contact the WACI team
                    </Link>
                </div>
            </div>
        </div>
    );
}
