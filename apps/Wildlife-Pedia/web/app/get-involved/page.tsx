import WildlifeActionForm from "@/components/wildlife-action-form";

const actions = [
    {
        title: "Volunteer",
        text: "Contribute to awareness, education, reporting support, and conservation outreach.",
    },
    {
        title: "Donate or adopt a species",
        text: "Back Wildlife-Pedia and A & F Wildlife Foundation work through public support pathways.",
    },
    {
        title: "Partner",
        text: "Collaborate with the platform on schools, campaigns, coexistence tools, or conservation visibility.",
    },
];

export default function GetInvolvedPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Get involved</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Turn wildlife curiosity into real contribution.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Wildlife-Pedia is built to support volunteering, donations, species adoption, and wider public participation — not just passive reading.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {actions.map((action) => (
                        <article key={action.title} className="glass-panel rounded-[1.4rem] p-5">
                            <h2 className="text-xl font-semibold text-white">{action.title}</h2>
                            <p className="mt-2 text-sm text-slate-300">{action.text}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-8">
                    <WildlifeActionForm />
                </div>
            </div>
        </div>
    );
}
