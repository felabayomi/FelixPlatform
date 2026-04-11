"use client";

import { useState } from "react";
import { MapPinned } from "lucide-react";
import { submitWildlifeSighting } from "@/lib/wildlife-api";

export default function WildlifeSightingForm() {
    const [form, setForm] = useState({ name: "", email: "", species: "", location: "", notes: "", image_url: "" });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            await submitWildlifeSighting(form);
            setSuccess("Thanks — your sighting report has been recorded for review.");
            setForm({ name: "", email: "", species: "", location: "", notes: "", image_url: "" });
        } catch (submitError) {
            console.error(submitError);
            setError("We could not submit the sighting right now. Please try again shortly.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel rounded-[1.4rem] p-5 space-y-4">
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Name</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Optional" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Optional" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Species seen</span>
                <input value={form.species} onChange={(event) => setForm((current) => ({ ...current, species: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="If known" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Location</span>
                <input required value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Village, road, park edge, GPS note, etc." />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">Image URL</span>
                <input value={form.image_url} onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Optional" />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/80">What happened?</span>
                <textarea rows={5} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Describe the sighting, direction of movement, and any immediate concerns." />
            </label>
            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#092013] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-70">
                <MapPinned className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit sighting report"}
            </button>
            {success ? <p className="text-sm text-emerald-200">{success}</p> : null}
            {error ? <p className="text-sm text-rose-200">{error}</p> : null}
        </form>
    );
}
