import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { submitSupportRequest } from '../services/store-api';

const links = [
    { label: 'How to Use Felix Store', description: 'Step-by-step usage guide.', href: '/info/how-to-use-felix-store' },
    { label: 'Support', description: 'Open support contact details.', href: '/info/support' },
    { label: 'Privacy Policy', description: 'Review privacy information.', href: '/info/privacy-policy' },
    { label: 'Profile', description: 'Back to profile and shortcuts.', href: '/profile' },
];

type FormState = {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
};

const initialForm: FormState = {
    name: '',
    email: '',
    phone: '',
    subject: 'Support request',
    message: '',
};

export default function HelpScreen() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const updateField = (field: keyof FormState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            Alert.alert('Missing information', 'Please enter your name, email, and message before submitting.');
            return;
        }

        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            await submitSupportRequest({
                contactName: form.name,
                contactEmail: form.email,
                contactPhone: form.phone,
                subject: form.subject,
                message: form.message,
            });

            setStatusMessage('Support request sent. A confirmation email should arrive shortly.');
            setForm((current) => ({
                ...current,
                subject: 'Support request',
                message: '',
            }));

            Alert.alert('Request sent', 'Your support request was sent successfully.');
        } catch (error) {
            Alert.alert('Unable to send', error instanceof Error ? error.message : 'Please try again in a moment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>HELP</Text>
                    <Text style={styles.title}>Felix Store help</Text>
                    <Text style={styles.subtitle}>
                        Find quick guidance for browsing the store, requesting quotes, reviewing policies, and reaching support without leaving the app.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Using the store</Text>
                    <Text style={styles.sectionBody}>
                        Browse the catalog, tap the product action button, complete the in-app request form, and then track the status of your quote with the same phone number you used when submitting.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Submit a support request</Text>
                    <Text style={styles.sectionBody}>
                        Send your issue directly to support and receive a confirmation email using the same support flow behind the platform.
                    </Text>

                    <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#94A3B8" value={form.name} onChangeText={(value) => updateField('name', value)} />
                    <TextInput style={styles.input} placeholder="Your email" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(value) => updateField('email', value)} />
                    <TextInput style={styles.input} placeholder="Phone number (optional)" placeholderTextColor="#94A3B8" keyboardType="phone-pad" value={form.phone} onChangeText={(value) => updateField('phone', value)} />
                    <TextInput style={styles.input} placeholder="Subject" placeholderTextColor="#94A3B8" value={form.subject} onChangeText={(value) => updateField('subject', value)} />
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Tell us how we can help" placeholderTextColor="#94A3B8" multiline textAlignVertical="top" value={form.message} onChangeText={(value) => updateField('message', value)} />

                    <Pressable style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
                        <Text style={styles.submitButtonText}>{isSubmitting ? 'Sending…' : 'Send support request'}</Text>
                    </Pressable>

                    {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}
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
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
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
        fontSize: 20,
        fontWeight: '800',
    },
    sectionBody: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 21,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    textArea: {
        minHeight: 110,
    },
    submitButton: {
        backgroundColor: '#1D4ED8',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    successText: {
        color: '#166534',
        fontSize: 13,
        lineHeight: 19,
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
