import { InfoPage } from '@/components/info-page';

export default function SettingsScreen() {
    return (
        <InfoPage
            eyebrow="SETTINGS"
            title="Felix Store settings"
            intro="Use the in-app settings area to review privacy details, policies, and support information whenever you need it."
            sections={[
                {
                    title: 'Privacy & security',
                    body: 'Review the privacy policy and terms of use before placing requests. Felix Store keeps this information available in-app for quick reference.',
                },
                {
                    title: 'Support access',
                    body: 'If you need help with a product, request, or account issue, you can open the help and support pages directly from here.',
                },
            ]}
            links={[
                { label: 'Privacy Policy', description: 'See how data is handled.', href: '/info/privacy-policy' },
                { label: 'Terms of Use', description: 'Read the app usage terms.', href: '/info/terms-of-use' },
                { label: 'Support', description: 'Contact the Felix team.', href: '/info/support' },
                { label: 'Help', description: 'Open the help center.', href: '/help' },
            ]}
        />
    );
}
