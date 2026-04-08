import axios from "axios";
import type { Product } from "@/types/product";

export type StorefrontContentService = {
    id: string;
    title: string;
    text: string;
};

export type StorefrontContent = {
    heroEyebrow: string;
    heroTitle: string;
    heroText: string;
    heroPrimaryLabel: string;
    heroPrimaryLink: string;
    heroSecondaryLabel: string;
    heroSecondaryLink: string;
    heroImageOne: string;
    heroImageTwo: string;
    heroImageThree: string;
    heroImageFour: string;
    heroImages: string[];
    featuredEyebrow: string;
    featuredTitle: string;
    featuredText: string;
    servicesEyebrow: string;
    servicesTitle: string;
    servicesText: string;
    services: StorefrontContentService[];
    successEyebrow: string;
    successTitle: string;
    successText: string;
    footerTitle: string;
    footerText: string;
    footerSubtext: string;
    supportEmail: string;
};

export const DEFAULT_STOREFRONT_CONTENT: StorefrontContent = {
    heroEyebrow: "Adrian Store",
    heroTitle: "Elegant kaftans for effortless statement style.",
    heroText: "Discover bold, flowing silhouettes curated by Adrian — perfect for dinners, travel, special occasions, and everyday confidence.",
    heroPrimaryLabel: "Shop the collection",
    heroPrimaryLink: "/shop",
    heroSecondaryLabel: "Explore services",
    heroSecondaryLink: "/services",
    heroImageOne: "/products/chic-green-kaftan.svg",
    heroImageTwo: "/products/wild-elegance-leopard-kaftan.svg",
    heroImageThree: "",
    heroImageFour: "",
    heroImages: ["/products/chic-green-kaftan.svg", "/products/wild-elegance-leopard-kaftan.svg"],
    featuredEyebrow: "Featured pieces",
    featuredTitle: "Fresh arrivals from Adrian Store",
    featuredText: "Curated looks designed for comfort, movement, and standout style.",
    servicesEyebrow: "Services",
    servicesTitle: "Boutique styling support",
    servicesText: "Adrian’s Styled Collection is more than a storefront — it is a curated fashion experience centered on effortless elegance.",
    services: [
        {
            id: "style-curation",
            title: "Style Curation",
            text: "Get help selecting standout pieces and coordinated looks that match your event, mood, or travel plans.",
        },
        {
            id: "wardrobe-refresh",
            title: "Wardrobe Refresh",
            text: "Build a fresh capsule of bold, confidence-first outfits with Adrian’s boutique eye and flowing silhouettes.",
        },
        {
            id: "special-occasion-styling",
            title: "Special Occasion Styling",
            text: "Choose elegant kaftans and elevated statement looks for celebrations, dinners, gatherings, and getaways.",
        },
    ],
    successEyebrow: "Thank you",
    successTitle: "Your Adrian order is on its way",
    successText: "Your checkout has been submitted successfully. We will send updates to the email address you used at checkout.",
    footerTitle: "Adrian's Styled Collection",
    footerText: "Curated statement pieces, flowing silhouettes, and confidence-first style.",
    footerSubtext: "Powered by Felix Platform's shared storefront, checkout, and support tools.",
    supportEmail: "order@shopwithadrian.com",
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
const STOREFRONT_PARAMS = {
    app_name: "Adrian Store",
    storefront_key: "adrian-store",
};

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

const toText = (value: unknown, fallback = "") => {
    if (value === undefined || value === null) {
        return fallback;
    }

    const normalized = String(value).trim();
    return normalized || fallback;
};

const normalizeStorefrontContent = (value: unknown): StorefrontContent => {
    const incoming = typeof value === "object" && value !== null
        ? (value as Partial<StorefrontContent>)
        : {};

    const incomingServices = Array.isArray(incoming.services) && incoming.services.length
        ? incoming.services
        : DEFAULT_STOREFRONT_CONTENT.services;
    const heroImageOne = toText(incoming.heroImageOne, DEFAULT_STOREFRONT_CONTENT.heroImageOne);
    const heroImageTwo = toText(incoming.heroImageTwo, DEFAULT_STOREFRONT_CONTENT.heroImageTwo);
    const heroImageThree = toText(incoming.heroImageThree, DEFAULT_STOREFRONT_CONTENT.heroImageThree);
    const heroImageFour = toText(incoming.heroImageFour, DEFAULT_STOREFRONT_CONTENT.heroImageFour);
    const heroImages = [heroImageOne, heroImageTwo, heroImageThree, heroImageFour]
        .filter(Boolean)
        .filter((entry, index, items) => items.indexOf(entry) === index);

    return {
        heroEyebrow: toText(incoming.heroEyebrow, DEFAULT_STOREFRONT_CONTENT.heroEyebrow),
        heroTitle: toText(incoming.heroTitle, DEFAULT_STOREFRONT_CONTENT.heroTitle),
        heroText: toText(incoming.heroText, DEFAULT_STOREFRONT_CONTENT.heroText),
        heroPrimaryLabel: toText(incoming.heroPrimaryLabel, DEFAULT_STOREFRONT_CONTENT.heroPrimaryLabel),
        heroPrimaryLink: toText(incoming.heroPrimaryLink, DEFAULT_STOREFRONT_CONTENT.heroPrimaryLink),
        heroSecondaryLabel: toText(incoming.heroSecondaryLabel, DEFAULT_STOREFRONT_CONTENT.heroSecondaryLabel),
        heroSecondaryLink: toText(incoming.heroSecondaryLink, DEFAULT_STOREFRONT_CONTENT.heroSecondaryLink),
        heroImageOne,
        heroImageTwo,
        heroImageThree,
        heroImageFour,
        heroImages,
        featuredEyebrow: toText(incoming.featuredEyebrow, DEFAULT_STOREFRONT_CONTENT.featuredEyebrow),
        featuredTitle: toText(incoming.featuredTitle, DEFAULT_STOREFRONT_CONTENT.featuredTitle),
        featuredText: toText(incoming.featuredText, DEFAULT_STOREFRONT_CONTENT.featuredText),
        servicesEyebrow: toText(incoming.servicesEyebrow, DEFAULT_STOREFRONT_CONTENT.servicesEyebrow),
        servicesTitle: toText(incoming.servicesTitle, DEFAULT_STOREFRONT_CONTENT.servicesTitle),
        servicesText: toText(incoming.servicesText, DEFAULT_STOREFRONT_CONTENT.servicesText),
        services: DEFAULT_STOREFRONT_CONTENT.services.map((service, index) => {
            const incomingService = incomingServices[index] || service;

            return {
                id: toText(incomingService?.id, service.id),
                title: toText(incomingService?.title, service.title),
                text: toText(incomingService?.text, service.text),
            };
        }),
        successEyebrow: toText(incoming.successEyebrow, DEFAULT_STOREFRONT_CONTENT.successEyebrow),
        successTitle: toText(incoming.successTitle, DEFAULT_STOREFRONT_CONTENT.successTitle),
        successText: toText(incoming.successText, DEFAULT_STOREFRONT_CONTENT.successText),
        footerTitle: toText(incoming.footerTitle, DEFAULT_STOREFRONT_CONTENT.footerTitle),
        footerText: toText(incoming.footerText, DEFAULT_STOREFRONT_CONTENT.footerText),
        footerSubtext: toText(incoming.footerSubtext, DEFAULT_STOREFRONT_CONTENT.footerSubtext),
        supportEmail: toText(incoming.supportEmail, DEFAULT_STOREFRONT_CONTENT.supportEmail),
    };
};

export const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value || 0);

