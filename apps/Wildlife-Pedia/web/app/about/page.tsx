export default function AboutPage() {
    const pillars = [
        {
            title: "Encyclopedia clarity",
            text: "Species and habitat pages explain wildlife in plain language, without losing ecological depth.",
        },
        {
            title: "Field-ready guidance",
            text: "Safety cues, coexistence tips, and behavior signals help people make calmer, smarter decisions.",
        },
        {
            title: "Citizen awareness",
            text: "Community reporting and practical observation strengthen local visibility around recurring wildlife activity.",
        },
        {
            title: "Foundation action",
            text: "Every page is designed to connect learning with the A & F Wildlife Foundation’s real conservation work.",
        },
    ];
    const audiences = [
        "Students and educators",
        "Families and travelers",
        "Communities near wildlife corridors",
        "Conservation supporters and partners",
    ];

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">About Wildlife-Pedia</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">A modern wildlife knowledge hub for Africa.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Wildlife-Pedia is built to make wildlife information useful in the real world — for students, families, travelers, communities, and supporters.
                    It combines the clarity of an encyclopedia, the practicality of a field guide, and the momentum of an action platform.
                </p>
                <p className="mt-3 max-w-3xl text-slate-300">
                    The goal is simple: help more people understand the animals around them, reduce avoidable conflict, and support stronger conservation outcomes through informed action.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {pillars.map((pillar) => (
                        <div key={pillar.title} className="glass-panel rounded-[1.3rem] p-5 text-sm text-slate-300">
                            <h2 className="text-base font-semibold text-white">{pillar.title}</h2>
                            <p className="mt-2">{pillar.text}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-black/10 p-5">
                    <p className="soft-label">Who it serves</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {audiences.map((item) => (
                            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
                                {item}
                            </span>
                        ))}
                    </div>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                        At launch, Wildlife-Pedia is already structured to support discovery, safer coexistence, public education, and real conservation participation — all from one experience.
                    </p>
                </div>
            </div>
        </div>
    );
}
