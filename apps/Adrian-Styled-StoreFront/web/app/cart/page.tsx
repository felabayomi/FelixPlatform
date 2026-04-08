"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/api";
import { useCart } from "@/lib/cart";

export default function CartPage() {
    const { items, addToCart, decreaseQuantity, removeFromCart, clearCart, getTotal } = useCart();
    const total = getTotal();

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Cart</p>
                <h1 className="text-3xl font-semibold text-stone-900">Your Adrian selections</h1>
                <p className="text-stone-600">Review your pieces, adjust quantities, and continue to secure checkout.</p>
            </div>

            {!items.length ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
                    <p>Your cart is empty right now.</p>
                    <Link href="/shop" className="mt-4 inline-block rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
                        Browse the collection
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <article key={item.productId} className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row">
                                <img src={item.image || "/products/placeholder-product.svg"} alt={item.title} className="h-32 w-full rounded-2xl object-cover sm:w-32" />
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-stone-900">{item.title}</h2>
                                    <p className="mt-1 text-sm text-stone-600">{formatCurrency(item.price)}</p>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <button type="button" className="rounded-full border border-stone-300 px-3 py-1 text-sm" onClick={() => decreaseQuantity(item.productId)}>
                                            -
                                        </button>
                                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                        <button type="button" className="rounded-full border border-stone-300 px-3 py-1 text-sm" onClick={() => addToCart({ ...item, quantity: 1 })}>
                                            +
                                        </button>
                                        <button type="button" className="ml-auto text-sm font-semibold text-rose-600" onClick={() => removeFromCart(item.productId)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-stone-900">Order summary</h2>
                        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-stone-600">
                            <span>Shipping</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <div className="mt-4 border-t border-stone-200 pt-4 text-base font-semibold text-stone-900">
                            <div className="flex items-center justify-between">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <Link href="/checkout" className="block rounded-full bg-stone-900 px-5 py-3 text-center text-sm font-semibold text-white">
                                Proceed to checkout
                            </Link>
                            <button type="button" className="w-full rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900" onClick={clearCart}>
                                Clear cart
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
