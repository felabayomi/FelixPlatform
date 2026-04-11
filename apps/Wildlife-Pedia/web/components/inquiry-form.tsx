"use client";

import { FormEvent, useState } from "react";
import { submitSupportRequest } from "@/lib/api";

const initialForm = {
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    subject: "Partnership enquiry",
    message: "",
};

export default function InquiryForm() {
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const updateField = (field: keyof typeof initialForm, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            await submitSupportRequest(form);
            setSuccess("Thanks — your message has been sent to the WACI team.");
            setForm(initialForm);
        } catch (submissionError) {
            console.error(submissionError);
            setError("We could not send your message right now. Please try again shortly.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel space-y-4 rounded-[1.5rem] p-6">
            <div>
                <h2 className="text-2xl font-semibold text-white">Contact WACI</h2>
                <p className="mt-2 text-sm text-slate-300">
                    This form is wired into the shared Felix support and notification system.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-200">
                    <span>Name</span>
                    <input
                        required
                        value={form.contact_name}
                        onChange={(event) => updateField("contact_name", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300"
                    />
                </label>

                <label className="space-y-2 text-sm text-slate-200">
                    <span>Email</span>
                    <input
                        type="email"
                        required
                        value={form.contact_email}
                        onChange={(event) => updateField("contact_email", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300"
                    />
                </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-200">
                    <span>Phone</span>
                    <input
                        value={form.contact_phone}
                        onChange={(event) => updateField("contact_phone", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300"
                    />
                </label>

                <label className="space-y-2 text-sm text-slate-200">
                    <span>Subject</span>
                    <input
                        value={form.subject}
                        onChange={(event) => updateField("subject", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300"
                    />
                </label>
            </div>

            <label className="space-y-2 text-sm text-slate-200">
                <span>Message</span>
                <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-emerald-300"
                />
            </label>

            {success ? <p className="text-sm text-emerald-200">{success}</p> : null}
            {error ? <p className="text-sm text-rose-200">{error}</p> : null}

            <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {submitting ? "Sending…" : "Send message"}
            </button>
        </form>
    );
}
