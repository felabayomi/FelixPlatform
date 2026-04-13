export function SignaturePanel() {
    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
                Accept and sign
            </div>

            <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>Full name</span>
                    <input
                        placeholder="Enter grantee full name"
                        style={inputStyle}
                    />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>Digital signature</span>
                    <input
                        placeholder="Type full name as signature"
                        style={inputStyle}
                    />
                </label>

                <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <input type="checkbox" style={{ marginTop: 4 }} />
                    <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                        I accept the project deliverables, reporting requirements, and monthly
                        funding conditions.
                    </span>
                </label>

                <button className="btn btn-primary">Accept Grant Offer</button>
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid var(--border)",
    outline: "none",
    background: "white",
};
