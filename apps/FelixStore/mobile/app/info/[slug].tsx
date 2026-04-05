import { useLocalSearchParams } from 'expo-router';

import { InfoPage, type InfoLink, type InfoSection } from '@/components/info-page';

type PageContent = {
    title: string;
    intro: string;
    sections: InfoSection[];
    links: InfoLink[];
};

const sharedLinks: InfoLink[] = [
    { label: 'Profile', description: 'Open profile shortcuts.', href: '/profile' },
    { label: 'Settings', description: 'Open settings and policy links.', href: '/settings' },
    { label: 'Help', description: 'Open the help center.', href: '/help' },
];

const pageContent: Record<string, PageContent> = {
    'about-felix-store': {
        title: 'About Felix Store',
        intro: 'Felix Store is a digital marketplace and service platform that allows users to explore software tools, digital products, services, subscriptions, and custom solutions.',
        sections: [
            {
                title: 'Marketplace and services',
                body: 'Products and services available through Felix Store may include software applications, financial tools, travel planning services, digital resources, consulting services, and marketplace offerings.',
            },
            {
                title: 'Requests, quotes, and payments',
                body: 'Felix Store allows users to request quotes, request services, and place service requests through the platform. Pricing for certain services may be confirmed after review. Payments may be handled through secure payment links, invoices, or offline arrangements depending on the service requested.',
            },
            {
                title: 'Operator',
                body: 'Felix Store is operated by Felix Platform.',
            },
        ],
        links: [
            { label: 'How to Use Felix Store', description: 'See the step-by-step guide.', href: '/info/how-to-use-felix-store' },
            { label: 'Support', description: 'Need direct help?', href: '/info/support' },
            ...sharedLinks,
        ],
    },
    'how-to-use-felix-store': {
        title: 'How to Use Felix Store',
        intro: 'Browse, request, confirm, and receive updates — all inside Felix Store.',
        sections: [
            {
                title: 'Steps',
                body: '• Browse products and services in the store.\n• Add items to your request list.\n• Submit a quote request with your details.\n• Our team reviews your request and confirms pricing.\n• You receive a quote or invoice.\n• Once approved, your order or service is scheduled or delivered.',
            },
            {
                title: 'What to expect',
                body: 'Some products may be digital downloads, services, subscriptions, or consultations.',
            },
        ],
        links: [
            { label: 'Support', description: 'Get help if you are stuck.', href: '/info/support' },
            { label: 'Privacy Policy', description: 'Review data handling details.', href: '/info/privacy-policy' },
            ...sharedLinks,
        ],
    },
    'privacy-policy': {
        title: 'Privacy Policy',
        intro: 'Felix Store respects your privacy. We collect only the information necessary to provide services and respond to quote requests.',
        sections: [
            {
                title: 'Information we may collect',
                body: '• Name\n• Email address\n• Phone number\n• Delivery address\n• Service request details\n• Order and booking information',
            },
            {
                title: 'How information is used',
                body: 'We do not sell your personal information. Information is used only for service fulfillment, communication, and platform improvements.',
            },
            {
                title: 'Privacy questions',
                body: 'For privacy inquiries, contact support through the Support page.',
            },
        ],
        links: [
            { label: 'Terms of Use', description: 'Review the app usage terms.', href: '/info/terms-of-use' },
            { label: 'Support', description: 'Contact support for privacy questions.', href: '/info/support' },
            ...sharedLinks,
        ],
    },
    'terms-of-use': {
        title: 'Terms of Use',
        intro: 'By using Felix Store, you agree to the following:',
        sections: [
            {
                title: 'Terms',
                body: '• Products and services may require quote approval before final pricing.\n• Delivery times and service schedules may vary.\n• Payments may be handled via invoice, secure payment link, or approved payment method.\n• Digital products are non-refundable unless otherwise stated.\n• Services may be rescheduled based on availability.\n• Felix Platform reserves the right to refuse service for misuse of the platform.\n• Use of the app constitutes acceptance of these terms.',
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
        intro: 'If you need help with orders, quote requests, services, subscriptions, or technical issues, support is available in-app.',
        sections: [
            {
                title: 'Support contact',
                body: 'Email: support@felixplatforms.com\nPhone: 240-664-2270\nSupport hours: Monday – Friday',
            },
            {
                title: 'Need more help?',
                body: 'You can also submit a support request through the app.',
            },
        ],
        links: [
            { label: 'Help', description: 'Open the in-app help page.', href: '/help' },
            { label: 'How to Use Felix Store', description: 'Review the usage guide.', href: '/info/how-to-use-felix-store' },
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
