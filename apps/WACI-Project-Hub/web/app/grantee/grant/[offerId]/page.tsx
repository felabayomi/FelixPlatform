import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";
import { GrantSummaryCard } from "@/components/waci/grant-summary-card";
import { GrantAcceptanceForm } from "@/components/waci/grant-acceptance-form";
import { getGrantSummaryByOfferId } from "@/lib/waci-server";

export default async function GranteeGrantPage({
    params,
}: {
    params: Promise<{ offerId: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect(`/login?next=/grantee/grant/${(await params).offerId}`);
    }

    const { offerId } = await params;
    const summary = await getGrantSummaryByOfferId(offerId);

    return (
        <>
            <SiteHeader />

            <section className="section">
                <div className="container">
                    <div style={{ marginBottom: 20 }}>
                        <div className="pill">Grant Offer ID: {offerId}</div>
                        <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", marginBottom: 8 }}>
                            Grantee acceptance interface
                        </h1>
                        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 760 }}>
                            Review your grant offer, understand expectations, and sign acceptance below.
                        </p>
                    </div>

                    <div className="grid-2">
                        <GrantSummaryCard summary={summary} />
                        <GrantAcceptanceForm offerId={offerId} />
                    </div>
                </div>
            </section>

            <SiteFooter />
        </>
    );
}
