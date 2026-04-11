export default function AboutPage() {
    const pillars = [
        "Make wildlife knowledge accessible, engaging, and relevant to everyday life.",
        "Reduce conflict through practical public awareness and safer coexistence guidance.",
        "Connect curiosity to action through the A & F Wildlife Foundation.",
    ];

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">About Wildlife-Pedia</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">An education-first platform built for responsibility and action.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Wildlife-Pedia combines species knowledge, habitat understanding, conflict prevention, and conservation action in one public-facing experience.
                    It is designed to help people move from interest to informed participation.
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
