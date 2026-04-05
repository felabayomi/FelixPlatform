import { useLocalSearchParams } from 'expo-router';

import { InfoPage, type InfoLink, type InfoSection } from '@/components/info-page';

type PageContent = {
    title: string;
    intro: string;
    sections: InfoSection[];
    links: InfoLink[];
};

const sharedLinks: InfoLink[] = [
    { label: 'Profile', description: 'Open your app shortcuts and business info pages.', href: '/profile' },
    { label: 'Settings', description: 'Review policies, privacy details, and support links.', href: '/settings' },
    { label: 'Help', description: 'Open the help center and support tools.', href: '/help' },
];

const pageContent: Record<string, PageContent> = {
    'about-felix-store': {
        title: 'About Felix Store',
        intro: 'Felix Store is a business-focused storefront built around practical solutions, digital products, app ideas, and execution-ready opportunities.',
        sections: [
            {
                title: 'A solution-driven storefront',
                body: 'Felix Store is designed for people who want useful offers they can apply, launch, adapt, or scale — not just browse and forget.',
            },
            {
                title: 'What you can access here',
                body: 'Offerings may include digital assets, operational tools, app-backed solutions, consulting support, and business blueprints created to solve real problems.',
            },
            {
                title: 'Built within Felix Platform',
                body: 'Felix Store is operated by Felix Platform as part of a broader ecosystem focused on innovation, business enablement, and practical execution.',
            },
        ],
        links: [
            { label: 'How to Use Felix Store', description: 'See how to move from need to request.', href: '/info/how-to-use-felix-store' },
            { label: 'Support', description: 'Need direct help with a request or product?', href: '/info/support' },
            ...sharedLinks,
        ],
    },
    'how-to-use-felix-store': {
        title: 'How to Use Felix Store',
        intro: 'Move from business need to a usable product, quote, or next-step solution — all inside Felix Store.',
        sections: [
            {
                title: 'Steps',
                body: '• Browse categories such as products, services, tools, and digital resources.\n• Select something ready-made or request a more tailored version.\n• Submit your request with the details of what you need.\n• Felix Platform reviews the request and confirms pricing, access, or delivery direction.\n• You receive the quote, product, support path, or next-step guidance needed to move forward.\n• Use it, adapt it, or build on it within your own project or business.',
            },
            {
                title: 'What to expect',
                body: 'Depending on the offer, fulfillment may include a download, a scoped service, a consultation, or a business-ready framework.',
            },
        ],
        links: [
            { label: 'Support', description: 'Get help if you need help moving forward.', href: '/info/support' },
            { label: 'Privacy Policy', description: 'Review how request data is handled.', href: '/info/privacy-policy' },
            ...sharedLinks,
        ],
    },
    'privacy-policy': {
        title: 'Privacy Policy',
        intro: 'Felix Store respects your privacy and uses only the information needed to fulfill requests, deliver services, and support your experience.',
        sections: [
            {
                title: 'Information we may collect',
                body: '• Name\n• Email address\n• Phone number\n• Delivery address\n• Service request details\n• Order and booking information',
            },
            {
                title: 'How information is used',
                body: 'We do not sell your personal information. Information is used only for fulfillment, communication, support, and service improvement.',
            },
            {
                title: 'Privacy questions',
                body: 'For privacy questions or data concerns, contact support through the Support page.',
            },
        ],
        links: [
            { label: 'Terms of Use', description: 'Review the app usage terms.', href: '/info/terms-of-use' },
            { label: 'Support', description: 'Contact support for privacy-related questions.', href: '/info/support' },
            ...sharedLinks,
        ],
    },
    'terms-of-use': {
        title: 'Terms of Use',
        intro: 'By using Felix Store, you agree to the following terms:',
        sections: [
            {
                title: 'Terms',
                body: '• Products and services may require quote approval before final pricing.\n• Delivery timelines and service schedules may vary by offer.\n• Payments may be handled via invoice, secure payment link, or another approved method.\n• Digital products are non-refundable unless otherwise stated.\n• Services may be rescheduled based on availability and scope.\n• Felix Platform reserves the right to refuse service for misuse of the platform.\n• Continued use of the app constitutes acceptance of these terms.',
            },
        ],
        links: [
            { label: 'Privacy Policy', description: 'See privacy details.', href: '/info/privacy-policy' },
            { label: 'Support', description: 'Ask questions about the terms.', href: '/info/support' },
            ...sharedLinks,
        ],
    },
    support: {
        title: 'Support',
        intro: 'If you need help with a request, digital product, consulting inquiry, or technical issue, support is available in-app.',
        sections: [
            {
                title: 'Support contact',
                body: 'Email: support@felixplatforms.com\nPhone: 240-664-2270\nSupport hours: Monday – Friday',
            },
            {
                title: 'Need more help?',
                body: 'Open the Help page to submit a support request directly through the app and receive email confirmation from the platform team.',
            },
        ],
        links: [
            { label: 'Help', description: 'Open the in-app help page.', href: '/help' },
            { label: 'How to Use Felix Store', description: 'Review the step-by-step usage guide.', href: '/info/how-to-use-felix-store' },
            ...sharedLinks,
        ],
    },
};

export default function StoreInfoPage() {
    const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
    const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;
    const page = pageContent[resolvedSlug || ''] || {
        title: 'Felix Store Info',
        intro: 'This page is not available yet, but the rest of the Felix Store support pages are ready in-app.',
        sections: [
            {
                title: 'Available pages',
                body: 'Use the links below to open About Felix Store, How to Use Felix Store, Privacy Policy, Terms of Use, and Support.',
            },
        ],
        links: sharedLinks,
    };

    return (
        <InfoPage
            eyebrow="FELIX STORE"
            title={page.title}
            intro={page.intro}
            sections={page.sections}
            links={page.links}
        />
    );
}
