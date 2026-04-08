"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { submitQuoteRequest } from "@/lib/api";

export default function QuotePage() {
    const searchParams = useSearchParams();
    const initialProduct = useMemo(() => searchParams.get("title") || "", [searchParams]);
    const initialProductId = useMemo(() => searchParams.get("productId") || "", [searchParams]);

    const [form, setForm] = useState({
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        productName: initialProduct,
        quantity: "1",
        details: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await submitQuoteRequest({
                productId: initialProductId || undefined,
                productName: form.productName,
                quantity: Number(form.quantity) || 1,
                contactName: form.contactName,
                contactEmail: form.contactEmail,
                contactPhone: form.contactPhone,
                details: form.details,
            });

            setSuccessMessage(
                `Your quote request has been sent. Reference #${response.id}. We will reply by email shortly.`,
            );
            setForm((current) => ({
                ...current,
                contactName: "",
                contactEmail: "",
                contactPhone: "",
                quantity: "1",
                details: "",
            }));
        } catch (error) {
            console.error("Unable to send quote request", error);
            setErrorMessage("We could not send your request right now. Please try again in a moment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-lg sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Request a Quote</p>
                <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">Tell us what you need</h1>
                <p className="mt-3 max-w-2xl text-stone-600">
                    Share your product or styling request and Adrian&apos;s team will email you pricing, availability, and next steps.
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
                            required
                            value={form.contactPhone}
                            onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="(555) 123-4567"
                        />
                    </label>

                    <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Product or service</span>
                        <input
                            value={form.productName}
                            onChange={(event) => setForm({ ...form, productName: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="e.g. Special occasion styling"
                        />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-stone-700">Quantity</span>
                        <input
                            min="1"
                            type="number"
                            value={form.quantity}
                            onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                        />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-stone-700">Details</span>
                        <textarea
                            rows={6}
                            value={form.details}
                            onChange={(event) => setForm({ ...form, details: event.target.value })}
                            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-900"
                            placeholder="Tell us about the look, event, size, color preference, or anything else you want included."
                        />
                    </label>

                    <div className="flex flex-wrap gap-3 md:col-span-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Sending..." : "Send request"}
                        </button>

                        <Link
                            href="/services"
                            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-900"
                        >
                            Back to services
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
