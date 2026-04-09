"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

const links = [
    { href: "/#about", label: "About" },
    { href: "/#programs", label: "Programs" },
    { href: "/#learn", label: "Learn" },
    { href: "/#stories", label: "Stories" },
    { href: "/#involved", label: "Get Involved" },
];

export default function SiteHeader() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08120e]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/#top" className="flex items-center gap-3 text-white">
                    <span className="relative inline-flex h-12 w-12 overflow-hidden rounded-2xl border border-emerald-300/30 bg-white/10 shadow-lg shadow-emerald-950/20 sm:h-14 sm:w-14">
                        <Image
                            src="/waci-logo.svg"
                            alt="Wildlife Africa CREW logo"
                            fill
                            sizes="56px"
                            className="object-cover"
                            priority
                        />
                    </span>
                    <span>
                        <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">WACI</span>
                        <span className="block text-base font-semibold">Wildlife Africa</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="text-sm text-slate-200 transition hover:text-white">
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/#join"
                        className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-300/20"
                    >
                        Donate
                    </Link>
                    <Link
                        href="/#join"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-[#092013] transition hover:scale-[1.02] hover:bg-emerald-200"
                    >
                        Join the Movement <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <button
                    type="button"
                    className="inline-flex rounded-xl border border-white/10 p-2 text-white md:hidden"
                    onClick={() => setMobileOpen((current) => !current)}
                    aria-label="Toggle navigation"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {mobileOpen ? (
                <div className="border-t border-white/10 px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-4">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm text-white/75"
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link
                                href="/#join"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100"
                            >
                                Donate
                            </Link>
                            <Link
                                href="/#join"
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#092013]"
                            >
                                Join the Movement <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
