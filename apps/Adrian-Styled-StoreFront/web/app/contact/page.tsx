"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { submitSupportRequest } from "@/lib/api";

export default function ContactPage() {
    const [form, setForm] = useState({
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        subject: "Adrian Store contact request",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            await submitSupportRequest(form);
            setSuccessMessage("Your message has been sent to Adrian’s support inbox. We’ll reply by email shortly.");
            setForm({
                contactName: "",
                contactEmail: "",
                contactPhone: "",
                subject: "Adrian Store contact request",
                message: "",
            });
        } catch (error) {
            console.error("Unable to submit contact form", error);
            setErrorMessage("We could not send your message right now. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-lg sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Contact</p>
                <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">Get in touch with Adrian</h1>
                <p className="mt-3 max-w-2xl text-stone-600">
                    Use the form below for styling questions, order support, availability checks, or boutique inquiries.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Full name</span>
                        <input
                            required
                            value={form.contactName}
                            onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="Your name"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Email</span>
                        <input
                            required
                            type="email"
                            value={form.contactEmail}
                            onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="you@example.com"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Phone</span>
                        <input
                            value={form.contactPhone}
                            onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="Optional"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Subject</span>
                        <input
                            value={form.subject}
                            onChange={(event) => setForm({ ...form, subject: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="What can we help with?"
                        />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-stone-700">Message</span>
                        <textarea
                            required
                            rows={6}
                            value={form.message}
                            onChange={(event) => setForm({ ...form, message: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="Tell Adrian’s team how we can help."
                        />
                    </label>

                    <div className="flex flex-wrap gap-3 md:col-span-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Sending..." : "Send message"}
                        </button>

                        <Link
                            href="/shop"
                            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-900"
                        >
                            Back to shop
                        </Link>
                    </div>
                </form>

                {successMessage ? (
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {successMessage}
                    </div>
                ) : null}

                {errorMessage ? (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
