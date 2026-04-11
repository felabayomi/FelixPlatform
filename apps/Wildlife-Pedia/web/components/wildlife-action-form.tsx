"use client";

import { useState } from "react";
import { HeartHandshake, PawPrint } from "lucide-react";
import { submitWildlifeDonor, submitWildlifeVolunteer } from "@/lib/wildlife-api";

export default function WildlifeActionForm() {
    const [mode, setMode] = useState<"volunteer" | "donate">("volunteer");
    const [form, setForm] = useState({ name: "", email: "", phone: "", amount: "50", interests: "species education and community outreach", notes: "" });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            if (mode === "volunteer") {
                await submitWildlifeVolunteer({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    interests: form.interests,
                    notes: form.notes,
                    source: "get-involved-page",
                });
                setSuccess(`Thanks${form.name ? `, ${form.name}` : ""}. Your volunteer interest has been sent.`);
            } else {
                await submitWildlifeDonor({
                    name: form.name,
                    email: form.email,
                    amount: form.amount,
                    support_type: "Species adoption / wildlife support",
                    notes: form.notes,
                    source: "get-involved-page",
                });
                setSuccess(`Thank you${form.name ? `, ${form.name}` : ""}. Your support interest has been recorded.`);
            }

            setForm((current) => ({ ...current, name: "", email: "", phone: "", notes: "" }));
        } catch (submitError) {
            console.error(submitError);
            setError("We could not complete your request right now. Please try again shortly.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="glass-panel rounded-[1.4rem] p-5">
            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode("volunteer")} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${mode === "volunteer" ? "border-emerald-300 bg-emerald-300 text-[#092013]" : "border-white/10 bg-black/20 text-white"}`}>
                    Volunteer
                </button>
                <button type="button" onClick={() => setMode("donate")} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${mode === "donate" ? "border-emerald-300 bg-emerald-300 text-[#092013]" : "border-white/10 bg-black/20 text-white"}`}>
                    Donate / Adopt
                </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
                {mode === "volunteer"
                    ? "Best for educators, storytellers, campaign helpers, and community supporters who want to contribute time or skills."
                    : "Best for donors, species adopters, and sponsors who want to back awareness, coexistence, or wildlife protection work."}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/80">Full name</span>
                    <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="Your name" required />
                </label>
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/80">Email address</span>
                    <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder="name@example.com" required />
                </label>
                {mode === "volunteer" ? (
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-white/80">Interests</span>
                        <input value={form.interests} onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" />
                    </label>
                ) : (
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-white/80">Suggested support amount (USD)</span>
                        <input type="number" min="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" />
                    </label>
                )}
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/80">Notes</span>
                    <textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-emerald-300/40" placeholder={mode === "volunteer" ? "How would you like to help?" : "What kind of species or project would you like to support?"} />
                </label>
                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#092013] transition hover:bg-emerald-200 disabled:cursor-wait disabled:opacity-70">
                    {submitting ? "Sending…" : mode === "volunteer" ? <><PawPrint className="h-4 w-4" /> Submit volunteer interest</> : <><HeartHandshake className="h-4 w-4" /> Submit support interest</>}
                </button>
            </form>

            {success ? <p className="mt-4 text-sm text-emerald-200">{success}</p> : null}
            {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
        </div>
    );
}
