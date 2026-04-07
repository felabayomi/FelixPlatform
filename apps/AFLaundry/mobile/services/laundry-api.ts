export type LaundryProduct = {
    id: string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    type?: string | null;
    price_type?: string | null;
    unit?: string | null;
    image_url?: string | null;
    action_label?: string | null;
    active?: boolean;
};

export type LaundryBooking = {
    id: string;
    product_id?: string | null;
    product_name?: string | null;
    service_date?: string | null;
    service_window?: string | null;
    pickup_date?: string | null;
    pickup_time?: string | null;
    status?: string | null;
    pickup_address?: string | null;
    delivery_address?: string | null;
    assigned_driver?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    quoted_price?: string | number | null;
    admin_notes?: string | null;
    reference_estimate?: string | null;
    created_at?: string | null;
    customer_action?: string | null;
};

export type AppointmentPayload = {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    dropoffDate: string;
    dropoffTime: string;
    pickupDate?: string;
    pickupTime?: string;
    soapType: string;
    hasHeavyItems?: boolean;
    heavyItemsCount?: number;
    specialInstructions?: string;
};

export type QuoteRequestPayload = {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    serviceType: string;
    preferredDate: string;
    serviceWindow?: string;
    pickupAddress: string;
    deliveryAddress?: string;
    estimatedWeight?: string | number;
    preferredFulfillment?: string;
    notes?: string;
    source?: string;
};

export type SupportRequestPayload = {
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    subject?: string;
    message: string;
};

export type SupportRequestResponse = {
    submitted: boolean;
    app_name?: string;
    admin_email_sent?: boolean;
    customer_email_sent?: boolean;
    notification_recipient?: string | null;
    customer_email_recipient?: string | null;
};

const hostedFelixApiUrl = 'https://felix-platform-backend.onrender.com';
const hostedLaundryApiUrl = 'https://aflaundry.com';

export const FELIX_API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || hostedFelixApiUrl).replace(/\/$/, '');
export const AFLAUNDRY_API_BASE_URL = (
    process.env.EXPO_PUBLIC_AFLAUNDRY_API_URL
    || process.env.EXPO_PUBLIC_AFLAUNDRY_WEB_URL
    || hostedLaundryApiUrl
).replace(/\/$/, '');

const toAbsoluteImageUrl = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const rawValue = String(value).trim();
    if (!rawValue) {
        return null;
    }

    if (/^(data:|blob:)/i.test(rawValue)) {
        return rawValue;
    }

    const protocolMatches = [...rawValue.matchAll(/https?:\/\//gi)];
    if (protocolMatches.length) {
        const urlCandidates = protocolMatches
            .map((match, index) => {
                const start = match.index ?? 0;
                const end = protocolMatches[index + 1]?.index ?? rawValue.length;
                return rawValue.slice(start, end).split(/\s+/)[0].replace(/["'),]+$/g, '');
            })
            .filter(Boolean);

        const preferredCandidate = urlCandidates.find((candidate) => {
            try {
                const parsed = new URL(candidate);
                return Boolean(parsed.hostname) && !/example\.com$/i.test(parsed.hostname);
            } catch {
                return false;
            }
        }) ?? urlCandidates.find((candidate) => {
            try {
                return Boolean(new URL(candidate));
            } catch {
                return false;
            }
        });

        if (preferredCandidate) {
            return preferredCandidate;
        }
    }

    const normalizedPath = rawValue.startsWith('/') ? rawValue : `/${rawValue}`;
    return `${FELIX_API_BASE_URL}${normalizedPath}`;
};

const readApiErrorMessage = async (response: Response, fallbackMessage: string) => {
    try {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const payload = await response.json();
            if (typeof payload === 'string' && payload.trim()) {
                return payload;
            }
            if (payload?.message) {
                return payload.message;
            }
            if (payload?.error) {
                return typeof payload.error === 'string' ? payload.error : fallbackMessage;
            }
        }

        const text = await response.text();
        return text || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
};

const toTrackingRecord = (
    item: Record<string, any>,
    defaults: Partial<LaundryBooking> = {},
): LaundryBooking => ({
    ...item,
    ...defaults,
    id: String(item?.id ?? defaults.id ?? ''),
    product_id: item?.product_id ?? defaults.product_id ?? null,
    product_name: item?.product_name ?? defaults.product_name ?? 'Laundry Service',
    service_date: item?.service_date ?? item?.dropoffDate ?? defaults.service_date ?? null,
    service_window: item?.service_window ?? item?.dropoffTime ?? defaults.service_window ?? null,
    pickup_date: item?.pickup_date ?? item?.pickupDate ?? defaults.pickup_date ?? null,
    pickup_time: item?.pickup_time ?? item?.pickupTime ?? defaults.pickup_time ?? null,
    status: item?.status ?? defaults.status ?? 'pending',
    pickup_address: item?.pickup_address ?? defaults.pickup_address ?? null,
    delivery_address: item?.delivery_address ?? defaults.delivery_address ?? null,
    assigned_driver: item?.assigned_driver ?? defaults.assigned_driver ?? null,
    contact_name: item?.contact_name ?? item?.customerName ?? defaults.contact_name ?? null,
    contact_phone: item?.contact_phone ?? item?.customerPhone ?? defaults.contact_phone ?? null,
    contact_email: item?.contact_email ?? item?.customerEmail ?? defaults.contact_email ?? null,
    quoted_price: item?.quoted_price ?? defaults.quoted_price ?? null,
    admin_notes: item?.admin_notes ?? defaults.admin_notes ?? null,
    reference_estimate: item?.reference_estimate ?? defaults.reference_estimate ?? null,
    created_at: item?.created_at ?? item?.createdAt ?? defaults.created_at ?? null,
    customer_action: item?.customer_action ?? defaults.customer_action ?? null,
});

export async function fetchLaundryServices(): Promise<LaundryProduct[]> {
    const response = await fetch(`${FELIX_API_BASE_URL}/products`);

    if (!response.ok) {
        const fallbackMessage = response.status === 503
            ? 'Laundry services are temporarily unavailable while the database connection recovers. Your products are not deleted. Please try again shortly.'
            : `Laundry services request failed with ${response.status}`;
        throw new Error(await readApiErrorMessage(response, fallbackMessage));
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .filter((item) => {
            const type = String(item?.type || '').toLowerCase();
            const name = String(item?.name || '').toLowerCase();

            return item?.active !== false && (
                type === 'laundry'
                || name.includes('laundry')
                || name.includes('cleaning')
                || name.includes('wash')
                || name.includes('ironing')
            );
        })
        .map((item) => ({
            ...item,
            image_url: toAbsoluteImageUrl(item?.image_url),
        }));
}

export async function createLaundryAppointment(payload: AppointmentPayload): Promise<LaundryBooking> {
    const response = await fetch(`${AFLAUNDRY_API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, `Booking request failed with ${response.status}`));
    }

    const appointment = await response.json();
    return toTrackingRecord(appointment, {
        product_name: 'Scheduled Laundry Booking',
    });
}

export async function requestLaundryQuote(payload: QuoteRequestPayload): Promise<LaundryBooking> {
    const response = await fetch(`${AFLAUNDRY_API_BASE_URL}/api/quotes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...payload,
            source: payload.source || 'mobile',
        }),
    });

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, `Quote request failed with ${response.status}`));
    }

    const quote = await response.json();
    return toTrackingRecord(quote, {
        product_name: payload.serviceType || 'Laundry Quote',
        service_date: payload.preferredDate,
        service_window: payload.serviceWindow ?? null,
        pickup_address: payload.pickupAddress,
        delivery_address: payload.deliveryAddress ?? null,
        contact_name: payload.customerName,
        contact_phone: payload.customerPhone,
        contact_email: payload.customerEmail,
        reference_estimate: 'Quote pending review',
    });
}

