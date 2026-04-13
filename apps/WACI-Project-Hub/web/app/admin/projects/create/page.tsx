"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project as LifecycleProject } from "@/lib/waci-lifecycle-types";

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com"
).replace(/\/$/, "");

type ProjectDraft = Pick<
    LifecycleProject,
    | "title"
    | "location"
    | "summary"
    | "focus"
    | "durationMonths"
    | "monthlyFunding"
    | "objectives"
    | "deliverables"
    | "methodology"
    | "reportingRequirements"
>;

const EMPTY_PROJECT: ProjectDraft = {
    title: "",
    location: "",
    summary: "",
    focus: "",
    durationMonths: 12,
    monthlyFunding: 300,
    objectives: [],
    deliverables: [],
    methodology: [],
    reportingRequirements: [],
};

function validateProject(p: any) {
    if (!p?.title) throw new Error("Missing title");
    if (!p?.objectives?.length) throw new Error("Missing objectives");
    if (!p?.deliverables?.length) throw new Error("Missing deliverables");

    const objectiveCount = Array.isArray(p.objectives) ? p.objectives.length : 0;
    const deliverableCount = Array.isArray(p.deliverables) ? p.deliverables.length : 0;
    if (objectiveCount > 5) throw new Error("Objectives must be 5 or fewer");
    if (deliverableCount > 6) throw new Error("Deliverables must be 6 or fewer");

    const textBlob = [
        ...(Array.isArray(p.deliverables) ? p.deliverables : []),
        ...(Array.isArray(p.reportingRequirements) ? p.reportingRequirements : []),
        p.summary,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (!textBlob.includes("daily log")) {
        throw new Error("Missing required reporting item: daily logs");
    }
    if (!textBlob.includes("monthly report")) {
        throw new Error("Missing required reporting item: monthly report");
    }
    if (!textBlob.includes("final report")) {
        throw new Error("Missing required reporting item: final report");
    }

    const amount = Number(p?.monthlyFunding);
    if (Number.isNaN(amount) || amount < 100 || amount > 500) {
        throw new Error("Monthly funding must be between $100 and $500");
    }

    return true;
}

function slugify(value: string): string {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 80);
}

function listToText(items: string[] = []): string {
    return items.join("\n");
}

