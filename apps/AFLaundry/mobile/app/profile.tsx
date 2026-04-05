import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const profileGroups = [
    {
        title: 'Profile',
        links: [
            { label: 'About A & F Laundry', description: 'Learn what A & F Laundry offers and how it works.', href: '/info/about-a-and-f-laundry' },
            { label: 'How to Use A & F Laundry', description: 'See the service request and pickup process.', href: '/info/how-to-use-a-and-f-laundry' },
        ],
    },
    {
        title: 'Settings',
        links: [
            { label: 'Settings', description: 'Open your in-app settings and policy links.', href: '/settings' },
            { label: 'Privacy Policy', description: 'Review how service and pickup information is handled.', href: '/info/privacy-policy' },
            { label: 'Terms of Use', description: 'Read the app usage terms for A & F Laundry.', href: '/info/terms-of-use' },
        ],
    },
    {
        title: 'Help',
        links: [
            { label: 'Help', description: 'Open the in-app help center.', href: '/help' },
            { label: 'Support', description: 'Find the best way to contact the team.', href: '/info/support' },
        ],
    },
];

export default function ProfileScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>PROFILE</Text>
                    <Text style={styles.title}>Account, settings, and help in one place.</Text>
                    <Text style={styles.subtitle}>
                        Open A & F Laundry information pages, support resources, privacy details, and help tools without leaving the app.
                    </Text>
                </View>

                {profileGroups.map((group) => (
                    <View key={group.title} style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>{group.title}</Text>
                        <View style={styles.linkGrid}>
                            {group.links.map((link) => (
                                <Link key={link.label} href={link.href as never} asChild>
                                    <Pressable style={styles.linkButton}>
                                        <Text style={styles.linkTitle}>{link.label}</Text>
                                        <Text style={styles.linkText}>{link.description}</Text>
                                    </Pressable>
                                </Link>
                            ))}
                        </View>
                    </View>
                ))}
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
