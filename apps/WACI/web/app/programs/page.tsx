const programs = [
    {
        title: "Habitat restoration",
        text: "Rebuild ecosystems, restore degraded land, and improve conditions for native species to recover.",
    },
    {
        title: "Wildlife protection",
        text: "Support ranger readiness, species monitoring, rescue networks, and rapid field response capacity.",
    },
    {
        title: "Community conservation",
        text: "Co-design practical solutions with local leaders so conservation supports shared prosperity.",
    },
    {
        title: "Education and advocacy",
        text: "Equip schools, youth leaders, and partners with conservation knowledge and compelling public storytelling.",
    },
];

export default function ProgramsPage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Programs</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Field programs designed for real conservation outcomes.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    WACI’s program areas can evolve as the organization grows, while the site remains connected to the shared Felix content and support infrastructure.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {programs.map((program) => (
                        <article key={program.title} className="glass-panel rounded-[1.4rem] p-5">
                            <h2 className="text-xl font-semibold text-white">{program.title}</h2>
                            <p className="mt-2 text-sm text-slate-300">{program.text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
