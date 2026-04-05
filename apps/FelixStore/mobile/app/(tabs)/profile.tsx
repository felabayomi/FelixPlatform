import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const profileGroups = [
    {
        title: 'Profile',
        links: [
            { label: 'About Felix Store', description: 'Learn what Felix Store offers and how it works.', href: '/info/about-felix-store' as const },
            { label: 'How to Use Felix Store', description: 'See the steps for browsing, requesting quotes, and tracking updates.', href: '/info/how-to-use-felix-store' as const },
        ],
    },
    {
        title: 'Settings',
        links: [
            { label: 'Settings', description: 'Open your in-app settings and policy links.', href: '/settings' as const },
            { label: 'Privacy Policy', description: 'Review how customer information is handled.', href: '/info/privacy-policy' as const },
            { label: 'Terms of Use', description: 'Read the app usage terms for Felix Store.', href: '/info/terms-of-use' as const },
        ],
    },
    {
        title: 'Help',
        links: [
            { label: 'Help', description: 'Open the Felix Store help center in-app.', href: '/help' as const },
            { label: 'Support', description: 'Find the best way to contact the Felix team.', href: '/info/support' as const },
        ],
    },
];

export default function ProfileScreen() {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
                <ThemedText style={styles.eyebrow}>PROFILE</ThemedText>
                <ThemedText type="title" style={styles.title}>
                    Account, settings, and help in one place.
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    Open Felix Store information pages, support resources, privacy details, and help tools without leaving the app.
                </ThemedText>
            </View>

            {profileGroups.map((group) => (
                <View key={group.title} style={styles.sectionCard}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        {group.title}
                    </ThemedText>
                    <View style={styles.linkGrid}>
                        {group.links.map((link) => (
                            <Link key={link.label} href={link.href as Href} asChild>
                                <Pressable style={styles.linkButton}>
                                    <ThemedText style={styles.linkTitle}>{link.label}</ThemedText>
                                    <ThemedText style={styles.linkText}>{link.description}</ThemedText>
                                </Pressable>
                            </Link>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 18,
        gap: 10,
    },
    eyebrow: {
        color: '#93C5FD',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    title: {
        color: '#FFFFFF',
        lineHeight: 38,
    },
    subtitle: {
        color: '#CBD5E1',
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
    },
    linkGrid: {
        gap: 10,
    },
    linkButton: {
        gap: 4,
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    linkTitle: {
        color: '#1D4ED8',
        fontWeight: '700',
    },
    linkText: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
    },
});
