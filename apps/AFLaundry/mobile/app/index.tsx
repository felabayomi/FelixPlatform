import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    createLaundryBooking,
    fetchLaundryServices,
    respondToLaundryQuote,
    trackLaundryBookings,
    type LaundryBooking,
    type LaundryProduct,
} from '@/services/laundry-api';

const serviceSteps = [
    {
        title: 'Choose a service',
        text: 'Pick the care that fits your wardrobe, household, or weekly routine.',
    },
    {
        title: 'Request a quote',
        text: 'Share your schedule, location, and laundry details so we can review the job properly.',
    },
    {
        title: 'Approve and schedule',
        text: 'Once the team confirms the quote, pickup and delivery are arranged with you directly.',
    },
];

const trustCards = [
    {
        title: 'Handled with care',
        text: 'Every order is treated with attention to fabric, finish, and presentation.',
    },
    {
        title: 'Pickup convenience',
        text: 'Doorstep pickup and drop-off make laundry day feel effortless.',
    },
    {
        title: 'Reliable turnaround',
        text: 'Easy scheduling and dependable service you can build into your week.',
    },
];

const laundryQuickActions = [
    'Schedule Pickup',
    'Request Laundry Service',
    'Request Quote',
    'Subscribe to Weekly Service',
] as const;

const formatPrice = (value: LaundryProduct['price']) => {
    if (value === null || value === undefined || value === '') {
        return 'Price on request';
    }

    const amount = Number(value);
    return Number.isNaN(amount) ? String(value) : `$${amount.toFixed(2)}`;
};

const formatServiceMeta = (service: LaundryProduct) => {
    const details: string[] = [];

    if (service.price_type) {
        details.push(String(service.price_type).replace(/_/g, ' '));
    }

    if (service.unit) {
        details.push(String(service.unit));
    }

    return details.length ? details.join(' • ') : 'Flexible pricing';
};

const shortenText = (value: string, limit = 110) =>
    value.length > limit ? `${value.slice(0, limit).trim()}…` : value;

const getServiceActionLabel = (service: LaundryProduct) => {
    if (service.action_label?.trim()) {
        return service.action_label.trim();
    }

    return 'Request Quote';
};

