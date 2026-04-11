import WildlifeActionForm from "@/components/wildlife-action-form";

const actions = [
    {
        title: "Volunteer your skills",
        text: "Support outreach, awareness campaigns, education sessions, storytelling, and local reporting culture.",
    },
    {
        title: "Donate or adopt a species",
        text: "Help fund public education, coexistence awareness, and species-focused conservation support pathways.",
    },
    {
        title: "Partner or sponsor",
        text: "Collaborate on campaigns, school programs, media visibility, or conservation activations.",
    },
    {
        title: "Bring it to your community",
        text: "Invite Wildlife-Pedia into classrooms, eco-clubs, local groups, or awareness events where it can have practical value.",
    },
];

export default function GetInvolvedPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Get involved</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Turn wildlife curiosity into practical contribution.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Wildlife-Pedia is designed to move people from admiration to participation — through volunteering, donations, partnerships, species support, and public education.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
