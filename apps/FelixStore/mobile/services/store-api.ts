export type Product = {
    id: string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    category_id?: string | null;
    category_name?: string | null;
    type?: string | null;
    price_type?: string | null;
    unit?: string | null;
    subscription_interval?: string | null;
    action_label?: string | null;
    image_url?: string | null;
    active?: boolean;
};

export type CartOrderItem = {
    product: Product;
    quantity: number;
};

export type CreateOrderPayload = {
    items: CartOrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    deliveryType: 'delivery' | 'pickup';
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryAddress?: string;
    notes?: string;
};

export type QuoteRequestResponse = {
    id: string;
    status?: string | null;
    quoted_price?: number | string | null;
    admin_notes?: string | null;
    product_id?: string | null;
    product_name?: string | null;
    app_name?: string | null;
    contact_name?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    preferred_fulfillment?: string | null;
    reference_estimate?: string | null;
    created_at?: string | null;
    customer_action?: string | null;
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

const hostedApiUrl = 'https://felix-platform-backend.onrender.com';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || hostedApiUrl).replace(/\/$/, '');

const isLaundryProduct = (item: Partial<Product>) => {
    const searchableText = [
        item?.name,
        item?.description,
        item?.category_name,
        item?.type,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return searchableText.includes('laundry')
        || searchableText.includes('dry cleaning')
        || searchableText.includes('wash & fold')
        || searchableText.includes('wash and fold')
        || searchableText.includes('ironing')
        || searchableText.includes('linen care')
        || searchableText.includes('comforter cleaning')
        || searchableText.includes('curtain cleaning')
        || searchableText.includes('shoe cleaning')
        || searchableText.includes('uniform cleaning');
};

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
    return `${API_BASE_URL}${normalizedPath}`;
};

export async function fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
        throw new Error(`Products request failed with ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .filter((item) => item?.active !== false && !isLaundryProduct(item))
        .map((item) => ({
            ...item,
            image_url: toAbsoluteImageUrl(item?.image_url),
        }));
}

export async function createOrder(payload: CreateOrderPayload): Promise<QuoteRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/quote-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            product_id: payload.items[0]?.product.id,
            quantity: payload.items.reduce((sum, item) => sum + item.quantity, 0),
            status: 'pending',
            details: [
                'Quote request submitted from Felix Store',
                `Customer: ${payload.customerName}`,
                `Phone: ${payload.customerPhone}`,
                `Email: ${payload.customerEmail}`,
                payload.deliveryAddress ? `Address: ${payload.deliveryAddress}` : null,
                `Preferred fulfillment: ${payload.deliveryType}`,
                'Requested items:',
                ...payload.items.map((item) => `- ${item.product.name} x${item.quantity}`),
                payload.notes ? `Request details: ${payload.notes}` : null,
            ]
                .filter(Boolean)
                .join('\n'),
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Quote request failed with ${response.status}`);
    }

    return response.json();
}

export async function trackQuoteRequests(contactPhone: string): Promise<QuoteRequestResponse[]> {
    const normalizedPhone = String(contactPhone || '').trim();

    if (!normalizedPhone) {
        return [];
    }

    const params = new URLSearchParams({
        phone: normalizedPhone,
        app_name: 'Felix Store',
    });

    const response = await fetch(`${API_BASE_URL}/quote-requests/track?${params.toString()}`);

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Tracking request failed with ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

export async function respondToQuoteRequest(
    quoteRequestId: string,
    contactPhone: string,
    decision: 'accept' | 'decline',
): Promise<QuoteRequestResponse> {
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

export async function submitSupportRequest(payload: SupportRequestPayload): Promise<SupportRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/support-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            app_name: 'Felix Store',
            contact_name: payload.contactName,
            contact_email: payload.contactEmail,
            contact_phone: payload.contactPhone,
            subject: payload.subject || 'Support request',
            message: payload.message,
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Support request failed with ${response.status}`);
    }

    return response.json();
}
