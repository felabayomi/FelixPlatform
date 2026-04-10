import axios from "axios";
import type { Product } from "@/types/product";

export type SiteContentService = {
    id: string;
    title: string;
    text: string;
    image?: string;
};

export type SiteContent = {
    heroEyebrow: string;
    heroTitle: string;
    heroText: string;
    heroPrimaryLabel: string;
    heroPrimaryLink: string;
    heroSecondaryLabel: string;
    heroSecondaryLink: string;
    headerLogoUrl: string;
    heroImageOne: string;
    heroImageTwo: string;
    heroImageThree: string;
    heroImageFour: string;
    heroImages: string[];
    heroWildPlacesTitle: string;
    heroWildPlacesText: string;
    heroWhyTitle: string;
    heroWhyText: string;
    heroVisionTitle: string;
    heroVisionText: string;
    heroMissionTitle: string;
    heroMissionText: string;
    featuredEyebrow: string;
    featuredTitle: string;
    featuredText: string;
    storiesEyebrow: string;
    storiesTitle: string;
    storiesText: string;
    featuredStoryEyebrow: string;
    featuredStoryTitle: string;
    featuredStoryText: string;
    featuredStoryImage: string;
    featuredStoryAlt: string;
    featuredStoryCtaLabel: string;
    featuredStoryCtaLink: string;
    servicesEyebrow: string;
    servicesTitle: string;
    servicesText: string;
    services: SiteContentService[];
    successEyebrow: string;
    successTitle: string;
    successText: string;
    footerTitle: string;
    footerText: string;
    footerSubtext: string;
    supportEmail: string;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
    heroEyebrow: "A home for Africans and friends of Africa who care about wildlife",
    heroTitle: "Inspiring a growing generation for Africa’s wildlife.",
    heroText:
        "Wildlife Africa Conservation Initiative (WACI) brings together local communities, conservation partners, and practical action to protect biodiversity for the long term.",
    heroPrimaryLabel: "Join the Movement",
    heroPrimaryLink: "#join",
    heroSecondaryLabel: "Explore Wildlife",
    heroSecondaryLink: "#learn",
    headerLogoUrl: "https://mediahost.app/api/media/serve/a6a6a62c2c5d3698ffa2674ef586907e?w=400&h=400&fit=crop&crop=center&q=80",
    heroImageOne: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    heroImageTwo: "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1200&q=80",
    heroImageThree: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    heroImageFour: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80",
    heroImages: [],
    heroWildPlacesTitle: "Wild places",
    heroWildPlacesText: "Savannas, forests, wetlands, mountains, and all the life they hold.",
    heroWhyTitle: "Why WACI",
    heroWhyText: "Wildlife protection becomes stronger when curiosity, community, and practical action meet.",
    heroVisionTitle: "Vision",
    heroVisionText: "A future where African biodiversity thrives because enough people stood up to protect it.",
    heroMissionTitle: "Mission",
    heroMissionText: "Bridge the gap between passion and practical action through learning, collaboration, and community.",
    featuredEyebrow: "Priority campaigns",
    featuredTitle: "Where WACI is focusing now",
    featuredText:
        "These featured initiatives can be highlighted through the shared Felix content library on the public WACI site.",
    storiesEyebrow: "Stories & Media",
    storiesTitle: "Conservation comes alive when people can see it, hear it, and feel it",
    storiesText: "WACI uses storytelling to connect people to real ecosystems, real communities, and real conservation work across Africa.",
    featuredStoryEyebrow: "Featured Story",
    featuredStoryTitle: "Why WACI exists: turning admiration into action",
    featuredStoryText: "Africa’s wildlife faces habitat loss, climate pressure, poaching, pollution, and human-wildlife conflict. WACI exists to help more people move from caring deeply about these realities to doing something meaningful about them.",
    featuredStoryImage: "",
    featuredStoryAlt: "African landscape with wildlife",
    featuredStoryCtaLabel: "Join Our Movement",
    featuredStoryCtaLink: "#join",
    servicesEyebrow: "Our Work",
    servicesTitle: "Five pillars that turn care into conservation action",
    servicesText:
        "Through education, community engagement, research, storytelling, and collaboration, WACI helps people move from admiration of wildlife to active stewardship.",
    services: [
        {
            id: "education-awareness",
            title: "Education & Awareness",
            text: "School outreach, youth wildlife clubs, community workshops, and digital learning experiences that make conservation practical and inspiring.",
            image: "",
        },
        {
            id: "community-conservation",
            title: "Community Conservation",
            text: "Projects that elevate local voices, strengthen capacity, and support communities living alongside wildlife and wild places.",
            image: "",
        },
        {
            id: "research-citizen-science",
            title: "Research & Citizen Science",
            text: "Field data, student research, citizen science, and ecosystem knowledge that help improve conservation decisions across Africa.",
            image: "",
        },
        {
            id: "storytelling-media",
            title: "Storytelling & Media",
            text: "Documentaries, podcasts, blogs, and photo stories that move hearts, shape public understanding, and inspire action.",
            image: "",
        },
        {
            id: "professional-network",
            title: "Professional Network",
            text: "A growing cross-border community connecting rangers, researchers, students, NGOs, artists, and supporters of African wildlife.",
            image: "",
        },
    ],
    successEyebrow: "Thank you",
    successTitle: "Your message has reached WACI",
    successText: "A WACI team member will review your message and follow up shortly.",
    footerTitle: "Wildlife Africa Conservation Initiative",
    footerText: "Protecting species, restoring habitats, and inspiring lasting stewardship.",
    footerSubtext: "Powered by Felix Platform's shared admin, support, and email infrastructure.",
    supportEmail: "hello@wildlifeafrica.org",
};

