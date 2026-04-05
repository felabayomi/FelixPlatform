import { Link, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type InfoLink = {
    label: string;
    description?: string;
    href: string;
};

export type InfoSection = {
    title: string;
    body: string;
};

type InfoPageProps = {
    eyebrow?: string;
    title: string;
    intro: string;
    sections: InfoSection[];
    links?: InfoLink[];
};

export function InfoPage({ eyebrow, title, intro, sections, links = [] }: InfoPageProps) {
    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
                {eyebrow ? <ThemedText style={styles.eyebrow}>{eyebrow}</ThemedText> : null}
                <ThemedText type="title" style={styles.title}>
                    {title}
                </ThemedText>
                <ThemedText style={styles.intro}>{intro}</ThemedText>
            </View>

            {sections.map((section) => (
                <View key={section.title} style={styles.sectionCard}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        {section.title}
                    </ThemedText>
                    <ThemedText style={styles.sectionBody}>{section.body}</ThemedText>
                </View>
            ))}

            {links.length ? (
                <View style={styles.sectionCard}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Open in app
                    </ThemedText>
                    <View style={styles.linkGrid}>
                        {links.map((link) => (
                            <Link key={link.label} href={link.href as Href} asChild>
                                <Pressable style={styles.linkButton}>
                                    <ThemedText style={styles.linkLabel}>{link.label}</ThemedText>
                                    {link.description ? (
                                        <ThemedText style={styles.linkDescription}>{link.description}</ThemedText>
                                    ) : null}
                                </Pressable>
                            </Link>
                        ))}
                    </View>
                </View>
            ) : null}
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
    intro: {
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
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    linkLabel: {
        color: '#1D4ED8',
        fontWeight: '700',
    },
    linkDescription: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
    },
});
