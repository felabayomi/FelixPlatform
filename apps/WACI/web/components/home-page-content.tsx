"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Bird,
    BookOpen,
    Camera,
    Globe,
    HeartHandshake,
    Mail,
    Shield,
    Trees,
    Users,
} from "lucide-react";
import {
    submitDonorInterest,
    submitNewsletterSignup,
    submitPartnerInterest,
    submitVolunteerInterest,
    type SiteContent,
    type WaciProgram,
    type WaciResource,
    type WaciStory,
} from "@/lib/api";

const pillarIcons = [BookOpen, HeartHandshake, Bird, Camera, Users];

const fallbackHeroImages = [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80",
];

const resolveHeroImageUrl = (value?: string | null) => {
    const normalized = String(value || "").trim();

    if (!normalized) {
        return "";
    }

    if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
        return normalized;
    }

    if (normalized.startsWith("/uploads/")) {
        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com").replace(/\/$/, "");
        return `${apiBaseUrl}${normalized}`;
    }

    return normalized;
};

const fallbackServices: Array<{
    id: string;
    title: string;
    text: string;
    region?: string;
    status?: string;
    image?: string;
    ctaLabel?: string;
    ctaLink?: string;
}> = [
        {
            id: "education-awareness",
            title: "Education & Awareness",
            text:
                "School outreach, youth wildlife clubs, community workshops, and digital learning experiences that make conservation practical and inspiring.",
        },
        {
            id: "community-conservation",
            title: "Community Conservation",
            text:
                "Projects that elevate local voices, strengthen capacity, and support communities living alongside wildlife and wild places.",
        },
        {
            id: "research-citizen-science",
            title: "Research & Citizen Science",
            text:
                "Field data, student research, citizen science, and ecosystem knowledge that help improve conservation decisions across Africa.",
        },
        {
            id: "storytelling-media",
            title: "Storytelling & Media",
            text:
                "Documentaries, podcasts, blogs, and photo stories that move hearts, shape public understanding, and inspire action.",
        },
        {
            id: "professional-network",
            title: "Professional Network",
            text:
                "A growing cross-border community connecting rangers, researchers, students, NGOs, artists, and supporters of African wildlife.",
        },
    ];

const habitats = [
    {
        title: "Savannas & Grasslands",
        text: "Wide-open landscapes where elephants, lions, giraffes, zebras, and countless grasses shape ecological balance.",
    },
    {
        title: "Forests & Rainforests",
        text: "Dense, life-rich ecosystems including the Congo Basin, home to gorillas, okapis, rare birds, and vital plant diversity.",
    },
    {
        title: "Mountains & Highlands",
        text: "Cooler high-elevation habitats with unique species, fragile watersheds, and remarkable biodiversity found nowhere else.",
    },
    {
        title: "Rivers & Wetlands",
        text: "Living water systems supporting fish, hippos, crocodiles, migratory birds, floodplains, and community livelihoods.",
    },
];

const careerPaths = [
    "Wildlife Researcher",
    "Park Ranger / Warden",
    "Conservation Communicator",
    "Community Conservationist",
    "Conservation Policy Maker",
    "Wildlife Veterinarian",
];

const fallbackStoryCards: Array<{
    category: string;
    title: string;
    excerpt: string;
    link?: string;
}> = [
        {
            category: "Field Story",
            title: "Why local voices belong at the center of conservation",
            excerpt:
                "When conservation becomes community-led, protection becomes more resilient, more practical, and more just.",
        },
        {
            category: "Learning",
            title: "What every young wildlife advocate should understand first",
            excerpt:
                "From habitats to human-wildlife conflict, strong foundations turn passion into useful action.",
        },
        {
            category: "Media",
            title: "How storytelling helps people care enough to act",
            excerpt:
                "Images, podcasts, documentaries, and field notes can connect distant audiences to living ecosystems.",
        },
    ];

