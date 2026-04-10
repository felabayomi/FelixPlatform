"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { submitWaciStory } from "@/lib/api";

const initialForm = {
    title: "",
    summary: "",
    authorName: "",
    authorEmail: "",
    location: "",
    image: "",
    link: "",
};

export default function SubmitStoryPage() {
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const updateField = (field: keyof typeof initialForm, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            const response = await submitWaciStory({
                ...form,
                source: "waci-submit-story-page",
            });

            setSuccess(response?.message || "Your story has been submitted and saved as pending review.");
            setForm(initialForm);
        } catch (submitError: any) {
            setError(submitError?.response?.data?.message || "Unable to submit your story right now.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                    <p className="soft-label">Submit a Story</p>
                    <h1 className="mt-3 text-4xl font-semibold text-white">Share a real conservation story with WACI.</h1>
                    <p className="mt-4 max-w-xl text-slate-300">
                        Every submission is saved as <strong>pending</strong> first. The WACI team then reviews, publishes, rejects,
                        or features it from the shared admin dashboard.
                    </p>

                    <div className="mt-6 space-y-3 text-sm text-slate-300">
                        {[
                            "Step 1: Submit your title, summary, and contact details.",
                            "Step 2: WACI saves the story as pending review.",
                            "Step 3: Admin can publish, reject, or feature it.",
                            "Step 4: Published stories can earn rewards from views, likes, and shares.",
                        ].map((item) => (
                            <div key={item} className="glass-panel rounded-[1.15rem] px-4 py-3">
                                {item}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href="/stories"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/85 hover:border-emerald-300/40"
                        >
                            Browse published stories <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <form className="newsletter-form space-y-4" onSubmit={handleSubmit}>
                    <div className="newsletter-grid">
                        <label>
                            <span className="text-sm text-slate-200">Story title</span>
                            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="e.g. Restoring wetlands in northern Ghana" required />
                        </label>
                        <label>
                            <span className="text-sm text-slate-200">Location</span>
                            <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="e.g. Ghana" />
                        </label>
                        <label>
                            <span className="text-sm text-slate-200">Author name</span>
                            <input value={form.authorName} onChange={(event) => updateField("authorName", event.target.value)} placeholder="Your full name" required />
                        </label>
                        <label>
                            <span className="text-sm text-slate-200">Author email</span>
                            <input type="email" value={form.authorEmail} onChange={(event) => updateField("authorEmail", event.target.value)} placeholder="you@example.com" required />
                        </label>
                        <label>
                            <span className="text-sm text-slate-200">Image URL (optional)</span>
                            <input value={form.image} onChange={(event) => updateField("image", event.target.value)} placeholder="https://..." />
                        </label>
                        <label>
                            <span className="text-sm text-slate-200">Original/source link (optional)</span>
                            <input value={form.link} onChange={(event) => updateField("link", event.target.value)} placeholder="https://..." />
                        </label>
                    </div>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm text-slate-200">Story summary</span>
                        <textarea
                            value={form.summary}
                            onChange={(event) => updateField("summary", event.target.value)}
                            placeholder="Tell WACI what happened, why it matters, and what readers should understand."
                            required
                            rows={8}
                            className="rounded-3xl border border-white/12 bg-white/5 px-4 py-3 text-white outline-none"
                        />
                    </label>

                    {success ? (
                        <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                            <div className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {success}</div>
                        </div>
                    ) : null}

                    {error ? (
                        <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                            {error}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#092013] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? "Submitting…" : "Submit story for review"}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
