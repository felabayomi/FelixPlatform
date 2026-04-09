export type Product = {
    id: string;
    title?: string;
    name?: string;
    slug?: string | null;
    description?: string;
    short_description?: string;
    long_description?: string;
    price?: number;
    compare_at_price?: number | null;
    featured?: boolean;
    active?: boolean;
    images?: string[];
    image?: string | null;
    inventory_count?: number;
    app_name?: string;
    storefront_key?: string;
};
