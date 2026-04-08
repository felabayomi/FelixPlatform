"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function Header() {
    const { items } = useCart();

    return (
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <div>
                    <p className="text-xs tracking-[0.3em] text-gray-500">
                        ADRIAN STORE
                    </p>
                    <h1 className="text-lg font-semibold">
                        Adrian’s Styled Collection
                    </h1>
                </div>

                <nav className="flex items-center gap-6 text-sm">
                    <Link href="/" className="hover:text-gray-500">Home</Link>
                    <Link href="/shop" className="hover:text-gray-500">Shop</Link>
                    <Link href="/services" className="hover:text-gray-500">Services</Link>
                    <Link href="/cart" className="hover:text-gray-500">
                        Cart ({items.length})
                    </Link>
                    <Link
                        href="/quote"
                        className="rounded-full border border-stone-900 px-4 py-2 font-medium transition hover:bg-stone-900 hover:text-white"
                    >
                        Request a Quote
                    </Link>
                </nav>
            </div>
        </header>
    );
}
