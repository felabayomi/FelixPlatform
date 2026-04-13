export function SectionTitle({
    eyebrow,
    title,
    subtitle,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
}) {
    return (
        <div style={{ marginBottom: 24 }}>
            {eyebrow ? <div className="pill">{eyebrow}</div> : null}
            <h2
                style={{
                    margin: "14px 0 10px",
                    fontSize: "clamp(30px, 5vw, 48px)",
                    lineHeight: 1.05,
                }}
            >
                {title}
            </h2>
            {subtitle ? (
                <p
                    style={{
                        margin: 0,
                        color: "var(--muted)",
                        fontSize: 18,
                        maxWidth: 760,
                        lineHeight: 1.6,
                    }}
                >
                    {subtitle}
                </p>
            ) : null}
        </div>
    );
}
