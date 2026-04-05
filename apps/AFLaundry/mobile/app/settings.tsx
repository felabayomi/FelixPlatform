import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const links = [
    { label: 'Privacy Policy', description: 'See how laundry and pickup data is handled.', href: '/info/privacy-policy' },
    { label: 'Terms of Use', description: 'Read the app usage terms.', href: '/info/terms-of-use' },
    { label: 'Support', description: 'Contact the A & F Laundry team.', href: '/info/support' },
    { label: 'Help', description: 'Open the in-app help page.', href: '/help' },
];

export default function SettingsScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>SETTINGS</Text>
                    <Text style={styles.title}>A & F Laundry settings</Text>
                    <Text style={styles.subtitle}>
                        Use the in-app settings area to review privacy details, terms, and support information whenever you need it.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Privacy & service settings</Text>
                    <Text style={styles.sectionBody}>
                        Review the privacy policy and terms of use before placing requests. A & F Laundry keeps this information available in-app for quick reference.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Support access</Text>
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
