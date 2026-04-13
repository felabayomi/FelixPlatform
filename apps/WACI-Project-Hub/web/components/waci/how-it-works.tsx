export function HowItWorks() {
    const steps = [
        "Project Defined",
        "Volunteer Selected",
        "Grant Issued Monthly",
        "Reports Submitted",
        "Impact Verified",
    ];

    return (
        <section className="section">
            <div className="container">
                <div className="card" style={{ padding: 28 }}>
                    <h3 style={{ fontSize: 32, marginTop: 0 }}>How the platform works</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: 12,
                            marginTop: 24,
                        }}
                    >
                        {steps.map((step, i) => (
                            <div
                                key={step}
                                style={{
                                    border: "1px solid var(--border)",
                                    borderRadius: 20,
                                    padding: 18,
                                    background: i === 2 ? "var(--surface-2)" : "white",
                                }}
                            >
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 999,
                                        background: "var(--primary)",
                                        color: "white",
                                        display: "grid",
                                        placeItems: "center",
                                        fontWeight: 800,
                                        marginBottom: 12,
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <div style={{ fontWeight: 800 }}>{step}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
