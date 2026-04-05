import { InfoPage } from '@/components/info-page';

export default function HelpScreen() {
    return (
        <InfoPage
            eyebrow="HELP"
            title="Felix Store help"
            intro="Find quick guidance for browsing the store, requesting quotes, reviewing policies, and reaching support without leaving the app."
            sections={[
                {
                    title: 'Using the store',
                    body: 'Browse the catalog, tap the product action button, complete the in-app request form, and then track the status of your quote with the same phone number you used when submitting.',
                },
                {
                    title: 'Need direct support?',
                    body: 'If you need assistance with products, pricing, account issues, or request updates, open the support page in-app for the latest contact options.',
                },
            ]}
            links={[
                { label: 'How to Use Felix Store', description: 'Step-by-step usage guide.', href: '/info/how-to-use-felix-store' },
                { label: 'Support', description: 'Open support contact details.', href: '/info/support' },
                { label: 'Privacy Policy', description: 'Review privacy information.', href: '/info/privacy-policy' },
                { label: 'Profile', description: 'Back to profile and shortcuts.', href: '/profile' },
            ]}
        />
    );
}
