import Link from "next/link";

export function HeroSection() {
    return (
        <section className="section" style={{ paddingTop: 42 }}>
            <div className="container">
                <div
                    className="card"
                    style={{
                        padding: 28,
                        overflow: "hidden",
                        background:
                            "linear-gradient(135deg, #0b3d2e 0%, #124d3a 45%, #1e5f47 100%)",
                        color: "white",
                    }}
                >
                    <div className="grid-2" style={{ alignItems: "center" }}>
                        <div style={{ padding: "18px 8px 18px 6px" }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    marginBottom: 16,
                                    background: "rgba(255,255,255,0.12)",
                                    borderRadius: 999,
                                    padding: "8px 14px",
                                    fontSize: 13,
                                    fontWeight: 700,
                                }}
                            >
                                Pilot conservation platform
                            </div>

                            <h1
                                style={{
                                    fontSize: "clamp(40px, 7vw, 74px)",
                                    lineHeight: 0.98,
                                    margin: "0 0 16px",
                                    letterSpacing: "-0.03em",
                                }}
                            >
                                Fund real conservation work.
                                <br />
                                One project. One grantee. Measurable impact.
                            </h1>

                            <p
                                style={{
                                    fontSize: 18,
                                    lineHeight: 1.7,
                                    color: "rgba(255,255,255,0.82)",
                                    maxWidth: 620,
                                    marginBottom: 24,
                                }}
                            >
                                WACI Project Hub is a structured operating system for practical,
                                grant-backed conservation work. Start with our airport wildlife
                                hazard control pilot and expand into more field projects over time.
                            </p>

                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <Link href="/projects" className="btn btn-secondary">
                                    Explore Projects
                                </Link>
                                <Link href="/projects/hukia-airport" className="btn btn-primary">
                                    View Pilot Project
                                </Link>
                            </div>
                        </div>

                        <div>
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    borderRadius: 28,
                                    padding: 20,
                                }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gap: 14,
                                        gridTemplateColumns: "repeat(2, 1fr)",
                                    }}
                                >
                                    {[
                                        ["Featured Project", "HUKIA Airport Pilot"],
                                        ["Region", "Nigeria"],
                                        ["Grant Model", "Monthly release"],
                                        ["Primary Output", "Field reports"],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            style={{
                                                background: "rgba(255,255,255,0.08)",
                                                borderRadius: 20,
                                                padding: 18,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "rgba(255,255,255,0.65)",
                                                    marginBottom: 8,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.08em",
                                                }}
                                            >
                                                {label}
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: 18 }}>{value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        marginTop: 16,
                                        borderRadius: 22,
                                        background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))",
                                        padding: 18,
                                    }}
                                >
                                    <div style={{ fontWeight: 800, marginBottom: 8 }}>How it works</div>
                                    <div style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.7 }}>
                                        Define project. Select grantee. Release monthly funding.
                                        Collect reports. Verify delivery.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
