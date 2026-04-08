"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createCheckout, formatCurrency } from "@/lib/api";
import { useCart } from "@/lib/cart";

export default function CheckoutPage() {
    const { items, getTotal } = useCart();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const total = getTotal();
    const hasItems = items.length > 0;
    const canCheckout = hasItems && !!email.trim();

    const itemSummary = useMemo(() => items.map((item) => `${item.title} × ${item.quantity}`).join(", "), [items]);

    const handleCheckout = async () => {
        if (!canCheckout) {
            setError("Please add at least one item and enter an email address.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const payload = items.map((item) => ({
                productId: item.productId,
                slug: item.slug,
                title: item.title,
                price: item.price,
                image: item.image,
                quantity: item.quantity,
            }));

            const response = await createCheckout(payload, { name, email, phone });

            if (response?.url) {
                window.location.href = response.url;
                return;
            }

            setError("Stripe checkout did not return a redirect URL.");
        } catch (checkoutError) {
            console.error(checkoutError);
            setError("Unable to start checkout right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Checkout</p>
                <h1 className="text-3xl font-semibold text-stone-900">Secure your Adrian order</h1>
                <p className="text-stone-600">Complete checkout through Stripe using the shared Felix backend.</p>
            </div>

            {!hasItems ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
                    <p>Your cart is empty. Add a few pieces before checking out.</p>
                    <Link href="/shop" className="mt-4 inline-block rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
                        Back to shop
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
                    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-stone-900">Customer details</h2>
                        <div className="mt-4 grid gap-4">
                            <label className="grid gap-2 text-sm font-medium text-stone-700">
                                Full name
                                <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900" placeholder="Adrian shopper" />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-stone-700">
                                Email address *
                                <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900" placeholder="you@example.com" type="email" required />
                            </label>
                            <label className="grid gap-2 text-sm font-medium text-stone-700">
                                Phone number
                                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-stone-900" placeholder="(555) 555-5555" />
                            </label>
                        </div>

                        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
                    </section>

                    <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-stone-900">Order summary</h2>
                        <p className="mt-2 text-sm text-stone-600">{itemSummary}</p>

                        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(total)}</span>
                        </div>

                        <div className="mt-4 border-t border-stone-200 pt-4 text-base font-semibold text-stone-900">
                            <div className="flex items-center justify-between">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <button type="button" onClick={handleCheckout} disabled={!canCheckout || loading} className="mt-6 w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400">
                            {loading ? "Redirecting to Stripe..." : "Pay now"}
                        </button>
                    </aside>
                </div>
            )}
        </div>
    );
}
