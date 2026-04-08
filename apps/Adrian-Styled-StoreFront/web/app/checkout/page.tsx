"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { createCheckout } from "@/lib/api";

export default function CheckoutPage() {
    const { items } = useCart();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        try {
            setLoading(true);
            const { url } = await createCheckout(items, email);
            window.location.href = url;
        } catch (error) {
            console.error(error);
            alert("Unable to start checkout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-semibold">Checkout</h1>

            <div className="mt-8 rounded-2xl border p-6">
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                    type="email"
                    className="w-full rounded-lg border px-4 py-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />

                <div className="mt-6 space-y-3">
                    {items.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p>${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t pt-4 text-lg font-semibold">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={!items.length || loading}
                    className="mt-6 w-full rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
                >
                    {loading ? "Redirecting..." : "Continue to Secure Checkout"}
                </button>
            </div>
        </main>
    );
}
