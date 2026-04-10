"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import {
    submitDonorInterest,
    submitNewsletterSignup,
    submitPartnerInterest,
    submitVolunteerInterest,
} from "@/lib/api";

type InterestOption = "Volunteer" | "Learn" | "Partnership" | "Donate";

const INITIAL_FORM = {
    name: "",
    email: "",
    interest: "Volunteer" as InterestOption,
};

export default function NewsletterSignup() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setSuccess("");
        setError("");

        try {
            const displayName = form.name.trim() || "friend";

            if (form.interest === "Volunteer") {
                await submitVolunteerInterest({
                    name: form.name,
                    email: form.email,
                    interest: "Wildlife volunteering",
                    source: "homepage-join-form",
                });
                setSuccess(`Thanks, ${displayName}. Your volunteer interest has been received.`);
            } else if (form.interest === "Partnership") {
                await submitPartnerInterest({
                    name: form.name,
                    email: form.email,
                    partnershipType: "Strategic partnership",
                    source: "homepage-join-form",
                });
                setSuccess(`Thanks, ${displayName}. Your partnership interest has been sent to WACI.`);
            } else if (form.interest === "Donate") {
                await submitDonorInterest({
                    name: form.name,
                    email: form.email,
                    supportType: "Donate",
                    source: "homepage-donate-button",
                });
                setSuccess(`Thank you, ${displayName}. Your donor interest has been recorded. You can continue through WACI’s secure Stripe checkout from the donate path.`);
            } else {
                await submitNewsletterSignup({
                    full_name: form.name,
                    email: form.email,
                    source: "homepage-newsletter",
                    interests: ["wildlife updates", "impact stories"],
                });
                setSuccess(`You’re in, ${displayName} — WACI updates will reach your inbox soon.`);
            }

            setForm(INITIAL_FORM);
        } catch (submitError) {
            console.error(submitError);
            setError("We could not complete your request right now. Please try again shortly.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="newsletter-form"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45 }}
        >
            <div className="newsletter-grid">
                <label>
                    <span className="soft-label">Full name</span>
                    <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Your name"
                    />
                </label>
                <label>
                    <span className="soft-label">Email address</span>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="you@example.com"
                    />
                </label>
                <label>
                    <span className="soft-label">I’m interested in</span>
                    <select
                        value={form.interest}
                        onChange={(event) => setForm((current) => ({ ...current, interest: event.target.value as InterestOption }))}
                        className="newsletter-select"
                    >
                        <option value="Volunteer">Volunteer</option>
                        <option value="Learn">Learn</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Donate">Donate</option>
                    </select>
                </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
                >
                    {submitting ? "Sending…" : "Subscribe & Connect"}
                </button>
                <Link
                    href="/?source=donate#join"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-300/20"
                >
                    Donate <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Mail className="h-4 w-4 text-emerald-200" />
                    Monthly stories, opportunities, and field updates.
                </span>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-400">
                Select <strong className="text-slate-200">Donate</strong> to register donor interest, or use the main WACI donate path for the live secure Stripe checkout.
            </p>

            {success ? <p className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{success}</p> : null}
            {error ? <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
        </motion.form>
    );
}
