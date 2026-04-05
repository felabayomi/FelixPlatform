import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const links = [
    { label: 'How to Use A & F Laundry', description: 'Step-by-step usage guide.', href: '/info/how-to-use-a-and-f-laundry' },
    { label: 'Support', description: 'Open support contact details.', href: '/info/support' },
    { label: 'Privacy Policy', description: 'Review privacy information.', href: '/info/privacy-policy' },
    { label: 'Profile', description: 'Back to profile and shortcuts.', href: '/profile' },
];

export default function HelpScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>HELP</Text>
                    <Text style={styles.title}>A & F Laundry help</Text>
                    <Text style={styles.subtitle}>
                        Find quick guidance for choosing services, submitting requests, reviewing policies, and reaching support without leaving the app.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Using the app</Text>
                    <Text style={styles.sectionBody}>
                        Select a laundry service, enter the service details and pickup information, submit a service request or quote request, and then track the status using the same phone number you used when submitting.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Need direct support?</Text>
                    <View style={styles.linkGrid}>
                        {links.map((link) => (
                            <Link key={link.label} href={link.href as never} asChild>
                                <Pressable style={styles.linkButton}>
                                    <Text style={styles.linkTitle}>{link.label}</Text>
                                    <Text style={styles.linkText}>{link.description}</Text>
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
    subtitle: {
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
