"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { getGrantOffer, sendGrantOffer, type WaciGrantOffer } from "@/lib/api";

export default function AdminGrantDetailPage() {
    const params = useParams<{ grantId: string }>();
    const [grant, setGrant] = useState<WaciGrantOffer | null>(null);
    const [volunteerName, setVolunteerName] = useState("");
    const [volunteerEmail, setVolunteerEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [acceptanceUrl, setAcceptanceUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const offer = await getGrantOffer(params.grantId);
                setGrant(offer);
                setVolunteerName(offer.volunteer_name || "");
                setVolunteerEmail(offer.volunteer_email || "");
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load grant offer");
            }
        };

        void load();
    }, [params.grantId]);

    const handleSend = async () => {
        setSending(true);
        setError(null);
        try {
            const sent = await sendGrantOffer(params.grantId, {
                volunteer_name: volunteerName,
                volunteer_email: volunteerEmail,
            });
            setGrant(sent);
            setAcceptanceUrl(sent.acceptance_url || null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to send grant offer");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <SiteHeader />
            <DashboardShell
                title="Grant Offer"
                subtitle="Assign the grantee, send the offer, and follow the acceptance lifecycle into the dashboard."
            >
                {error && <div style={{ color: "#991b1b", marginBottom: 12 }}>{error}</div>}

                {grant && (
                    <div className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
                        <div>
                            <div className="pill" style={{ marginBottom: 10 }}>{grant.status}</div>
                            <h2 style={{ margin: 0 }}>{grant.title}</h2>
                            <div style={{ color: "var(--muted)", marginTop: 6 }}>
                                {grant.project_title} · {grant.offer_code || `Offer ${grant.id}`}
                            </div>
                        </div>

                        <div className="grid-2">
                            <label style={{ display: "grid", gap: 8 }}>
                                <span style={{ fontWeight: 700 }}>Volunteer Name</span>
                                <input
                                    value={volunteerName}
                                    onChange={(e) => setVolunteerName(e.target.value)}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={{ display: "grid", gap: 8 }}>
                                <span style={{ fontWeight: 700 }}>Volunteer Email</span>
                                <input
                                    type="email"
                                    value={volunteerEmail}
                                    onChange={(e) => setVolunteerEmail(e.target.value)}
                                    style={inputStyle}
                                />
                            </label>
                        </div>

                        <div className="grid-3">
                            <Info label="Funding" value={`$${Math.round((grant.total_amount_cents || 0) / 100)}`} />
                            <Info label="Currency" value={grant.currency.toUpperCase()} />
                            <Info label="Issued" value={new Date(grant.issued_at).toLocaleDateString()} />
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
                                {sending ? "Sending..." : "Send Offer"}
                            </button>
                            {acceptanceUrl && (
                                <a href={acceptanceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                                    Open Acceptance Link
                                </a>
                            )}
                            {grant.status === "accepted" && (
                                <Link href="/grantee/dashboard" className="btn btn-secondary">
                                    View Grantee Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </DashboardShell>
            <SiteFooter />
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="card" style={{ padding: 16 }}>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>{label}</div>
            <div style={{ fontWeight: 700 }}>{value}</div>
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
