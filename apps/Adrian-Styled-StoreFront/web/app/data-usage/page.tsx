import InfoPageShell from "@/components/InfoPageShell";

export default function DataUsagePage() {
    return (
        <InfoPageShell
            eyebrow="Data Usage"
            title="How We Use Data"
            intro="We use customer data carefully to support fulfillment, communication, and service quality across Adrian’s Styled Collection."
            sections={[
                {
                    title: "Operational use",
                    paragraphs: [
                        "Order and contact information is used to fulfill purchases, send payment or shipping updates, and answer support messages.",
                    ],
                },
                {
                    title: "Service improvement",
                    paragraphs: [
                        "We may review request trends and site activity in aggregate to improve product selection, styling services, and customer experience.",
                    ],
                },
                {
                    title: "Retention and protection",
                    paragraphs: [
                        "We keep business records only as needed for store operations, customer support, and legal or accounting obligations, and we limit access to authorized systems and providers.",
                    ],
                },
            ]}
        />
    );
}
