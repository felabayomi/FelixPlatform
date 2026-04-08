"use client";

import clsx from "clsx";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/services", label: "Services" },
    { href: "/cart", label: "Cart" },
];

export default function Header() {
    const pathname = usePathname();
    const { items } = useCart();

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
                        Adrian Store
                    </span>
                    <span className="text-lg font-semibold text-stone-900 sm:text-xl">
                        Adrian&apos;s Styled Collection
                    </span>
                </Link>

                <nav className="flex items-center gap-2 sm:gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                                pathname === link.href
                                    ? "bg-stone-900 text-white"
                                    : "text-stone-700 hover:bg-stone-100",
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <Link
                        href="/cart"
                        className="flex items-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        <span>{cartCount}</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
