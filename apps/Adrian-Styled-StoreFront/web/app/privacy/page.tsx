import InfoPageShell from "@/components/InfoPageShell";

export default function PrivacyPage() {
    return (
        <InfoPageShell
            eyebrow="Privacy"
            title="Privacy Policy"
            intro="We respect your privacy and only use the information needed to operate Adrian’s Styled Collection and support your orders or inquiries."
            sections={[
                {
                    title: "Information we collect",
                    paragraphs: [
                        "We may collect your name, email, phone number, shipping details, and order information when you place an order, request a quote, or contact us.",
                        "We may also receive basic device and browser information used to keep the site secure and functioning properly.",
                    ],
                },
                {
                    title: "How we use your information",
                    paragraphs: [
                        "Your information is used to process purchases, respond to inquiries, send order updates, and improve the customer experience.",
                        "We do not sell your personal information to third parties.",
                    ],
                },
                {
                    title: "Service providers",
                    paragraphs: [
                        "We use trusted providers such as payment processors, hosting platforms, and email delivery services to operate the storefront and customer communications.",
                    ],
                },
            ]}
        />
    );
}
