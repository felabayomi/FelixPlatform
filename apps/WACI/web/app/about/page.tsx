export default function AboutPage() {
    const pillars = [
        "Protect biodiversity through practical, locally grounded conservation.",
        "Strengthen community leadership so conservation and livelihoods can advance together.",
        "Use research, education, and partnerships to create durable long-term impact.",
    ];

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">About WACI</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">A conservation mission built for long-term stewardship.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Wildlife Africa Conservation Initiative exists to protect vulnerable species and landscapes while supporting the people who live closest to them.
                    WACI brings together field action, education, and shared coordination to keep conservation work practical and measurable.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {pillars.map((pillar) => (
                        <div key={pillar} className="glass-panel rounded-[1.3rem] p-5 text-sm text-slate-300">
                            {pillar}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
