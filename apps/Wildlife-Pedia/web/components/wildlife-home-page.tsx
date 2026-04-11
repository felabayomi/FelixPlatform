"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BookOpen, ChevronDown, ChevronUp, HeartHandshake, MapPinned, PawPrint, ShieldCheck } from "lucide-react";
import type { BlogPost, ConservationProject, HabitatProfile, SpeciesProfile, WildlifePediaSiteContent } from "@/lib/wildlife-api";
import { submitWildlifeNewsletter } from "@/lib/wildlife-api";

const SECTION_ORDER = ["top", "about", "species", "habitats", "safety", "projects", "join"] as const;

export default function WildlifeHomePage({
    content,
    species,
    habitats,
    projects,
    posts,
}: {
    content: WildlifePediaSiteContent;
    species: SpeciesProfile[];
    habitats: HabitatProfile[];
    projects: ConservationProject[];
    posts: BlogPost[];
}) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);

    const featuredSpecies = useMemo(() => species.filter((item) => item.featured).slice(0, 3), [species]);
    const featuredHabitats = useMemo(() => habitats.filter((item) => item.featured).slice(0, 3), [habitats]);
    const featuredProjects = useMemo(() => projects.slice(0, 3), [projects]);
    const featuredPosts = useMemo(() => posts.slice(0, 3), [posts]);

    const scrollToSection = (direction: "up" | "down") => {
        if (typeof window === "undefined") {
            return;
        }

        const nextIndex = Math.min(
            Math.max(activeSectionIndex + (direction === "down" ? 1 : -1), 0),
            SECTION_ORDER.length - 1,
        );
        const element = document.getElementById(SECTION_ORDER[nextIndex]);
        if (!element) {
            return;
        }

        setActiveSectionIndex(nextIndex);
        const top = element.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            await submitWildlifeNewsletter({
                email,
                full_name: name,
                source: "homepage-newsletter",
                interests: ["species learning", "conflict prevention", "conservation action"],
            });
            setSuccess(`Thanks${name ? `, ${name}` : ""}. You’re now connected to Wildlife-Pedia updates.`);
            setName("");
            setEmail("");
        } catch (submitError) {
            console.error(submitError);
            setError("We could not subscribe you right now. Please try again shortly.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#08120e] text-white selection:bg-emerald-300 selection:text-[#08120e]">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(22,163,74,0.20),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.10),transparent_20%),linear-gradient(180deg,#0b1511_0%,#08120e_45%,#060d0a_100%)]" />

            <div className="fixed bottom-5 right-4 z-40 flex flex-col items-center gap-2 md:bottom-6 md:right-6">
                <button type="button" onClick={() => scrollToSection("up")} disabled={activeSectionIndex <= 0} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#07100c]/85 text-white shadow-lg backdrop-blur transition hover:border-emerald-300/50 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronUp className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => scrollToSection("down")} disabled={activeSectionIndex >= SECTION_ORDER.length - 1} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#07100c]/85 text-white shadow-lg backdrop-blur transition hover:border-emerald-300/50 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronDown className="h-5 w-5" />
                </button>
            </div>

            <main id="top">
                <section className="px-4 pb-16 pt-14 md:px-6 lg:px-8 lg:pb-24 lg:pt-20">
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 backdrop-blur">
                                <PawPrint className="h-4 w-4 text-emerald-300" />
                                {content.heroEyebrow}
                            </div>
                            <h1 className="max-w-4xl text-4xl font-semibold leading-[0.95] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
                                {content.heroTitle}
                            </h1>
                            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg md:text-xl">
                                {content.heroText}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link href={content.heroPrimaryLink} className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-[#092013] transition hover:bg-emerald-200">
                                    {content.heroPrimaryLabel} <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href={content.heroSecondaryLink} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                    {content.heroSecondaryLabel}
                                </Link>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white/75">
                                {["Education-first", "Conflict-aware", "Community-powered", "Action-backed"].map((label) => (
                                    <span key={label} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                                {[
                                    { label: "Species guides", value: String(species.length || 5) },
                                    { label: "Ecosystem explainers", value: String(habitats.length || 3) },
                                    { label: "Action routes", value: String(projects.length || 3) },
                                    { label: "Reporting tool", value: "Live" },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                                        <p className="text-2xl font-semibold text-emerald-300 md:text-3xl">{item.value}</p>
                                        <p className="mt-1 text-sm text-white/60">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                            <img
                                src={featuredSpecies[0]?.image || "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80"}
                                alt={featuredSpecies[0]?.name || "Wildlife"}
                                className="h-[420px] w-full rounded-[1.4rem] object-cover"
                            />
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Understand</p>
                                    <p className="mt-2 text-sm text-white/80">Learn the species, the habitat, and the real warning signs that matter in everyday encounters.</p>
                                </div>
                                <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">Respond</p>
                                    <p className="mt-2 text-sm text-white/80">Report sightings, support field projects, volunteer, and help turn awareness into safer action.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="px-4 pb-4 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Quick Start</p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">Three ways to use Wildlife-Pedia today.</h2>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Whether you are learning, reporting, or looking to contribute, the platform is designed to help you move quickly from curiosity to useful action.</p>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    title: "Explore a species",
                                    text: "Start with practical, readable profiles that explain behavior, habitat, and coexistence tips.",
                                    href: "/species",
                                },
                                {
                                    title: "Report a sighting",
                                    text: "Share a recent encounter calmly and clearly so the community knowledge layer keeps improving.",
                                    href: "/report",
                                },
                                {
                                    title: "Support the mission",
                                    text: "Volunteer, donate, or sponsor conservation awareness through the A & F Wildlife Foundation.",
                                    href: "/get-involved",
                                },
                            ].map((item) => (
                                <Link key={item.title} href={item.href} className="rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-emerald-300/40 hover:bg-black/20">
                                    <p className="text-lg font-semibold text-white">{item.title}</p>
                                    <p className="mt-2 text-sm leading-7 text-white/70">{item.text}</p>
                                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">Open <ArrowRight className="h-4 w-4" /></span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="about" className="px-4 py-14 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto max-w-3xl text-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Why Wildlife-Pedia</p>
                            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Wildlife intelligence, designed for real life.</h2>
                            <p className="mt-5 text-base leading-7 text-white/70 md:text-lg">Think of Wildlife-Pedia as part encyclopedia, part field guide, part citizen-awareness tool, and part conservation action hub — built to help people understand wildlife and respond more responsibly alongside the A & F Wildlife Foundation.</p>
                        </div>
                        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                { icon: BookOpen, title: "Learn the species", text: "Clear profiles, habitat context, and plain-language explanations that make wildlife easier to understand." },
                                { icon: MapPinned, title: "See the landscape", text: "Understand where animals move, where pressure is rising, and why shared ecosystems need smarter planning." },
                                { icon: AlertTriangle, title: "Respond safely", text: "Use field-ready guidance for real encounters, conflict prevention, and community awareness." },
                                { icon: HeartHandshake, title: "Back the work", text: "Volunteer, donate, adopt a species, or support public education campaigns that move beyond awareness." },
                            ].map((item) => (
                                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300"><item.icon className="h-5 w-5" /></div>
                                    <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-white/70">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="species" className="px-4 py-14 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Species Directory</p>
                                <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Featured wildlife profiles</h2>
                            </div>
                            <Link href="/species" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">Browse all species <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {featuredSpecies.map((item) => (
                                <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                                    {item.image ? <img src={item.image} alt={item.name} className="h-52 w-full object-cover" /> : null}
                                    <div className="p-5">
                                        <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{item.conservationStatus || "Species profile"}</p>
                                        <h3 className="mt-3 text-xl font-semibold">{item.name}</h3>
                                        {item.scientificName ? <p className="mt-1 text-sm italic text-white/55">{item.scientificName}</p> : null}
                                        <p className="mt-3 text-sm leading-7 text-white/70">{item.summary}</p>
                                        <Link href={`/species/${encodeURIComponent(item.slug)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">Open profile <ArrowRight className="h-4 w-4" /></Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="habitats" className="px-4 py-14 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Habitats & Ecosystems</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Understand where wildlife and people meet.</h2>
                            <p className="mt-4 text-sm leading-7 text-white/70">From savannas and wetlands to forest edges and urban interfaces, Wildlife-Pedia explains how ecosystems work and why coexistence planning matters.</p>
                            <div className="mt-6 space-y-4">
                                {featuredHabitats.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                        <h3 className="text-lg font-semibold">{item.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-white/70">{item.summary}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-3xl border border-amber-200/20 bg-amber-200/10 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl" id="safety">
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-100/80">Human–Wildlife Conflict & Safety</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Know how to act in an encounter.</h2>
                            <div className="mt-6 space-y-4 text-sm leading-7 text-white/80">
                                {[
                                    "Keep distance and never corner wildlife or block movement routes.",
                                    "Observe behavior first — many dangerous encounters start with misreading warning signs.",
                                    "Use local reporting systems for recurring sightings near homes, schools, farms, or roads.",
                                    "Support prevention tools like awareness campaigns, safe storage, and route planning.",
                                ].map((tip) => (
                                    <div key={tip} className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                                        <p>{tip}</p>
                                    </div>
                                ))}
                            </div>
                            <Link href="/safety" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-50">Open safety guide <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                    </div>
                </section>

                <section id="projects" className="px-4 py-14 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Conservation Projects</p>
                                <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Action through the A & F Wildlife Foundation</h2>
                            </div>
                            <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">View all projects <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {featuredProjects.map((project) => (
                                <div key={project.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{project.status || "Active"}</p>
                                    <h3 className="mt-3 text-xl font-semibold">{project.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-white/70">{project.summary}</p>
                                    <Link href={project.ctaLink || "/get-involved"} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                                        {project.ctaLabel || "Learn more"} <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-4 py-14 md:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Field Notes & Community Signals</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Stories, sightings, and practical briefings from the field.</h2>
                            <div className="mt-6 space-y-4">
                                {featuredPosts.map((post) => (
                                    <div key={post.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/75">{post.category || "Insights"}</p>
                                            <span className="text-xs text-white/45">{post.publishedAt}</span>
                                        </div>
                                        <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                                        <p className="mt-2 text-sm leading-7 text-white/70">{post.excerpt}</p>
                                    </div>
                                ))}
                            </div>
                            <Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">Visit the blog <ArrowRight className="h-4 w-4" /></Link>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl" id="join">
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Join the Network</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Stay informed and help protect wildlife.</h2>
                            <p className="mt-4 text-sm leading-7 text-white/70">Get species explainers, safety resources, volunteer calls, and fresh conservation campaigns straight to your inbox.</p>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-white/80">Full name</span>
                                    <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Your name" />
                                </label>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-white/80">Email address</span>
                                    <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="name@example.com" />
                                </label>
                                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#092013] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-70">
                                    {submitting ? "Joining…" : "Join Wildlife-Pedia"} <ArrowRight className="h-4 w-4" />
                                </button>
                            </form>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <Link href="/report" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/40 bg-amber-200/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/20">
                                    <MapPinned className="h-4 w-4" /> Report sighting
                                </Link>
                                <Link href="/get-involved" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/40">
                                    <HeartHandshake className="h-4 w-4" /> Volunteer / Donate
                                </Link>
                            </div>

                            {success ? <p className="mt-4 text-sm text-emerald-200">{success}</p> : null}
                            {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
