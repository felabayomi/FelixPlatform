import { redirect } from "next/navigation";

export default async function GrantOfferPage({
    params,
}: {
    params: Promise<{ offerId: string }>;
}) {
    const { offerId } = await params;
    redirect(`/grantee/grant/${offerId}`);
}
