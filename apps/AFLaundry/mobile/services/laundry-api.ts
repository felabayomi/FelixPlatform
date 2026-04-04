import { Platform } from 'react-native';

export type LaundryProduct = {
    id: string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    type?: string | null;
    price_type?: string | null;
    unit?: string | null;
    image_url?: string | null;
    active?: boolean;
};

export type BookingPayload = {
    product_id: string;
    service_date: string;
    service_window: string;
    pickup_address: string;
    delivery_address: string;
    contact_name: string;
    contact_phone: string;
    weight_estimate?: string | number;
    special_instructions?: string;
};

const devFallbackUrl = Platform.select({
    android: 'http://10.0.2.2:5000',
    ios: 'http://localhost:5000',
    default: 'http://localhost:5000',
});

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? devFallbackUrl : 'https://replace-me-with-your-api-url.com');

export async function fetchLaundryServices(): Promise<LaundryProduct[]> {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
        throw new Error(`Laundry services request failed with ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        return [];
    }

    return data.filter((item) => {
        const type = String(item?.type || '').toLowerCase();
        const name = String(item?.name || '').toLowerCase();

        return item?.active !== false && (
            type === 'laundry' ||
            name.includes('laundry') ||
            name.includes('cleaning') ||
            name.includes('wash') ||
            name.includes('ironing')
        );
    });
}

export async function createLaundryBooking(payload: BookingPayload) {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...payload,
            app_name: 'A & F Laundry',
            status: 'pending',
        }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Booking request failed with ${response.status}`);
    }

    return response.json();
}
