import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

type InfoLink = {
    label: string;
    description?: string;
    href: string;
};

type InfoSection = {
    title: string;
    body: string;
};

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
    'about-a-and-f-laundry': {
        title: 'About A & F Laundry',
        intro: 'A & F Laundry provides laundry pickup, wash and fold, dry cleaning, ironing, and delivery services for households, businesses, and short-term rental properties.',
        sections: [
            {
                title: 'Services offered',
                body: 'Customers can schedule pickups, request laundry services, and receive quotes through the app.',
            },
            {
                title: 'Pricing',
                body: 'Laundry services may be priced per pound, per item, per load, or through subscription plans. Final pricing may be confirmed after review of the service request.',
            },
        ],
        links: [
            { label: 'How to Use A & F Laundry', description: 'See the step-by-step guide.', href: '/info/how-to-use-a-and-f-laundry' },
            { label: 'Support', description: 'Need direct help?', href: '/info/support' },
            ...sharedLinks,
        ],
    },
    'how-to-use-a-and-f-laundry': {
        title: 'How to Use A & F Laundry',
        intro: 'Select a service, send your request, and receive pickup and delivery updates directly in the app.',
        sections: [
            {
                title: 'Steps',
                body: '• Select a laundry service.\n• Enter service details and pickup/delivery information.\n• Submit a service request or quote request.\n• We confirm pricing and schedule pickup.\n• Laundry is processed and delivered back to you.\n• You may also subscribe to recurring laundry services.',
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
        intro: 'A & F Laundry respects your privacy. We collect only the information necessary to provide services and respond to pickup and quote requests.',
        sections: [
            {
                title: 'Information we may collect',
                body: '• Name\n• Email address\n• Phone number\n• Pickup and delivery addresses\n• Laundry service request details\n• Order and booking information',
            },
            {
                title: 'How information is used',
                body: 'We do not sell your personal information. Information is used only for service fulfillment, communication, scheduling pickups and deliveries, and platform improvements.',
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
        intro: 'By using A & F Laundry, you agree to the following:',
        sections: [
            {
                title: 'Terms',
                body: '• Weight estimates may be adjusted after laundry is processed.\n• Missed pickup fees may apply.\n• Delivery scheduling depends on availability and route timing.\n• Subscription billing may apply for recurring services.\n• Service limitations may apply based on garment type, condition, or request size.',
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
            { label: 'How to Use A & F Laundry', description: 'Review the usage guide.', href: '/info/how-to-use-a-and-f-laundry' },
            ...sharedLinks,
        ],
    },
};

export default function LaundryInfoPage() {
    const { slug } = useLocalSearchParams<{ slug?: string | string[] }>();
    const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;
    const page = pageContent[resolvedSlug || ''] || {
        title: 'A & F Laundry Info',
        intro: 'This page is not available yet, but the rest of the A & F Laundry support pages are ready in-app.',
        sections: [
            {
                title: 'Available pages',
                body: 'Use the links below to open About A & F Laundry, How to Use A & F Laundry, Privacy Policy, Terms of Use, and Support.',
            },
        ],
        links: sharedLinks,
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>A & F LAUNDRY</Text>
                    <Text style={styles.title}>{page.title}</Text>
                    <Text style={styles.intro}>{page.intro}</Text>
                </View>

                {page.sections.map((section) => (
                    <View key={section.title} style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionBody}>{section.body}</Text>
                    </View>
                ))}

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Open in app</Text>
                    <View style={styles.linkGrid}>
                        {page.links.map((link) => (
                            <Link key={link.label} href={link.href as never} asChild>
                                <Pressable style={styles.linkButton}>
                                    <Text style={styles.linkTitle}>{link.label}</Text>
                                    {link.description ? <Text style={styles.linkText}>{link.description}</Text> : null}
                                </Pressable>
                            </Link>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    screen: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    heroCard: {
        backgroundColor: '#082F49',
        borderRadius: 24,
        padding: 18,
        gap: 10,
    },
    eyebrow: {
        color: '#7DD3FC',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
    },
    intro: {
        color: '#E0F2FE',
        fontSize: 15,
        lineHeight: 22,
    },
    sectionCard: {
        gap: 10,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        color: '#0F172A',
        fontSize: 20,
        fontWeight: '800',
    },
    sectionBody: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 21,
    },
    linkGrid: {
        gap: 10,
    },
    linkButton: {
        gap: 4,
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    linkTitle: {
        color: '#0369A1',
        fontWeight: '700',
    },
    linkText: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
    },
});