const formatStatusLabel = (value?: string | null) => {
    if (!value) {
        return 'Pending';
    }

    return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function HomeScreen() {
    const [services, setServices] = useState<LaundryProduct[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
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
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [trackingPhone, setTrackingPhone] = useState('');
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingResults, setTrackingResults] = useState<LaundryBooking[]>([]);
    const [trackingError, setTrackingError] = useState('');
    const [respondingBookingId, setRespondingBookingId] = useState('');
    const [failedServiceImageIds, setFailedServiceImageIds] = useState<Record<string, boolean>>({});

    const loadServices = async () => {
        setFailedServiceImageIds({});
        setLoading(true);
        setError('');

        try {
            const data = await fetchLaundryServices();
            setServices(data);
            setSelectedServiceId((current) => current || String(data[0]?.id || ''));
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Unable to load services right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadServices();
    }, []);

    const selectedService = useMemo(
        () => services.find((service) => String(service.id) === String(selectedServiceId)) ?? null,
        [services, selectedServiceId],
    );

    const handleSelectService = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        setMessage('');
        setError('');
        setRequestModalVisible(true);
    };

    const handleQuickAction = (action: (typeof laundryQuickActions)[number]) => {
        setMessage('');
        setError('');

        if (action === 'Subscribe to Weekly Service') {
            setSpecialInstructions((current) => current || 'Interested in subscribing to weekly laundry service.');
        }

        if (!selectedServiceId && services[0]?.id) {
            setSelectedServiceId(String(services[0].id));
        }

        setRequestModalVisible(true);
    };

    const loadTracking = async (phoneOverride?: string) => {
        const phoneToUse = String(phoneOverride ?? trackingPhone).trim();

        if (!phoneToUse) {
            setTrackingError('Enter the phone number used for your request to track it.');
            return;
        }

        setTrackingLoading(true);
        setTrackingError('');

        try {
            const data = await trackLaundryBookings(phoneToUse);
            setTrackingResults(data);
        } catch (err) {
            console.error(err);
            setTrackingError(err instanceof Error ? err.message : 'Unable to load tracking right now.');
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedServiceId || !contactName.trim() || !contactPhone.trim() || !contactEmail.trim() || !pickupAddress.trim()) {
            setError('Please choose a service and fill in your contact details, including email, plus the pickup address.');
            setMessage('');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
            setError('Please enter a valid email address for quote updates and scheduling emails.');
            setMessage('');
            return;
        }

        setSubmitting(true);
        setError('');
        setMessage('');

        try {
            const createdBooking = await createLaundryBooking({
                product_id: selectedServiceId,
                service_date: serviceDate,
                service_window: serviceWindow,
                pickup_address: pickupAddress,
                delivery_address: deliveryAddress || pickupAddress,
                contact_name: contactName,
                contact_phone: contactPhone,
                contact_email: contactEmail,
                weight_estimate: weightEstimate,
                special_instructions: specialInstructions,
            });

            setMessage(`Quote request #${createdBooking.id} has been sent. We will email your quote and pickup updates shortly.`);
            setWeightEstimate('');
            setSpecialInstructions('');
            setTrackingPhone(contactPhone);
            setTrackingResults([
                {
                    ...createdBooking,
                    product_name: selectedService?.name || 'Laundry service',
                },
            ]);
            setRequestModalVisible(false);
            void loadTracking(contactPhone);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Unable to submit your quote request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBookingResponse = async (
        bookingId: string,
        phone: string,
        decision: 'accept' | 'decline',
    ) => {
        const phoneToUse = String(phone || trackingPhone).trim();

        if (!phoneToUse) {
            setTrackingError('Enter the phone number used for the request before responding to the quote.');
            return;
        }

        setRespondingBookingId(bookingId);
        setTrackingError('');

        try {
            const updatedBooking = await respondToLaundryQuote(bookingId, phoneToUse, decision);
            setTrackingResults((current) =>
                current.map((item) => (item.id === bookingId ? { ...item, ...updatedBooking } : item))
            );
            setMessage(
                decision === 'accept'
                    ? `Quote #${bookingId} accepted. The team can now move it into pickup and delivery scheduling.`
                    : `Quote #${bookingId} was declined and has been updated.`
            );
        } catch (err) {
            console.error(err);
            setTrackingError(err instanceof Error ? err.message : 'Unable to update your quote response right now.');
        } finally {
            setRespondingBookingId('');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <Text style={styles.kicker}>A & F LAUNDRY</Text>
                    <Text style={styles.heroTitle}>Fresh clothes without the stress.</Text>
                    <Text style={styles.heroSubtitle}>
                        Choose your care, request a quote, and let the team confirm pickup and delivery around your schedule.
                    </Text>

                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Pickup & delivery</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Careful handling</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Reliable turnaround</Text>
                        </View>
                    </View>

                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How it works</Text>
                    {serviceSteps.map((step, index) => (
                        <View key={step.title} style={styles.stepCard}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>{index + 1}</Text>
                            </View>
                            <View style={styles.stepTextWrap}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDescription}>{step.text}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose your service</Text>
                    <Text style={styles.sectionSubtitle}>
                        Select the option that fits your weekly routine or special care needs, then request a tailored quote.
                    </Text>

                    <View style={styles.quickActionWrap}>
                        {laundryQuickActions.map((action) => (
                            <Pressable
                                key={action}
                                style={styles.quickActionButton}
                                onPress={() => handleQuickAction(action)}>
                                <Text style={styles.quickActionButtonText}>{action}</Text>
                            </Pressable>
                        ))}
                    </View>

                    {loading ? (
                        <View style={styles.statusCard}>
                            <ActivityIndicator size="small" color="#0EA5E9" />
                            <Text style={styles.statusText}>Loading services...</Text>
                        </View>
                    ) : null}

                    {!loading
                        ? services.map((service) => {
                            const selected = String(selectedServiceId) === String(service.id);

                            return (
                                <View key={service.id} style={[styles.serviceCard, selected ? styles.serviceCardActive : null]}>
                                    {service.image_url && !failedServiceImageIds[String(service.id)] ? (
                                        <Image
                                            source={{ uri: service.image_url }}
                                            style={styles.serviceImage}
                                            resizeMode="cover"
                                            onError={() => {
                                                setFailedServiceImageIds((current) => ({
                                                    ...current,
                                                    [String(service.id)]: true,
                                                }));
                                            }}
                                        />
                                    ) : (
                                        <View style={styles.serviceImageFallback}>
                                            <Text style={styles.serviceImageFallbackText}>{service.name}</Text>
                                        </View>
                                    )}

                                    <View style={styles.serviceHeader}>
                                        <View style={styles.serviceTitleWrap}>
                                            <Text style={styles.serviceName}>{service.name}</Text>
                                            <Text style={styles.serviceMeta}>{formatServiceMeta(service)}</Text>
                                        </View>
                                        <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
                                    </View>

                                    <Text style={styles.serviceDescription}>
                                        {shortenText(service.description || 'Fresh, careful, and convenient laundry service tailored to your routine.')}
                                    </Text>

                                    <View style={styles.serviceActionRow}>
                                        <Text style={styles.selectedLabel}>
                                            {selected ? 'Selected for your request' : 'Tap below to request this service'}
                                        </Text>
                                        <Pressable
                                            style={styles.serviceActionButton}
                                            onPress={() => handleSelectService(String(service.id))}>
                                            <Text style={styles.serviceActionButtonText}>
                                                {getServiceActionLabel(service)}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        })
                        : null}
                </View>

                {message ? <Text style={styles.successText}>{message}</Text> : null}
                {error && !requestModalVisible ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.trackingCard}>
                    <Text style={styles.sectionTitle}>Track your quote / order</Text>
                    <Text style={styles.sectionSubtitle}>
                        Enter your phone number to check the latest quote, pickup, and delivery status.
                    </Text>

                    <View style={styles.trackingInputRow}>
                        <TextInput
                            style={[styles.input, styles.trackingInput]}
                            placeholder="Phone number used for your request"
                            placeholderTextColor="#94A3B8"
                            value={trackingPhone}
                            onChangeText={setTrackingPhone}
                            keyboardType="phone-pad"
                        />
                        <Pressable style={styles.trackingButton} onPress={() => void loadTracking()}>
                            <Text style={styles.trackingButtonText}>Check</Text>
                        </Pressable>
                    </View>

                    {trackingLoading ? (
                        <View style={styles.statusCard}>
                            <ActivityIndicator size="small" color="#0EA5E9" />
                            <Text style={styles.statusText}>Checking your latest request...</Text>
                        </View>
                    ) : null}

                    {trackingError ? <Text style={styles.errorText}>{trackingError}</Text> : null}

                    {!trackingLoading && !trackingError && trackingResults.length === 0 ? (
                        <Text style={styles.trackingEmptyText}>Your latest quote and laundry status will appear here after you submit or search.</Text>
                    ) : null}

                    {trackingResults.map((booking) => (
                        <View key={booking.id} style={styles.trackingResultCard}>
                            <View style={styles.trackingResultHeader}>
                                <View style={styles.trackingResultTextWrap}>
                                    <Text style={styles.trackingResultTitle}>{booking.product_name || 'Laundry order'}</Text>
                                    <Text style={styles.trackingResultMeta}>Tracking ID #{booking.id}</Text>
                                </View>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>{formatStatusLabel(booking.status)}</Text>
                                </View>
                            </View>

                            <Text style={styles.trackingDetailText}>
                                Pickup: {booking.service_date || 'To be confirmed'} {booking.service_window ? `• ${booking.service_window}` : ''}
                            </Text>
                            <Text style={styles.trackingDetailText}>
                                Address: {booking.pickup_address || booking.delivery_address || 'Address pending'}
                            </Text>
                            <Text style={styles.trackingDetailText}>
                                Quoted price: {formatPrice(booking.quoted_price)}
                            </Text>
                            {booking.admin_notes ? (
                                <Text style={styles.trackingDetailText}>Admin notes: {booking.admin_notes}</Text>
                            ) : null}
                            {booking.assigned_driver ? (
                                <Text style={styles.trackingDetailText}>Driver: {booking.assigned_driver}</Text>
                            ) : null}

                            {booking.status === 'quoted' ? (
                                <View style={styles.trackingActionRow}>
                                    <Pressable
                                        style={[styles.trackingActionButton, styles.acceptButton]}
                                        onPress={() => void handleBookingResponse(booking.id, booking.contact_phone || trackingPhone, 'accept')}
                                        disabled={respondingBookingId === booking.id}>
                                        <Text style={styles.trackingActionButtonText}>
                                            {respondingBookingId === booking.id ? 'Updating...' : 'Accept Quote'}
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.trackingActionButton, styles.declineButton]}
                                        onPress={() => void handleBookingResponse(booking.id, booking.contact_phone || trackingPhone, 'decline')}
                                        disabled={respondingBookingId === booking.id}>
                                        <Text style={styles.trackingActionButtonText}>Decline</Text>
                                    </Pressable>
                                </View>
                            ) : null}
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why customers love A & F</Text>
                    {trustCards.map((item) => (
                        <View key={item.title} style={styles.trustCard}>
                            <Text style={styles.trustTitle}>{item.title}</Text>
                            <Text style={styles.trustText}>{item.text}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {requestModalVisible ? (
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeaderRow}>
                            <View style={styles.selectionSummaryTextWrap}>
                                <Text style={styles.sectionTitle}>Schedule Pickup / Request Quote</Text>
                                <Text style={styles.formSubtitle}>
                                    {selectedService
                                        ? `You’re requesting a quote for: ${selectedService.name}`
                                        : 'Choose a service above to start your quote request.'}
                                </Text>
                            </View>
                            <Pressable style={styles.modalCloseButton} onPress={() => setRequestModalVisible(false)}>
                                <Text style={styles.modalCloseButtonText}>Close</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.modalScroll}
                            contentContainerStyle={styles.modalScrollContent}
                            showsVerticalScrollIndicator={false}>
                            {selectedService ? (
                                <View style={styles.selectionSummaryCard}>
                                    <View style={styles.selectionSummaryTextWrap}>
                                        <Text style={styles.selectionSummaryTitle}>{selectedService.name}</Text>
                                        <Text style={styles.selectionSummaryMeta}>{formatServiceMeta(selectedService)}</Text>
                                    </View>
                                </View>
                            ) : null}

                            <TextInput
                                style={styles.input}
                                placeholder="Full name"
                                placeholderTextColor="#94A3B8"
                                value={contactName}
                                onChangeText={setContactName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone number"
                                placeholderTextColor="#94A3B8"
                                value={contactPhone}
                                onChangeText={setContactPhone}
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                placeholderTextColor="#94A3B8"
                                value={contactEmail}
                                onChangeText={setContactEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    placeholder="Service date"
                                    placeholderTextColor="#94A3B8"
                                    value={serviceDate}
                                    onChangeText={setServiceDate}
                                />
                                <TextInput
                                    style={[styles.input, styles.halfInput]}
                                    placeholder="Time window"
                                    placeholderTextColor="#94A3B8"
                                    value={serviceWindow}
                                    onChangeText={setServiceWindow}
                                />
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Pickup address"
                                placeholderTextColor="#94A3B8"
                                value={pickupAddress}
                                onChangeText={setPickupAddress}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Delivery address"
                                placeholderTextColor="#94A3B8"
                                value={deliveryAddress}
                                onChangeText={setDeliveryAddress}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Estimated weight (lbs)"
                                placeholderTextColor="#94A3B8"
                                value={weightEstimate}
                                onChangeText={setWeightEstimate}
                                keyboardType="decimal-pad"
                            />
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Special instructions (gate code, delicate items, folding notes...)"
                                placeholderTextColor="#94A3B8"
                                value={specialInstructions}
                                onChangeText={setSpecialInstructions}
                                multiline
                            />

                            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                                <Text style={styles.submitButtonText}>{submitting ? 'Sending...' : 'Request Quote'}</Text>
                            </Pressable>

                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </ScrollView>
                    </View>
                </View>
            ) : null}
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
        padding: 18,
        borderRadius: 24,
        backgroundColor: '#082F49',
        gap: 12,
    },
    kicker: {
        color: '#7DD3FC',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    heroTitle: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    heroSubtitle: {
        color: '#E0F2FE',
        fontSize: 15,
        lineHeight: 22,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: '#0EA5E9',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    quickActionWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickActionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: '#0C4A6E',
    },
    quickActionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        gap: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    sectionSubtitle: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
    stepCard: {
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    stepBadge: {
        width: 30,
        height: 30,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DBF4FF',
    },
    stepBadgeText: {
        color: '#0369A1',
        fontWeight: '800',
    },
    stepTextWrap: {
        flex: 1,
        gap: 2,
    },
    stepTitle: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 15,
    },
    stepDescription: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusText: {
        color: '#334155',
    },
    serviceCard: {
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    serviceImage: {
        width: '100%',
        height: 160,
        borderRadius: 14,
        backgroundColor: '#E2E8F0',
    },
    serviceImageFallback: {
        width: '100%',
        height: 160,
        borderRadius: 14,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    serviceImageFallbackText: {
        color: '#1D4ED8',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    serviceCardActive: {
        borderColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'flex-start',
    },
    serviceTitleWrap: {
        flex: 1,
        gap: 3,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    serviceMeta: {
        color: '#64748B',
        fontSize: 13,
    },
    servicePrice: {
        color: '#0369A1',
        fontWeight: '800',
    },
    serviceDescription: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
    selectedLabel: {
        color: '#0284C7',
        fontSize: 13,
        fontWeight: '700',
    },
    serviceActionRow: {
        gap: 8,
        marginTop: 2,
    },
    serviceActionButton: {
        paddingVertical: 11,
        borderRadius: 12,
        backgroundColor: '#082F49',
        alignItems: 'center',
    },
    serviceActionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    formCard: {
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        gap: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    formSubtitle: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },

    selectionSummaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    selectionSummaryTextWrap: {
        flex: 1,
        gap: 2,
    },
    selectionSummaryTitle: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '700',
    },
    selectionSummaryMeta: {
        color: '#0369A1',
        fontSize: 13,
    },
    selectionSummaryPrice: {
        color: '#0369A1',
        fontWeight: '800',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 11,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
    },
    halfInput: {
        flex: 1,
    },
    multilineInput: {
        minHeight: 92,
        textAlignVertical: 'top',
    },
    submitButton: {
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        marginTop: 4,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
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
    trackingCard: {
        gap: 10,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    trackingInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    trackingInput: {
        flex: 1,
    },
    trackingButton: {
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#082F49',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    trackingEmptyText: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 20,
    },
    trackingResultCard: {
        gap: 6,
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    trackingResultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        alignItems: 'flex-start',
    },
    trackingResultTextWrap: {
        flex: 1,
        gap: 2,
    },
    trackingResultTitle: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '700',
    },
    trackingResultMeta: {
        color: '#64748B',
        fontSize: 13,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: '#DBF4FF',
    },
    statusBadgeText: {
        color: '#0369A1',
        fontSize: 12,
        fontWeight: '800',
    },
    trackingDetailText: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
    trackingActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    trackingActionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    acceptButton: {
        backgroundColor: '#166534',
    },
    declineButton: {
        backgroundColor: '#991B1B',
    },
    trackingActionButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
        elevation: 50,
    },
    modalCard: {
        maxHeight: '88%',
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalCloseButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: '#E2E8F0',
    },
    modalCloseButtonText: {
        color: '#0F172A',
        fontWeight: '700',
    },
    modalScroll: {
        flexGrow: 0,
    },
    modalScrollContent: {
        padding: 16,
        gap: 10,
    },
    trustCard: {
        gap: 6,
        padding: 14,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    trustTitle: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '700',
    },
    trustText: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
});
