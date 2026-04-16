"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/waci/site-header";
import { SiteFooter } from "@/components/waci/site-footer";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com").replace(/\/$/, "");

export default function ApplyPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role_interest: "volunteer",
        motivation: "",
        experience: "",
        location: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/api/waci-hub/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, project_slug: slug }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Submission failed");
            setSubmitted(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const field = (key: keyof typeof form) => ({
        value: form[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm((f) => ({ ...f, [key]: e.target.value })),
    });

    return (
        <>
            <SiteHeader />

            <section className="section">
                <div className="container" style={{ maxWidth: 680 }}>
                    {submitted ? (
                        <div className="card" style={{ padding: 40, textAlign: "center" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                            <h2 style={{ marginBottom: 12 }}>Application received</h2>
                            <p style={{ color: "var(--muted)", lineHeight: 1.8, marginBottom: 24 }}>
                                Thank you for your interest in the <strong>{slug.replace(/-/g, " ")}</strong> project.
                                Our team will review your application and reach out if you are selected.
                                Only awarded applicants will be issued an account to proceed.
                            </p>
                            <a href={`/projects/${slug}`} className="btn btn-secondary">
                                Back to project
                            </a>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 28 }}>
                                <a href={`/projects/${slug}`} style={{ color: "var(--muted)", fontSize: 14 }}>
                                    ← Back to project
                                </a>
                                <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "12px 0 8px" }}>
                                    Apply for this project
                                </h1>
                                <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
                                    Fill in the form below to express your interest. Applications are reviewed manually.
                                    Only selected applicants will be issued a login to access the grantee dashboard.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="card" style={{ padding: 32, display: "grid", gap: 20 }}>
                                {error && (
                                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", fontSize: 14 }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontWeight: 700, fontSize: 14 }}>Full Name *</label>
                                    <input required placeholder="Grace Okonkwo" {...field("name")} />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <label style={{ fontWeight: 700, fontSize: 14 }}>Email *</label>
                                        <input required type="email" placeholder="you@email.com" {...field("email")} />
                                    </div>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <label style={{ fontWeight: 700, fontSize: 14 }}>Phone</label>
                                        <input type="tel" placeholder="+234..." {...field("phone")} />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <label style={{ fontWeight: 700, fontSize: 14 }}>Role interest *</label>
                                        <select {...field("role_interest")} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>
                                            <option value="volunteer">Volunteer</option>
                                            <option value="grantee">Grantee (grant recipient)</option>
                                            <option value="both">Both volunteer & grantee</option>
                                        </select>
                                    </div>
                                    <div style={{ display: "grid", gap: 6 }}>
                                        <label style={{ fontWeight: 700, fontSize: 14 }}>Your location</label>
                                        <input placeholder="City, Country" {...field("location")} />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontWeight: 700, fontSize: 14 }}>Why do you want to join this project? *</label>
                                    <textarea
                                        required
                                        rows={5}
                                        placeholder="Describe your motivation and what you hope to contribute..."
                                        {...field("motivation")}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>

                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontWeight: 700, fontSize: 14 }}>Relevant experience</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Any relevant background, skills, or past work..."
                                        {...field("experience")}
                                        style={{ resize: "vertical" }}
                                    />
                                </div>

                                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    <a href={`/projects/${slug}`} className="btn btn-secondary">Cancel</a>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? "Submitting…" : "Submit application"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </section>

            <SiteFooter />
        </>
    );
}