const DEFAULT_API_BASE_URL = "https://felix-platform-backend.onrender.com";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
export const WACI_CONTEXT_PARAMS = {
    app_name: "WACI",
    storefront_key: "waci",
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

const normalizeSiteContent = (value: unknown): SiteContent => {
    const incoming = typeof value === "object" && value !== null ? (value as Partial<SiteContent>) : {};
    const defaults = DEFAULT_SITE_CONTENT;
    const incomingServices = Array.isArray(incoming.services) && incoming.services.length ? incoming.services : defaults.services;
    const heroImageOne = toText(incoming.heroImageOne, defaults.heroImageOne);
    const heroImageTwo = toText(incoming.heroImageTwo, defaults.heroImageTwo);
    const heroImageThree = toText(incoming.heroImageThree, defaults.heroImageThree);
    const heroImageFour = toText(incoming.heroImageFour, defaults.heroImageFour);
    const heroImages = [heroImageOne, heroImageTwo, heroImageThree, heroImageFour].filter(Boolean);

    return {
        heroEyebrow: toText(incoming.heroEyebrow, defaults.heroEyebrow),
        heroTitle: toText(incoming.heroTitle, defaults.heroTitle),
        heroText: toText(incoming.heroText, defaults.heroText),
        heroPrimaryLabel: toText(incoming.heroPrimaryLabel, defaults.heroPrimaryLabel),
        heroPrimaryLink: toText(incoming.heroPrimaryLink, defaults.heroPrimaryLink),
        heroSecondaryLabel: toText(incoming.heroSecondaryLabel, defaults.heroSecondaryLabel),
        heroSecondaryLink: toText(incoming.heroSecondaryLink, defaults.heroSecondaryLink),
        headerLogoUrl: toText(incoming.headerLogoUrl, defaults.headerLogoUrl),
        heroImageOne,
        heroImageTwo,
        heroImageThree,
        heroImageFour,
        heroImages,
        heroWildPlacesTitle: toText(incoming.heroWildPlacesTitle, defaults.heroWildPlacesTitle),
        heroWildPlacesText: toText(incoming.heroWildPlacesText, defaults.heroWildPlacesText),
        heroWhyTitle: toText(incoming.heroWhyTitle, defaults.heroWhyTitle),
        heroWhyText: toText(incoming.heroWhyText, defaults.heroWhyText),
        heroVisionTitle: toText(incoming.heroVisionTitle, defaults.heroVisionTitle),
        heroVisionText: toText(incoming.heroVisionText, defaults.heroVisionText),
        heroMissionTitle: toText(incoming.heroMissionTitle, defaults.heroMissionTitle),
        heroMissionText: toText(incoming.heroMissionText, defaults.heroMissionText),
        featuredEyebrow: toText(incoming.featuredEyebrow, defaults.featuredEyebrow),
        featuredTitle: toText(incoming.featuredTitle, defaults.featuredTitle),
        featuredText: toText(incoming.featuredText, defaults.featuredText),
        storiesEyebrow: toText(incoming.storiesEyebrow, toText(incoming.featuredEyebrow, defaults.storiesEyebrow)),
        storiesTitle: toText(incoming.storiesTitle, toText(incoming.featuredTitle, defaults.storiesTitle)),
        storiesText: toText(incoming.storiesText, toText(incoming.featuredText, defaults.storiesText)),
        featuredStoryEyebrow: toText(incoming.featuredStoryEyebrow, defaults.featuredStoryEyebrow),
        featuredStoryTitle: toText(incoming.featuredStoryTitle, defaults.featuredStoryTitle),
        featuredStoryText: toText(incoming.featuredStoryText, defaults.featuredStoryText),
        featuredStoryImage: toText(incoming.featuredStoryImage, heroImageTwo || defaults.featuredStoryImage),
        featuredStoryAlt: toText(incoming.featuredStoryAlt, defaults.featuredStoryAlt),
        featuredStoryCtaLabel: toText(incoming.featuredStoryCtaLabel, defaults.featuredStoryCtaLabel),
        featuredStoryCtaLink: toText(incoming.featuredStoryCtaLink, defaults.featuredStoryCtaLink),
        servicesEyebrow: toText(incoming.servicesEyebrow, defaults.servicesEyebrow),
        servicesTitle: toText(incoming.servicesTitle, defaults.servicesTitle),
        servicesText: toText(incoming.servicesText, defaults.servicesText),
        services: incomingServices.map((service, index) => ({
            id: toText(service?.id, defaults.services[index]?.id || `service-${index + 1}`),
            title: toText(service?.title, defaults.services[index]?.title || ""),
            text: toText(service?.text, defaults.services[index]?.text || ""),
            image: toText(service?.image, defaults.services[index]?.image || ""),
        })),
        successEyebrow: toText(incoming.successEyebrow, defaults.successEyebrow),
        successTitle: toText(incoming.successTitle, defaults.successTitle),
        successText: toText(incoming.successText, defaults.successText),
        footerTitle: toText(incoming.footerTitle, defaults.footerTitle),
        footerText: toText(incoming.footerText, defaults.footerText),
        footerSubtext: toText(incoming.footerSubtext, defaults.footerSubtext),
        supportEmail: toText(incoming.supportEmail, defaults.supportEmail),
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
                ...WACI_CONTEXT_PARAMS,
                featured,
            },
        });

        return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Unable to fetch WACI featured campaigns", error);
        return [];
    }
}

