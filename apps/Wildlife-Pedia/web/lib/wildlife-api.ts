import axios from "axios";

export type WildlifePediaSiteContent = {
    heroEyebrow: string;
    heroTitle: string;
    heroText: string;
    heroPrimaryLabel: string;
    heroPrimaryLink: string;
    heroSecondaryLabel: string;
    heroSecondaryLink: string;
    supportEmail: string;
    footerTitle: string;
    footerText: string;
    footerSubtext: string;
};

export type SpeciesProfile = {
    id: string;
    slug: string;
    name: string;
    scientificName?: string;
    summary: string;
    body: string;
    habitat?: string;
    rangeText?: string;
    diet?: string;
    conservationStatus?: string;
    riskLevel?: string;
    coexistenceTips?: string;
    image?: string;
    featured?: boolean;
    sortOrder?: number;
};

export type HabitatProfile = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    humanInteraction?: string;
    region?: string;
    image?: string;
    featured?: boolean;
};

export type ConservationProject = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    body: string;
    status?: string;
    ctaLabel?: string;
    ctaLink?: string;
    image?: string;
    featured?: boolean;
};

export type BlogPost = {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    category?: string;
    image?: string;
    publishedAt?: string;
    featured?: boolean;
};

const DEFAULT_API_BASE_URL = "https://felix-platform-backend.onrender.com";
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

const DEFAULT_SITE_CONTENT: WildlifePediaSiteContent = {
    heroEyebrow: "Learn wildlife. Prevent conflict. Take action.",
    heroTitle: "Wildlife-Pedia makes conservation knowledge practical.",
    heroText:
        "Explore species, understand habitats, learn safe coexistence, and support real conservation action through the A & F Wildlife Foundation.",
    heroPrimaryLabel: "Explore Species",
    heroPrimaryLink: "/species",
    heroSecondaryLabel: "Report a Sighting",
    heroSecondaryLink: "/report",
    supportEmail: "hello@afwildlifefoundation.org",
    footerTitle: "Wildlife-Pedia",
    footerText:
        "An educational and action-oriented platform helping people understand wildlife, reduce conflict, and support real protection work.",
    footerSubtext: "Powered by the Felix shared platform stack.",
};

export async function getWildlifePediaSiteContent(): Promise<WildlifePediaSiteContent> {
    try {
        const res = await API.get("/api/wildlife-pedia/site-content");
        return { ...DEFAULT_SITE_CONTENT, ...(res.data?.content || {}) };
    } catch (error) {
        console.error("Unable to fetch Wildlife-Pedia site content", error);
        return DEFAULT_SITE_CONTENT;
    }
}

export async function getWildlifeSpecies(options?: { featured?: boolean; q?: string; habitat?: string }): Promise<SpeciesProfile[]> {
    try {
        const res = await API.get("/api/wildlife-pedia/species", { params: options || {} });
        return Array.isArray(res.data?.items) ? res.data.items : [];
    } catch (error) {
        console.error("Unable to fetch Wildlife-Pedia species", error);
        return [];
    }
}

export async function getWildlifeSpeciesBySlug(slug: string): Promise<SpeciesProfile | null> {
    try {
        const res = await API.get(`/api/wildlife-pedia/species/${encodeURIComponent(slug)}`);
        return res.data?.item || null;
    } catch (error) {
        console.error("Unable to fetch Wildlife-Pedia species profile", error);
        return null;
    }
}

export async function getWildlifeHabitats(): Promise<HabitatProfile[]> {
    try {
        const res = await API.get("/api/wildlife-pedia/habitats");
        return Array.isArray(res.data?.items) ? res.data.items : [];
    } catch (error) {
        console.error("Unable to fetch Wildlife-Pedia habitats", error);
        return [];
    }
}

export async function getWildlifeProjects(): Promise<ConservationProject[]> {
    try {
        const res = await API.get("/api/wildlife-pedia/projects");
        return Array.isArray(res.data?.items) ? res.data.items : [];
    } catch (error) {
        console.error("Unable to fetch Wildlife-Pedia projects", error);
        return [];
    }
}

export async function getWildlifeBlogPosts(): Promise<BlogPost[]> {
    try {
        const res = await API.get("/api/wildlife-pedia/blog");
        return Array.isArray(res.data?.items) ? res.data.items : [];
    } catch (error) {
        console.error("Unable to fetch Wildlife-Pedia blog posts", error);
        return [];
    }
}

export async function submitWildlifeNewsletter(payload: { email: string; full_name?: string; source?: string; interests?: string[] }) {
    const res = await API.post("/api/wildlife-pedia/newsletter", payload);
    return res.data;
}

export async function submitWildlifeVolunteer(payload: { name: string; email: string; phone?: string; interests?: string; notes?: string; source?: string }) {
    const res = await API.post("/api/wildlife-pedia/volunteer", payload);
    return res.data;
}

export async function submitWildlifeDonor(payload: { name: string; email: string; amount?: string; support_type?: string; notes?: string; source?: string }) {
    const res = await API.post("/api/wildlife-pedia/donor", payload);
    return res.data;
}

export async function submitWildlifeSighting(payload: {
    name?: string;
    email?: string;
    species?: string;
    location: string;
    notes?: string;
    image_url?: string;
}) {
    const res = await API.post("/api/wildlife-pedia/sightings/report", {
        reporter_name: payload.name,
        reporter_email: payload.email,
        species_guess: payload.species,
        location_text: payload.location,
        notes: payload.notes,
        image_url: payload.image_url,
    });
    return res.data;
}
