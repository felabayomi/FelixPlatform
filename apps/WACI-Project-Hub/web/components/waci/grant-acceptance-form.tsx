"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptGrantOffer } from "@/lib/api";

export function GrantAcceptanceForm({ offerId }: { offerId: string }) {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [signatureName, setSignatureName] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setError(null);
        if (!fullName.trim() || !signatureName.trim()) {
            setError("Full name and signature are required.");
            return;
        }
        if (!accepted) {
            setError("You must accept the grant conditions before continuing.");
            return;
        }

        setLoading(true);
        try {
            await acceptGrantOffer(offerId, { signature_name: signatureName.trim() });
            router.push("/grantee/dashboard");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to accept grant offer.");
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
                Accept and sign
            </div>

            <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>Full name</span>
                    <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter grantee full name"
                        style={inputStyle}
                    />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>Digital signature</span>
                    <input
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Type full name as signature"
                        style={inputStyle}
                    />
                </label>

                <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        style={{ marginTop: 4 }}
                    />
                    <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                        I accept the project deliverables, reporting requirements, and monthly funding conditions.
                    </span>
                </label>

                {error && (
                    <div style={{ color: "#991b1b", background: "#fee2e2", padding: 12, borderRadius: 12, fontSize: 14 }}>
                        {error}
                    </div>
                )}

                <button className="btn btn-primary" onClick={handleAccept} disabled={loading}>
                    {loading ? "Accepting..." : "Accept Grant Offer"}
                </button>
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