export async function getSiteContent(): Promise<SiteContent> {
    try {
        const res = await API.get("/api/storefront/content", {
            params: WACI_CONTEXT_PARAMS,
        });

        return normalizeSiteContent(res.data?.content || res.data);
    } catch (error) {
        console.error("Unable to fetch WACI site content", error);
        return DEFAULT_SITE_CONTENT;
    }
}

export async function submitSupportRequest(payload: {
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    subject?: string;
    message: string;
}) {
    const res = await API.post("/support-requests", {
        ...payload,
        ...WACI_CONTEXT_PARAMS,
    });

    return res.data;
}

export async function submitNewsletterSignup(payload: {
    email: string;
    full_name?: string;
    interests?: string[];
    source?: string;
}) {
    const res = await API.post("/api/waci/newsletter", payload);
    return res.data;
}

type WaciInterestPayload = {
    name: string;
    email: string;
    phone?: string;
    organization?: string;
    interest?: string;
    area_of_interest?: string;
    partnershipType?: string;
    partnership_type?: string;
    supportType?: string;
    support_type?: string;
    notes?: string;
    source?: string;
};

export async function submitVolunteerInterest(payload: WaciInterestPayload) {
    const res = await API.post("/api/waci/volunteer", {
        contact_name: payload.name,
        contact_email: payload.email,
        contact_phone: payload.phone,
        area_of_interest: payload.area_of_interest || payload.interest,
        notes: payload.notes,
        source: payload.source,
    });

    return res.data;
}

export async function submitPartnerInterest(payload: WaciInterestPayload) {
    const res = await API.post("/api/waci/partner", {
        contact_name: payload.name,
        contact_email: payload.email,
        contact_phone: payload.phone,
        organization: payload.organization,
        partnership_type: payload.partnership_type || payload.partnershipType,
        notes: payload.notes,
        source: payload.source,
    });

    return res.data;
}

export async function submitDonorInterest(payload: WaciInterestPayload) {
    const res = await API.post("/api/waci/donor", {
        contact_name: payload.name,
        contact_email: payload.email,
        contact_phone: payload.phone,
        organization: payload.organization,
        support_type: payload.support_type || payload.supportType,
        notes: payload.notes,
        source: payload.source,
    });

    return res.data;
}