const stats = [
    { label: "Core pillars", value: "5" },
    { label: "Places to contribute", value: "3" },
    { label: "Shared mission", value: "1" },
    { label: "Future generations", value: "∞" },
];

const trustPoints = [
    "Built for Africans and global allies who care about wildlife and want practical ways to act.",
    "Community-centered conservation with space for students, professionals, supporters, and partners.",
    "Powered by the Felix shared platform so public storytelling can scale with trust and operational strength.",
];

const fallbackWhoWeAreItems: Array<{
    id?: string;
    title: string;
    text: string;
    icon?: string;
}> = [
        {
            id: "community-inclusion",
            title: "Community & Inclusion",
            text: "Conservation belongs to everyone. We welcome professionals, students, creators, local communities, and global allies.",
            icon: "users",
        },
        {
            id: "knowledge-curiosity",
            title: "Knowledge & Curiosity",
            text: "We foster understanding of species, ecosystems, and conservation challenges so people can act with clarity.",
            icon: "trees",
        },
        {
            id: "action-accountability",
            title: "Action & Accountability",
            text: "We believe awareness matters, but measurable action for wildlife and habitats matters more.",
            icon: "shield",
        },
    ];

const whoWeAreIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    users: Users,
    people: Users,
    trees: Trees,
    tree: Trees,
    shield: Shield,
    globe: Globe,
    bird: Bird,
    camera: Camera,
    book: BookOpen,
    "book-open": BookOpen,
    heart: HeartHandshake,
    "heart-handshake": HeartHandshake,
};

