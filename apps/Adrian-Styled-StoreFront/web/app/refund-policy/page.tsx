import InfoPageShell from "@/components/InfoPageShell";

export default function RefundPolicyPage() {
    return (
        <InfoPageShell
            eyebrow="Refund Policy"
            title="Refunds, Returns, and Exchanges"
            intro="We want every Adrian’s Styled Collection purchase to feel considered and satisfying, and we review refund or exchange requests as fairly as possible."
            sections={[
                {
                    title: "Eligibility",
                    paragraphs: [
                        "Return or refund requests should be submitted as soon as possible after delivery and before an item is worn, altered, or damaged.",
                        "Items that are custom, final sale, or part of a styling service may not be eligible for refund unless otherwise stated.",
                    ],
                },
                {
                    title: "Review process",
                    paragraphs: [
                        "Each request is reviewed based on item condition, order status, and the nature of the concern. Approved resolutions may include store credit, exchange support, or a refund when appropriate.",
                    ],
                },
                {
                    title: "Need help?",
                    paragraphs: [
                        "For order issues, sizing concerns, or product quality questions, please contact us through the site contact form so our team can respond directly.",
                    ],
                },
            ]}
        />
    );
}