export async function getProducts(featured = false): Promise<Product[]> {
    try {
        const res = await API.get("/api/storefront/products", {
            params: {
                ...STOREFRONT_PARAMS,
                featured,
            },
        });

        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Unable to fetch Adrian storefront products", error);
        return [];
    }
}

export async function getProduct(slug: string): Promise<Product | null> {
    try {
        const res = await API.get(`/api/storefront/products/${slug}`, {
            params: STOREFRONT_PARAMS,
        });

        return res.data ?? null;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }

        console.error("Unable to fetch Adrian storefront product", error);
        return null;
    }
}

export async function getStorefrontContent(): Promise<StorefrontContent> {
    try {
        const res = await API.get("/api/storefront/content", {
            params: STOREFRONT_PARAMS,
        });

        return normalizeStorefrontContent(res.data?.content || res.data);
    } catch (error) {
        console.error("Unable to fetch Adrian storefront content", error);
        return DEFAULT_STOREFRONT_CONTENT;
    }
}

export async function getOrderBySession(sessionId: string) {
    const res = await API.get("/api/storefront/order-by-session", {
        params: {
            ...STOREFRONT_PARAMS,
            session_id: sessionId,
        },
    });

    return res.data as {
        order: {
            id: string;
            subtotal: number;
            shipping_amount: number;
            tax_amount: number;
            total_amount: number;
        } | null;
        items: Array<{
            id: string;
            product_title: string;
            quantity: number;
            unit_price: number;
        }>;
    };
}

type CheckoutCartItem = {
    productId: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    slug?: string | null;
};

type CheckoutCustomer = {
    name?: string;
    email?: string;
    phone?: string;
};

type CheckoutCustomerInput = CheckoutCustomer | string | undefined;

export type QuoteRequestInput = {
    productId?: string;
    productName?: string;
    quantity?: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    details?: string;
};

export async function submitQuoteRequest(input: QuoteRequestInput) {
    const detailLines = [
        "App: Adrian Store",
        "Storefront key: adrian-store",
        `Customer: ${input.contactName}`,
        `Email: ${input.contactEmail}`,
        `Phone: ${input.contactPhone}`,
        `Product: ${input.productName || "Styling request"}`,
        `Quantity: ${input.quantity || 1}`,
        input.details ? `Message: ${input.details}` : "Message: No additional details provided.",
    ].filter(Boolean);

    const res = await API.post("/quote-requests", {
        product_id: input.productId || null,
        quantity: input.quantity || 1,
        status: "pending",
        details: detailLines.join("\n"),
        app_name: "Adrian Store",
        storefront_key: "adrian-store",
    });

    return res.data as {
        id: string;
        status: string;
        email_sent?: boolean;
        admin_email_sent?: boolean;
        customer_email_sent?: boolean;
        notification_recipient?: string | null;
        customer_email_recipient?: string | null;
    };
}

export async function createCheckout(
    cart: CheckoutCartItem[],
    customer?: CheckoutCustomerInput,
) {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const customerDetails = typeof customer === "string" ? { email: customer } : (customer || {});

    const res = await API.post("/api/storefront/create-checkout-session", {
        cart,
        app_name: "Adrian Store",
        storefront_key: "adrian-store",
        customer_name: customerDetails?.name,
        customer_email: customerDetails?.email,
        customer_phone: customerDetails?.phone,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart?checkout=cancelled`,
    });

    return res.data as { orderId: string; sessionId: string; url: string };
}
