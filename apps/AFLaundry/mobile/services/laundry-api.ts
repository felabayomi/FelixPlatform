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

export type BookingPayload = {
    product_id: string;
    service_date: string;
    service_window: string;
    pickup_address: string;
    delivery_address: string;
    contact_name: string;
    contact_phone: string;
    contact_email: string;
    weight_estimate?: string | number;
    special_instructions?: string;
};

const hostedApiUrl = 'https://felix-platform-backend.onrender.com';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || hostedApiUrl).replace(/\/$/, '');

const toAbsoluteImageUrl = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const rawValue = String(value).trim();
    if (!rawValue) {
        return null;
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
    return `${API_BASE_URL}${normalizedPath}`;
};

export async function fetchLaundryServices(): Promise<LaundryProduct[]> {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
        throw new Error(`Laundry services request failed with ${response.status}`);
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
                type === 'laundry' ||
                name.includes('laundry') ||
                name.includes('cleaning') ||
                name.includes('wash') ||
                name.includes('ironing')
            );
        })
        .map((item) => ({
            ...item,
            image_url: toAbsoluteImageUrl(item?.image_url),
        }));
}

export async function createLaundryBooking(payload: BookingPayload): Promise<LaundryBooking> {
    const response = await fetch(`${API_BASE_URL}/quote-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: payload.product_id,
            quantity: payload.weight_estimate || 1,
            status: 'pending',
            details: [
                'Quote request submitted from A & F Laundry',
                `Customer: ${payload.contact_name}`,
                `Phone: ${payload.contact_phone}`,
                `Email: ${payload.contact_email}`,
                `Service date: ${payload.service_date}`,
                `Window: ${payload.service_window}`,
                `Pickup address: ${payload.pickup_address}`,
                payload.delivery_address ? `Delivery address: ${payload.delivery_address}` : null,
                payload.weight_estimate ? `Weight estimate: ${payload.weight_estimate}` : null,
                payload.special_instructions ? `Instructions: ${payload.special_instructions}` : null,
            ]
                .filter(Boolean)
                .join('\n'),
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Quote request failed with ${response.status}`);
    }

    const quote = await response.json();
    return {
        ...quote,
        product_id: payload.product_id,
        contact_name: payload.contact_name,
        contact_phone: payload.contact_phone,
        contact_email: payload.contact_email,
        service_date: payload.service_date,
        service_window: payload.service_window,
        pickup_address: payload.pickup_address,
        delivery_address: payload.delivery_address,
    };
}

export async function respondToLaundryQuote(
    quoteRequestId: string,
    contactPhone: string,
    decision: 'accept' | 'decline',
): Promise<LaundryBooking> {
    const response = await fetch(`${API_BASE_URL}/quote-requests/${quoteRequestId}/respond`, {
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
        const message = await response.text();
        throw new Error(message || `Quote response failed with ${response.status}`);
    }

    return response.json();
}

export async function trackLaundryBookings(contactPhone: string): Promise<LaundryBooking[]> {
    const normalizedPhone = String(contactPhone || '').trim();

    if (!normalizedPhone) {
        return [];
    }

    const params = new URLSearchParams({
        phone: normalizedPhone,
        app_name: 'A & F Laundry',
    });

    const response = await fetch(`${API_BASE_URL}/quote-requests/track?${params.toString()}`);

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Tracking request failed with ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
}