type Props = {
    content: SiteContent;
    waciPrograms: WaciProgram[];
    waciStories: WaciStory[];
    waciResources: WaciResource[];
};

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
    return (
        <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">
                {eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                {title}
            </h2>
            {body ? (
                <p className="mt-5 text-base leading-7 text-white/70 md:text-lg">{body}</p>
            ) : null}
        </div>
    );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

export default function HomePageContent({ content, waciPrograms, waciStories, waciResources }: Props) {
    const [form, setForm] = useState({ name: "", email: "", interest: "Volunteer" });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);
    const [failedHeroImages, setFailedHeroImages] = useState<string[]>([]);
    const year = useMemo(() => new Date().getFullYear(), []);

    const heroBadgeText = content.heroEyebrow || "A home for Africans and friends of Africa who care about wildlife";
    const heroTitle = content.heroTitle || "Inspiring a growing generation for Africa’s wildlife.";
    const heroText =
        content.heroText ||
        "Wildlife Africa Conservation Initiative (WACI) brings together local communities, conservation partners, and practical action to protect biodiversity for the long term.";
    const heroPrimaryLabel = content.heroPrimaryLabel || "Join the Movement";
    const heroPrimaryLink = content.heroPrimaryLink || "#join";
    const heroSecondaryLabel = content.heroSecondaryLabel || "Explore Wildlife";
    const heroSecondaryLink = content.heroSecondaryLink || "#learn";

    const heroImages = useMemo(() => {
        const configuredImages = [
            ...(Array.isArray(content.heroImages) ? content.heroImages : []),
            content.heroImageOne,
            content.heroImageTwo,
            content.heroImageThree,
            content.heroImageFour,
        ]
            .map((value) => resolveHeroImageUrl(value))
            .filter(Boolean)
            .filter((value, index, items) => items.indexOf(value) === index)
            .filter((value) => !failedHeroImages.includes(value));

        if (configuredImages.length) {
            return configuredImages;
        }

        return fallbackHeroImages.filter((value) => !failedHeroImages.includes(value));
    }, [content.heroImageFour, content.heroImageOne, content.heroImageThree, content.heroImageTwo, content.heroImages, failedHeroImages]);

    const heroImage = heroImages[activeHeroImageIndex % Math.max(heroImages.length, 1)] || fallbackHeroImages[0];
    const featuredStoryRecord = useMemo(() => {
        if (!Array.isArray(waciStories) || !waciStories.length) {
            return null;
        }

        return waciStories.find((story) => story?.featured !== false) || waciStories[0];
    }, [waciStories]);
    const storyImage = resolveHeroImageUrl(content.featuredStoryImage || featuredStoryRecord?.image) || heroImages[1] || heroImages[0] || fallbackHeroImages[0];
    const storiesEyebrow = content.storiesEyebrow || content.featuredEyebrow || "Stories & Media";
    const storiesTitle = content.storiesTitle || content.featuredTitle || "Conservation comes alive when people can see it, hear it, and feel it";
    const storiesText = content.storiesText || content.featuredText || "WACI uses storytelling to connect people to real ecosystems, real communities, and real conservation work across Africa.";
    const featuredStoryEyebrow = content.featuredStoryEyebrow || (featuredStoryRecord?.location ? `Featured Story · ${featuredStoryRecord.location}` : "Featured Story");
    const featuredStoryTitle = content.featuredStoryTitle || featuredStoryRecord?.title || "Why WACI exists: turning admiration into action";
    const featuredStoryText = content.featuredStoryText || featuredStoryRecord?.summary || "Africa’s wildlife faces habitat loss, climate pressure, poaching, pollution, and human-wildlife conflict. WACI exists to help more people move from caring deeply about these realities to doing something meaningful about them.";
    const featuredStoryAlt = content.featuredStoryAlt || featuredStoryRecord?.title || "African landscape with wildlife";
    const featuredStoryCtaLabel = content.featuredStoryCtaLabel || "Join Our Movement";
    const featuredStoryCtaLink = content.featuredStoryCtaLink || featuredStoryRecord?.link || "#join";
    const whoWeAreEyebrow = content.whoWeAreEyebrow || "Who We Are";
    const whoWeAreTitle = content.whoWeAreTitle || "A platform for wildlife people";
    const whoWeAreText = content.whoWeAreText || "WACI was born from a simple truth: Africa’s wildlife needs more people who care, and those people need a place to connect, learn, and act. We exist to make conservation more inclusive, more informed, and more community-driven.";
    const whoWeAreItems = useMemo(() => {
        if (Array.isArray(content.whoWeAreItems) && content.whoWeAreItems.length) {
            const configuredItems = content.whoWeAreItems.filter((item) => item?.title || item?.text);
            if (configuredItems.length) {
                return configuredItems;
            }
        }

        return fallbackWhoWeAreItems;
    }, [content.whoWeAreItems]);
    const programCards = useMemo(() => {
        if (Array.isArray(waciPrograms) && waciPrograms.length) {
            return waciPrograms.filter((program) => program?.title || program?.text).slice(0, 6);
        }

        if (Array.isArray(content.services) && content.services.length) {
            return content.services.filter((service) => service?.title || service?.text).slice(0, 5);
        }

        return fallbackServices;
    }, [content.services, waciPrograms]);
    const storyCards = useMemo(() => {
        if (Array.isArray(waciStories) && waciStories.length) {
            const remainingStories = featuredStoryRecord
                ? waciStories.filter((story) => story.id !== featuredStoryRecord.id)
                : waciStories;

            if (remainingStories.length) {
                return remainingStories.slice(0, 3).map((story) => ({
                    category: story.location || (story.publishedAt ? `Story · ${story.publishedAt}` : 'Story'),
                    title: story.title,
                    excerpt: story.summary,
                    link: story.link || '#stories',
                }));
            }
        }

        return fallbackStoryCards;
    }, [featuredStoryRecord, waciStories]);
    const resourceCards = useMemo(() => {
        if (Array.isArray(waciResources) && waciResources.length) {
            return waciResources.filter((resource) => resource?.title || resource?.caption || resource?.file_url || resource?.fileUrl).slice(0, 4);
        }

        return [];
    }, [waciResources]);

    useEffect(() => {
        setActiveHeroImageIndex(0);
    }, [heroImages.length]);

    useEffect(() => {
        setFailedHeroImages([]);
    }, [content.heroImageFour, content.heroImageOne, content.heroImageThree, content.heroImageTwo, content.heroImages]);

    useEffect(() => {
        if (heroImages.length <= 1) {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            setActiveHeroImageIndex((current) => (current + 1) % heroImages.length);
        }, 3200);

        return () => window.clearTimeout(timeout);
    }, [activeHeroImageIndex, heroImages]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            const name = form.name.trim();
            const email = form.email.trim();

            if (form.interest === "Volunteer") {
                await submitVolunteerInterest({
                    name,
                    email,
                    area_of_interest: "General WACI volunteering",
                    notes: "Submitted from the WACI homepage join form.",
                    source: "homepage-form",
                });
            } else if (form.interest === "Partnership") {
                await submitPartnerInterest({
                    name,
                    email,
                    partnership_type: "General WACI partnership enquiry",
                    notes: "Submitted from the WACI homepage join form.",
                    source: "homepage-form",
                });
            } else if (form.interest === "Donate") {
                await submitDonorInterest({
                    name,
                    email,
                    support_type: "Donate",
                    notes: "Interested in supporting WACI. Stripe connection will be added later.",
                    source: "homepage-form",
                });
            } else {
                await submitNewsletterSignup({
                    full_name: name,
                    email,
                    interests: [form.interest.toLowerCase()],
                    source: "homepage-form",
                });
            }

            setSuccess(`Thanks, ${name || "friend"}. You’re now connected with WACI.`);
            setForm({ name: "", email: "", interest: "Volunteer" });
        } catch (submitError) {
            console.error(submitError);
            setError("We could not submit your request right now. Please try again shortly.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#08120e] text-white selection:bg-emerald-300 selection:text-[#08120e]">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.20),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.10),transparent_20%),linear-gradient(180deg,#0b1511_0%,#08120e_45%,#060d0a_100%)]" />

            <main id="top">
                <section className="relative overflow-hidden px-4 pb-20 pt-14 md:px-6 lg:px-8 lg:pb-28 lg:pt-20">
                    <div className="mx-auto grid max-w-7xl items-start gap-8 md:grid-cols-[minmax(0,1.02fr)_380px] xl:grid-cols-[1.1fr_0.9fr] xl:gap-10">
                        <div className="max-w-3xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur">
                                <Globe className="h-4 w-4 text-emerald-300" />
                                {heroBadgeText}
                            </div>
                            <h1 className="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
                                {heroTitle}
                            </h1>
                            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg md:text-xl">
                                {heroText}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a
                                    href="#join"
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-[#092013] transition hover:scale-[1.02] hover:bg-emerald-200"
                                >
                                    Join the Movement <ArrowRight className="h-4 w-4" />
                                </a>
                                <a
                                    href="#learn"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    Explore Wildlife <BookOpen className="h-4 w-4" />
                                </a>
                                <a
                                    href="#join"
                                    className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold text-[#092013] transition hover:scale-[1.02] hover:bg-amber-100"
                                >
                                    Donate <HeartHandshake className="h-4 w-4" />
                                </a>
                            </div>
                            <div className="mt-10 grid grid-cols-2 gap-4 xl:grid-cols-4">
                                {stats.map((item) => (
                                    <GlassCard key={item.label} className="p-4">
                                        <p className="text-2xl font-semibold text-emerald-300 md:text-3xl">{item.value}</p>
                                        <p className="mt-1 text-sm text-white/60">{item.label}</p>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-[430px] md:max-w-none">
                            <div className="absolute -left-8 top-16 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
                            <div className="absolute -right-8 bottom-10 h-48 w-48 rounded-full bg-amber-200/10 blur-3xl" />

                            <GlassCard className="relative overflow-hidden p-4 sm:p-5">
                                <div className="rounded-2xl border border-white/10 bg-[#07100c]/70 p-4 backdrop-blur">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                                        {content.heroWildPlacesTitle || "Wild places"}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-white/80">
                                        {content.heroWildPlacesText || "Savannas, forests, wetlands, mountains, and all the life they hold."}
                                    </p>
                                </div>

                                <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#07100c]">
                                    <motion.img
                                        key={heroImage}
                                        src={heroImage}
                                        alt="WACI wildlife hero"
                                        className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
                                        initial={{ opacity: 0.45, scale: 1.03 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6 }}
                                        onError={(event) => {
                                            const brokenSrc = event.currentTarget.currentSrc || event.currentTarget.src;
                                            setFailedHeroImages((current) => (
                                                current.includes(brokenSrc)
                                                    ? current
                                                    : [...current, brokenSrc]
                                            ));
                                        }}
                                    />
                                </div>

                                <div className="mt-3 flex items-center justify-center gap-2">
                                    {heroImages.map((image, index) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            onClick={() => setActiveHeroImageIndex(index)}
                                            aria-label={`Show hero image ${index + 1}`}
                                            className={`h-2.5 rounded-full transition ${index === activeHeroImageIndex ? "w-7 bg-emerald-300" : "w-2.5 bg-white/30 hover:bg-white/50"}`}
                                        />
                                    ))}
                                </div>

                                <GlassCard className="mt-4 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{content.heroWhyTitle || "Why WACI"}</p>
                                    <p className="mt-2 text-sm leading-6 text-white/80">
                                        {content.heroWhyText || "Wildlife protection becomes stronger when curiosity, community, and practical action meet."}
                                    </p>
                                </GlassCard>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <GlassCard className="p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{content.heroVisionTitle || "Vision"}</p>
                                        <p className="mt-2 text-sm leading-6 text-white/80">
                                            {content.heroVisionText || "A future where African biodiversity thrives because enough people stood up to protect it."}
                                        </p>
                                    </GlassCard>
                                    <GlassCard className="p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{content.heroMissionTitle || "Mission"}</p>
                                        <p className="mt-2 text-sm leading-6 text-white/80">
                                            {content.heroMissionText || "Bridge the gap between passion and practical action through learning, collaboration, and community."}
                                        </p>
                                    </GlassCard>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    <div className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3">
                        {trustPoints.map((point) => (
                            <GlassCard key={point} className="p-4 text-sm leading-7 text-white/75">
                                {point}
                            </GlassCard>
                        ))}
                    </div>
                </section>

                <section className="scroll-mt-28 px-4 py-14 md:scroll-mt-32 md:px-6 lg:px-8" id="about">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow={whoWeAreEyebrow}
                            title={whoWeAreTitle}
                            body={whoWeAreText}
                        />
                        <div className="mt-10 grid gap-6 lg:grid-cols-3">
                            {whoWeAreItems.map((item, index) => {
                                const iconKey = String(item.icon || "").trim().toLowerCase();
                                const FallbackIcon = [Users, Trees, Shield][index % 3] || Users;
                                const Icon = whoWeAreIconMap[iconKey] || FallbackIcon;

                                return (
                                    <GlassCard key={item.id || item.title || index}>
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-white/70">{item.text}</p>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="scroll-mt-28 px-4 pb-14 pt-20 md:scroll-mt-32 md:px-6 lg:px-8" id="programs">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow={content.servicesEyebrow || "Our Work"}
                            title={content.servicesTitle || "Five pillars that turn care into conservation action"}
                            body={content.servicesText || "Through education, community engagement, research, storytelling, and collaboration, WACI helps people move from admiration of wildlife to active stewardship."}
                        />
                        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {programCards.map((pillar, index) => {
                                const Icon = pillarIcons[index % pillarIcons.length];
                                const metaText = [pillar.region, pillar.status].filter(Boolean).join(' · ');
                                return (
                                    <div key={pillar.id || pillar.title || index}>
                                        <GlassCard className="h-full">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-emerald-300">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h3 className="mt-5 text-xl font-semibold">{pillar.title}</h3>
                                            {metaText ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-300/70">{metaText}</p> : null}
                                            <p className="mt-3 text-sm leading-7 text-white/70">{pillar.text}</p>
                                            {pillar.ctaLink ? (
                                                <a href={pillar.ctaLink} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                                                    {pillar.ctaLabel || 'Learn more'} <ArrowRight className="h-4 w-4" />
                                                </a>
                                            ) : null}
                                        </GlassCard>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="scroll-mt-28 px-4 py-14 md:scroll-mt-32 md:px-6 lg:px-8" id="involved">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow="Find Your Place"
                            title="Stand up and self-identify"
                            body="Whether you grew up near a national park or first fell in love with African wildlife through a documentary, there is a place for you in this movement."
                        />
                        <div className="mt-10 grid gap-6 lg:grid-cols-3">
                            {[
                                {
                                    title: "I’m a Wildlife Professional",
                                    text: "For rangers, researchers, conservation practitioners, and NGO teams who want collaboration, visibility, and stronger networks.",
                                },
                                {
                                    title: "I’m a Student / Enthusiast",
                                    text: "For students, artists, filmmakers, photographers, and nature lovers eager to learn, volunteer, and grow in conservation.",
                                },
                                {
                                    title: "I Want to Support",
                                    text: "For donors, institutional partners, ethical brands, and allies who want to help advance conservation across Africa.",
                                },
                            ].map((item) => (
                                <GlassCard key={item.title} className="relative overflow-hidden">
                                    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
                                    <h3 className="relative text-2xl font-semibold leading-tight">{item.title}</h3>
                                    <p className="relative mt-4 text-sm leading-7 text-white/70">{item.text}</p>
                                    <a
                                        href="#join"
                                        className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                                    >
                                        Step forward <ArrowRight className="h-4 w-4" />
                                    </a>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="scroll-mt-28 px-4 py-14 md:scroll-mt-32 md:px-6 lg:px-8" id="learn">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow="Knowledge Hub"
                            title="Learn about wildlife, habitats, and conservation pathways"
                            body="Knowledge is the foundation of meaningful action. Explore the ecosystems that define Africa, the challenges they face, and the many careers helping protect them."
                        />
                        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                            <GlassCard>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                                    African Habitats
                                </p>
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    {habitats.map((habitat) => (
                                        <div key={habitat.title} className="rounded-2xl border border-white/8 bg-black/10 p-5">
                                            <h3 className="text-lg font-semibold">{habitat.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-white/70">{habitat.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                            <GlassCard>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                                    Career Pathways
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {careerPaths.map((career) => (
                                        <span
                                            key={career}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
                                        >
                                            {career}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                                    <p className="text-lg font-medium text-white">Conservation starts with understanding.</p>
                                    <p className="mt-2 text-sm leading-7 text-white/75">
                                        From sustainable choices to lifelong careers, every informed step can help strengthen Africa’s biodiversity.
                                    </p>
                                </div>
                            </GlassCard>
                        </div>

                        {resourceCards.length ? (
                            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                                {resourceCards.map((resource) => (
                                    <GlassCard key={resource.id} className="h-full">
                                        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">
                                            {resource.mediaType || resource.media_type || 'Resource'}
                                        </p>
                                        <h3 className="mt-3 text-lg font-semibold">{resource.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-white/70">
                                            {resource.caption || resource.altText || resource.alt_text || 'Explore this WACI resource.'}
                                        </p>
                                        {(resource.fileUrl || resource.file_url) ? (
                                            <a
                                                href={resource.fileUrl || resource.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                                            >
                                                Open resource <ArrowRight className="h-4 w-4" />
                                            </a>
                                        ) : null}
                                    </GlassCard>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="scroll-mt-28 px-4 py-14 md:scroll-mt-32 md:px-6 lg:px-8" id="stories">
                    <div className="mx-auto max-w-7xl">
                        <SectionHeading
                            eyebrow={storiesEyebrow}
                            title={storiesTitle}
                            body={storiesText}
                        />
                        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                            <GlassCard className="overflow-hidden p-0">
                                <div className="grid md:grid-cols-2">
                                    <img
                                        src={storyImage}
                                        alt={featuredStoryAlt}
                                        className="h-full min-h-[320px] w-full object-cover"
                                    />
                                    <div className="p-8">
                                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                                            {featuredStoryEyebrow}
                                        </p>
                                        <h3 className="mt-4 text-3xl font-semibold leading-tight">
                                            {featuredStoryTitle}
                                        </h3>
                                        <p className="mt-4 text-sm leading-7 text-white/70">
                                            {featuredStoryText}
                                        </p>
                                        <a
                                            href={featuredStoryCtaLink}
                                            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                                        >
                                            {featuredStoryCtaLabel} <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            </GlassCard>
                            <div className="grid gap-6">
                                {storyCards.map((story) => (
                                    <GlassCard key={story.title}>
                                        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{story.category}</p>
                                        <h3 className="mt-3 text-xl font-semibold">{story.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-white/70">{story.excerpt}</p>
                                        {story.link ? (
                                            <a href={story.link} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                                                Read more <ArrowRight className="h-4 w-4" />
                                            </a>
                                        ) : null}
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="scroll-mt-28 px-4 py-14 md:scroll-mt-32 md:px-6 lg:px-8" id="join">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                            <GlassCard className="relative overflow-hidden">
                                <div className="absolute -right-10 top-0 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />
                                <p className="relative text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                                    Newsletter & Action
                                </p>
                                <h2 className="relative mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                                    Be part of the growing generation.
                                </h2>
                                <p className="relative mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                                    Get stories from the field, opportunities to learn, volunteer openings, program updates, and ways to support Africa’s wildlife through WACI.
                                </p>
                                <div className="relative mt-8 flex flex-wrap gap-3">
                                    {[
                                        "Updates",
                                        "Opportunities",
                                        "Field stories",
                                        "Volunteer calls",
                                        "Partnership news",
                                        "Donate",
                                    ].map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </GlassCard>

                            <GlassCard>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white/80">Full name</label>
                                        <input
                                            value={form.name}
                                            onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
                                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/35 focus:border-emerald-300/40"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white/80">Email address</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
                                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/35 focus:border-emerald-300/40"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-white/80">I’m interested in</label>
                                        <select
                                            value={form.interest}
                                            onChange={(event) => setForm((state) => ({ ...state, interest: event.target.value }))}
                                            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-emerald-300/40"
                                        >
                                            <option className="bg-[#0a1310]">Volunteer</option>
                                            <option className="bg-[#0a1310]">Learn</option>
                                            <option className="bg-[#0a1310]">Partnership</option>
                                            <option className="bg-[#0a1310]">Donate</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#092013] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-70"
                                    >
                                        {submitting ? "Submitting…" : "Subscribe & Connect"} <Mail className="h-4 w-4" />
                                    </button>
                                    <a
                                        href="#join"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/40 bg-amber-200 px-5 py-3 text-sm font-semibold text-[#092013] transition hover:bg-amber-100"
                                    >
                                        Donate to WACI
                                    </a>
                                    {success ? <p className="text-sm leading-6 text-emerald-200">{success}</p> : null}
                                    {error ? <p className="text-sm leading-6 text-rose-200">{error}</p> : null}
                                    <p className="text-xs leading-6 text-white/45">
                                        Production-ready note: this form now connects to the shared Felix backend for newsletter, volunteer, partnership, and donor interest capture. Stripe donation checkout can be attached next.
                                    </p>
                                </form>
                            </GlassCard>
                        </div>
                    </div>
                </section>
            </main>

            <div className="sr-only">{year}</div>
        </div>
    );
}
