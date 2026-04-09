import InfoPageShell from "@/components/InfoPageShell";

export default function AboutPage() {
    return (
        <InfoPageShell
            eyebrow="About"
            title="About Adrian’s Styled Collection"
            intro="Adrian’s Styled Collection is a boutique fashion destination built around confidence, elegance, and standout personal style."
            sections={[
                {
                    title: "Our approach",
                    paragraphs: [
                        "We curate elevated looks that feel polished, expressive, and easy to wear for dinners, events, travel, and everyday confidence.",
                        "Each collection is chosen to help customers feel refined without losing individuality or comfort.",
                    ],
                },
                {
                    title: "What we offer",
                    paragraphs: [
                        "From flowing statement pieces to styling support, Adrian’s Styled Collection blends boutique fashion with personal guidance.",
                        "We focus on quality presentation, thoughtful service, and a luxury storefront experience from browsing to checkout.",
                    ],
                },
                {
                    title: "Customer care",
                    paragraphs: [
                        "Questions about sizing, styling, orders, or availability are always welcome through our contact form or support email.",
                    ],
                },
            ]}
        />
    );
}