export async function respondToLaundryQuote(
    quoteRequestId: string,
    contactPhone: string,
    decision: 'accept' | 'decline',
): Promise<LaundryBooking> {
    const response = await fetch(`${FELIX_API_BASE_URL}/quote-requests/${quoteRequestId}/respond`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contact_phone: contactPhone,
            decision,
        }),
    });

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, `Quote response failed with ${response.status}`));
    }

    return toTrackingRecord(await response.json());
}

export async function trackLaundryBookings(contactPhone: string): Promise<LaundryBooking[]> {
    const normalizedPhone = String(contactPhone || '').trim();

    if (!normalizedPhone) {
        return [];
    }

    const quoteParams = new URLSearchParams({
        phone: normalizedPhone,
        app_name: 'A & F Laundry',
    });
    const appointmentParams = new URLSearchParams({
        phone: normalizedPhone,
    });

    const [quotesResult, appointmentsResult] = await Promise.allSettled([
        fetch(`${FELIX_API_BASE_URL}/quote-requests/track?${quoteParams.toString()}`),
        fetch(`${AFLAUNDRY_API_BASE_URL}/api/appointments?${appointmentParams.toString()}`),
    ]);

    const results: LaundryBooking[] = [];
    const errors: string[] = [];

    if (quotesResult.status === 'fulfilled') {
        if (quotesResult.value.ok) {
            const data = await quotesResult.value.json();
            if (Array.isArray(data)) {
                results.push(...data.map((item) => toTrackingRecord(item)));
            }
        } else {
            errors.push(await readApiErrorMessage(quotesResult.value, `Tracking request failed with ${quotesResult.value.status}`));
        }
    } else {
        errors.push(quotesResult.reason instanceof Error ? quotesResult.reason.message : 'Unable to reach quote tracking right now.');
    }

    if (appointmentsResult.status === 'fulfilled') {
        if (appointmentsResult.value.ok) {
            const data = await appointmentsResult.value.json();
            if (Array.isArray(data)) {
                results.push(...data.map((item) => toTrackingRecord(item, {
                    product_name: 'Scheduled Laundry Booking',
                })));
            }
        } else if (appointmentsResult.value.status !== 404) {
            errors.push(await readApiErrorMessage(appointmentsResult.value, `Appointment tracking failed with ${appointmentsResult.value.status}`));
        }
    } else {
        errors.push(appointmentsResult.reason instanceof Error ? appointmentsResult.reason.message : 'Unable to reach booking tracking right now.');
    }

    if (!results.length && errors.length) {
        throw new Error(errors[0]);
    }

    return results.sort((left, right) => {
        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
        return rightTime - leftTime;
    });
}

export async function submitSupportRequest(payload: SupportRequestPayload): Promise<SupportRequestResponse> {
    const response = await fetch(`${FELIX_API_BASE_URL}/support-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app_name: 'A & F Laundry',
            contact_name: payload.contactName,
            contact_email: payload.contactEmail,
            contact_phone: payload.contactPhone,
            subject: payload.subject || 'Support request',
            message: payload.message,
        }),
    });

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, `Support request failed with ${response.status}`));
    }

    return response.json();
}
