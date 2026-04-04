import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    API_BASE_URL,
    createLaundryBooking,
    fetchLaundryServices,
    type LaundryProduct,
} from '@/services/laundry-api';

const formatPrice = (value: LaundryProduct['price']) => {
    if (value === null || value === undefined || value === '') {
        return 'Price on request';
    }

    const amount = Number(value);
    return Number.isNaN(amount) ? String(value) : `$${amount.toFixed(2)}`;
};

export default function HomeScreen() {
    const [services, setServices] = useState<LaundryProduct[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [serviceDate, setServiceDate] = useState('2026-04-10');
    const [serviceWindow, setServiceWindow] = useState('9AM-12PM');
    const [pickupAddress, setPickupAddress] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [weightEstimate, setWeightEstimate] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadServices = async () => {
        setLoading(true);
        setError('');

        try {
            const data = await fetchLaundryServices();
            setServices(data);
            setSelectedServiceId((current) => current || data[0]?.id || '');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Unable to load services right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    const handleSubmit = async () => {
        if (!selectedServiceId || !contactName.trim() || !contactPhone.trim() || !pickupAddress.trim()) {
            setError('Please choose a service and fill in the required contact and address fields.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            await createLaundryBooking({
                product_id: selectedServiceId,
                service_date: serviceDate,
                service_window: serviceWindow,
                pickup_address: pickupAddress,
                delivery_address: deliveryAddress || pickupAddress,
                contact_name: contactName,
                contact_phone: contactPhone,
                weight_estimate: weightEstimate,
                special_instructions: specialInstructions,
            });

            setMessage('Laundry booking sent successfully.');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Unable to submit booking.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>A & F Laundry</Text>
                <Text style={styles.subtitle}>Version 2.0.0 · connected to {API_BASE_URL}</Text>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Laundry services</Text>
                    {loading ? <ActivityIndicator size="small" color="#2563EB" /> : null}
                    {services.map((service) => (
                        <Pressable
                            key={service.id}
                            style={[
                                styles.serviceButton,
                                selectedServiceId === service.id ? styles.serviceButtonActive : null,
                            ]}
                            onPress={() => setSelectedServiceId(service.id)}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <Text style={styles.serviceMeta}>
                                {formatPrice(service.price)} · {service.price_type || 'fixed'}
                                {service.unit ? ` / ${service.unit}` : ''}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Book pickup / delivery</Text>
                    <TextInput style={styles.input} placeholder="Contact name" value={contactName} onChangeText={setContactName} />
                    <TextInput style={styles.input} placeholder="Phone number" value={contactPhone} onChangeText={setContactPhone} />
                    <TextInput style={styles.input} placeholder="Service date (YYYY-MM-DD)" value={serviceDate} onChangeText={setServiceDate} />
                    <TextInput style={styles.input} placeholder="Service window (e.g. 9AM-12PM)" value={serviceWindow} onChangeText={setServiceWindow} />
                    <TextInput style={styles.input} placeholder="Pickup address" value={pickupAddress} onChangeText={setPickupAddress} />
                    <TextInput style={styles.input} placeholder="Delivery address" value={deliveryAddress} onChangeText={setDeliveryAddress} />
                    <TextInput style={styles.input} placeholder="Estimated weight (lbs)" value={weightEstimate} onChangeText={setWeightEstimate} keyboardType="numeric" />
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        placeholder="Special instructions"
                        value={specialInstructions}
                        onChangeText={setSpecialInstructions}
                        multiline
                    />

                    <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                        <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Book Laundry Service'}</Text>
                    </Pressable>

                    {message ? <Text style={styles.successText}>{message}</Text> : null}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    container: {
        padding: 16,
        gap: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0F172A',
    },
    subtitle: {
        color: '#475569',
    },
    card: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    serviceButton: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
    },
    serviceButtonActive: {
        borderColor: '#2563EB',
        backgroundColor: '#DBEAFE',
    },
    serviceName: {
        fontWeight: '600',
        color: '#0F172A',
    },
    serviceMeta: {
        color: '#475569',
        marginTop: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
    },
    multilineInput: {
        minHeight: 88,
        textAlignVertical: 'top',
    },
    submitButton: {
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#2563EB',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    successText: {
        color: '#166534',
        backgroundColor: '#DCFCE7',
        padding: 10,
        borderRadius: 10,
    },
    errorText: {
        color: '#991B1B',
        backgroundColor: '#FEE2E2',
        padding: 10,
        borderRadius: 10,
    },
});
