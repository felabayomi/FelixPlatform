"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderBySession } from "@/lib/api";
import { useCart } from "@/lib/cart";

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { clearCart } = useCart();

    useEffect(() => {
        if (!sessionId) {
            setLoading(false);
            return;
        }

        getOrderBySession(sessionId)
            .then((res) => {
                setData(res);
                clearCart();
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [sessionId, clearCart]);

    if (loading) {
        return <main className="p-10">Loading your order...</main>;
    }

    if (!data?.order) {
        return <main className="p-10">Your payment was received. Order details are being finalized.</main>;
    }

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="text-3xl font-semibold">Thank you for your order</h1>
            <p className="mt-2 text-gray-600">
                Order ID: <span className="font-medium">{data.order.id}</span>
            </p>

            <div className="mt-8 rounded-2xl border p-6">
                <div className="space-y-3">
                    {data.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{item.product_title}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p>${Number(item.unit_price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${Number(data.order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>${Number(data.order.shipping_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${Number(data.order.tax_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>${Number(data.order.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
