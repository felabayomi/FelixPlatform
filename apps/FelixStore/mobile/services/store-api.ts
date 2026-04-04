import { Platform } from 'react-native';

export type Product = {
    id: string;
    name: string;
    description?: string | null;
    price?: string | number | null;
    category_id?: string | null;
    type?: string | null;
    price_type?: string | null;
    unit?: string | null;
    subscription_interval?: string | null;
    image_url?: string | null;
    active?: boolean;
};

const devFallbackUrl = Platform.select({
    android: 'http://10.0.2.2:5000',
    ios: 'http://localhost:5000',
    default: 'http://localhost:5000',
});

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? devFallbackUrl : 'https://replace-me-with-your-api-url.com');

const toAbsoluteImageUrl = (value?: string | null) => {
    if (!value) {
        return null;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
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
        .filter((item) => item?.active !== false)
        .map((item) => ({
            ...item,
            image_url: toAbsoluteImageUrl(item?.image_url),
        }));
}