function textToList(value: string): string[] {
    return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

export default function CreateProjectPage() {
    const [input, setInput] = useState("");
    const [project, setProject] = useState<ProjectDraft | null>(null);
    const [loading, setLoading] = useState(false);
    const [regenLoading, setRegenLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [savedProjectId, setSavedProjectId] = useState<number | null>(null);
    const [grantOfferId, setGrantOfferId] = useState<number | null>(null);
    const [creatingOffer, setCreatingOffer] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem("waci_ai_project_draft");
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.input) setInput(parsed.input);
            if (parsed?.project) setProject(parsed.project);
        } catch {
            // Ignore bad local draft payloads.
        }
    }, []);

    const updateTextField = (
        key: Extract<keyof ProjectDraft, "title" | "location" | "summary" | "focus">
        , value: string) => {
        if (!project) return;
        setProject({ ...project, [key]: value });
    };

    const updateNumberField = (
        key: Extract<keyof ProjectDraft, "durationMonths" | "monthlyFunding">,
        value: string
    ) => {
        if (!project) return;
        const next = Number(value);
        setProject({ ...project, [key]: Number.isNaN(next) ? 0 : next });
    };

    const updateListField = (key: keyof ProjectDraft, value: string) => {
        if (!project) return;
        setProject({ ...project, [key]: textToList(value) as any });
    };

    const generate = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const res = await fetch("/api/ai/generate-project", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ input }),
        });

        if (!res.ok) {
            setLoading(false);
            throw new Error(`Generate failed (${res.status})`);
        }

        const data = await res.json();
        const normalized = { ...EMPTY_PROJECT, ...(data || {}) };
        if ((data as any)?.reporting && !(data as any)?.reportingRequirements) {
            normalized.reportingRequirements = (data as any).reporting;
        }
        setProject(normalized);
        setLoading(false);
    };

    const regenerateSection = async (section: keyof ProjectDraft) => {
        if (!project) return;
        setError(null);
        setSuccess(null);
        setRegenLoading(section);
        try {
            const res = await fetch("/api/ai/generate-project", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input,
                    section,
                    current: project,
                }),
            });

            if (!res.ok) {
                throw new Error(`Regenerate failed (${res.status})`);
            }

            const data = await res.json();
            const nextValue = data?.[section];
            if (nextValue === undefined) {
                throw new Error(`AI did not return section: ${section}`);
            }

            setProject({
                ...project,
                [section]: Array.isArray(project[section])
                    ? (Array.isArray(nextValue) ? nextValue : [String(nextValue)])
                    : (typeof project[section] === "number" ? Number(nextValue) : String(nextValue)),
            } as ProjectDraft);
            setSuccess(`Regenerated ${section}.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : `Failed to regenerate ${section}`);
        } finally {
            setRegenLoading(null);
        }
    };

    const save = async (asDraft = false) => {
        setError(null);
        setSuccess(null);

        try {
            if (!project) {
                throw new Error("Generate a project first.");
            }

            validateProject(project);

            const payload = {
                title: project.title,
                slug: slugify(project.title),
                purpose: project.summary,
                objectives: listToText(project.objectives),
                methodology: listToText(project.methodology),
                deliverables: listToText(project.deliverables),
                expectations: listToText(project.reportingRequirements),
                expectations_meta: {
                    durationMonths: project.durationMonths,
                    monthlyFunding: project.monthlyFunding,
                },
                region: project.location,
                status: asDraft ? "draft" : "published",
            };

            const expectationsWithMeta = `${payload.expectations}\n\nDURATION_MONTHS: ${project.durationMonths}\nMONTHLY_FUNDING_USD: ${project.monthlyFunding}`;

            const token = localStorage.getItem("waci_hub_token");

            localStorage.setItem(
                "waci_ai_project_draft",
                JSON.stringify({ input, project, savedAt: new Date().toISOString() })
            );

            const response = await fetch(`${API_BASE}/api/waci/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ ...payload, expectations: expectationsWithMeta }),
            });

            if (!response.ok) {
                if (asDraft) {
                    setSuccess("Draft saved locally. Backend draft save is unavailable right now.");
                    return;
                }
                throw new Error(`Save failed (${response.status})`);
            }

            const saved = await response.json();
            if (saved?.id) {
                setSavedProjectId(Number(saved.id));
            }

            setSuccess(asDraft ? "Draft saved." : "Project validated and saved.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Validation failed");
        }
    };

    const generateGrantOffer = async () => {
        if (!savedProjectId) return;
        const token = localStorage.getItem("waci_hub_token");
        setCreatingOffer(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_BASE}/api/waci-hub/grants/from-project/${savedProjectId}`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!response.ok) {
                throw new Error(`Grant offer generation failed (${response.status})`);
            }
            const offer = await response.json();
            setGrantOfferId(Number(offer.id));
            setSuccess("Grant offer generated from project. You can now assign and send it.");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate grant offer");
        } finally {
            setCreatingOffer(false);
        }
    };

    return (
        <div className="container section">
            <div className="card" style={{ padding: 24 }}>
                <h2>Create Project (AI Powered)</h2>

                <textarea
                    placeholder="Describe the project idea..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    style={{
                        width: "100%",
                        height: 140,
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 12,
                    }}
                />

                <button className="btn btn-primary" onClick={generate}>
                    {loading ? "Generating..." : "Generate Project"}
                </button>

                {error && (
                    <div style={{ marginTop: 10, color: "#991b1b", fontSize: 14 }}>{error}</div>
                )}

                {success && (
                    <div style={{ marginTop: 10, color: "#166534", fontSize: 14 }}>{success}</div>
                )}
            </div>

            {project && (
                <div className="card" style={{ padding: 24, marginTop: 20 }}>
                    <h3 style={{ marginBottom: 12 }}>Edit before save</h3>

                    <div style={{ display: "grid", gap: 10 }}>
                        <input
                            value={project.title}
                            onChange={(e) => updateTextField("title", e.target.value)}
                            placeholder="Project title"
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />
                        <input
                            value={project.location}
                            onChange={(e) => updateTextField("location", e.target.value)}
                            placeholder="Location"
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />
                        <input
                            value={project.focus}
                            onChange={(e) => updateTextField("focus", e.target.value)}
                            placeholder="Focus"
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />
                        <input
                            value={project.durationMonths}
                            onChange={(e) => updateNumberField("durationMonths", e.target.value)}
                            placeholder="Duration (months)"
                            type="number"
                            min={1}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />
                        <input
                            value={project.monthlyFunding}
                            onChange={(e) => updateNumberField("monthlyFunding", e.target.value)}
                            placeholder="Monthly Funding (100-500)"
                            type="number"
                            min={100}
                            max={500}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />

                        <label style={{ fontWeight: 700 }}>Summary</label>
                        <textarea
                            value={project.summary}
                            onChange={(e) => updateTextField("summary", e.target.value)}
                            rows={4}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={{ fontWeight: 700 }}>Objectives</label>
                            <button className="btn btn-secondary" type="button" onClick={() => regenerateSection("objectives")} disabled={regenLoading === "objectives"}>
                                {regenLoading === "objectives" ? "Regenerating..." : "Regenerate Objectives"}
                            </button>
                        </div>
                        <textarea
                            value={listToText(project.objectives)}
                            onChange={(e) => updateListField("objectives", e.target.value)}
                            rows={6}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={{ fontWeight: 700 }}>Deliverables</label>
                            <button className="btn btn-secondary" type="button" onClick={() => regenerateSection("deliverables")} disabled={regenLoading === "deliverables"}>
                                {regenLoading === "deliverables" ? "Regenerating..." : "Regenerate Deliverables"}
                            </button>
                        </div>
                        <textarea
                            value={listToText(project.deliverables)}
                            onChange={(e) => updateListField("deliverables", e.target.value)}
                            rows={6}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={{ fontWeight: 700 }}>Methodology</label>
                            <button className="btn btn-secondary" type="button" onClick={() => regenerateSection("methodology")} disabled={regenLoading === "methodology"}>
                                {regenLoading === "methodology" ? "Regenerating..." : "Regenerate Methodology"}
                            </button>
                        </div>
                        <textarea
                            value={listToText(project.methodology)}
                            onChange={(e) => updateListField("methodology", e.target.value)}
                            rows={6}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={{ fontWeight: 700 }}>Reporting</label>
                            <button className="btn btn-secondary" type="button" onClick={() => regenerateSection("reportingRequirements")} disabled={regenLoading === "reportingRequirements"}>
                                {regenLoading === "reportingRequirements" ? "Regenerating..." : "Regenerate Reporting"}
                            </button>
                        </div>
                        <textarea
                            value={listToText(project.reportingRequirements)}
                            onChange={(e) => updateListField("reportingRequirements", e.target.value)}
                            rows={6}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <button className="btn btn-secondary" onClick={() => save(true)}>
                            Save as Draft
                        </button>
                        <button className="btn btn-primary" onClick={() => save(false)}>
                            Save Project
                        </button>
                        {savedProjectId && (
                            <Link href={`/admin/projects/${savedProjectId}`} className="btn btn-secondary">
                                Review Project
                            </Link>
                        )}
                        {savedProjectId && (
                            <button className="btn btn-secondary" onClick={generateGrantOffer} disabled={creatingOffer}>
                                {creatingOffer ? "Generating Offer..." : "Generate Grant Offer"}
                            </button>
                        )}
                    </div>

                    {grantOfferId && (
                        <div style={{ marginTop: 12, fontSize: 14 }}>
                            Generated offer ID: <strong>{grantOfferId}</strong>{" "}
                            <Link href={`/admin/grants/${grantOfferId}`}>
                                Open Grant Detail
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
