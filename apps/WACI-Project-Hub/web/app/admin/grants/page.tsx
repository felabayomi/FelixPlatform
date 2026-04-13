"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { getGrantOffers, type WaciGrantOffer } from "@/lib/api";

export default function AdminGrantsPage() {
    const [grants, setGrants] = useState<WaciGrantOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const rows = await getGrantOffers();
                setGrants(rows);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load grants");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    return (
        <>
            <SiteHeader />
            <DashboardShell
                title="Grant Offers"
                subtitle="Draft, send, and track every grant offer generated from your project records."
            >
                {loading && <div style={{ color: "var(--muted)" }}>Loading grants...</div>}
                {error && <div style={{ color: "#991b1b" }}>{error}</div>}

                {!loading && !error && (
                    <div style={{ display: "grid", gap: 16 }}>
                        {grants.length === 0 && (
                            <div className="card" style={{ padding: 24, color: "var(--muted)" }}>
                                No grant offers yet.
                            </div>
                        )}

                        {grants.map((grant) => (
                            <div key={grant.id} className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                    <div>
                                        <div className="pill" style={{ marginBottom: 10 }}>{grant.status}</div>
                                        <div style={{ fontSize: 20, fontWeight: 800 }}>{grant.title}</div>
                                        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
                                            {grant.project_title} · {grant.volunteer_email || "Unassigned"}
                                        </div>
                                    </div>
                                    <Link href={`/admin/grants/${grant.id}`} className="btn btn-primary">
                                        Open Grant
                                    </Link>
                                </div>

                                <div className="grid-3">
                                    <Info label="Offer Code" value={grant.offer_code || `Offer ${grant.id}`} />
                                    <Info label="Funding" value={`$${Math.round((grant.total_amount_cents || 0) / 100)}`} />
                                    <Info label="Issued" value={new Date(grant.issued_at).toLocaleDateString()} />
                                </div>
                            </div>
                        ))}
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
