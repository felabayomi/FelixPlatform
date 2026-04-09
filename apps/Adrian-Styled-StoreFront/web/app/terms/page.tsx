import InfoPageShell from "@/components/InfoPageShell";

export default function TermsPage() {
    return (
        <InfoPageShell
            eyebrow="Terms"
            title="Terms of Use"
            intro="By using this site, you agree to use Adrian’s Styled Collection lawfully and respectfully."
            sections={[
                {
                    title: "Store use",
                    paragraphs: [
                        "You agree not to misuse the site, interfere with its operation, or attempt unauthorized access to customer or store systems.",
                    ],
                },
                {
                    title: "Orders and availability",
                    paragraphs: [
                        "Product availability, styling services, and pricing may change over time. We reserve the right to correct listing errors or cancel orders when necessary.",
                    ],
                },
                {
                    title: "Content and branding",
                    paragraphs: [
                        "The storefront design, text, product presentation, and branding elements remain the property of Adrian’s Styled Collection and may not be reused without permission.",
                    ],
                },
            ]}
        />
    );
}
