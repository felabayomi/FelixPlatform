"use client";

import Link from "next/link";
import { Menu, PawPrint, X } from "lucide-react";
import { useMemo, useState } from "react";

const baseLinks = [
    { href: "/#about", label: "About" },
    { href: "/species", label: "Species" },
    { href: "/habitats", label: "Habitats" },
    { href: "/safety", label: "Safety" },
    { href: "/projects", label: "Projects" },
    { href: "/report", label: "Report" },
    { href: "/blog", label: "Blog" },
    { href: "/get-involved", label: "Get Involved" },
];

type WildlifeSiteHeaderProps = {
    customLinks?: Array<{ href: string; label: string }>;
};

export default function WildlifeSiteHeader({ customLinks = [] }: WildlifeSiteHeaderProps) {
    const [open, setOpen] = useState(false);
    const links = useMemo(() => [...baseLinks, ...customLinks], [customLinks]);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08120e]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3 text-white">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-200 shadow-lg">
                        <PawPrint className="h-6 w-6" />
                    </span>
                    <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">A & F Wildlife Foundation</span>
                        <span className="block text-base font-semibold">Wildlife-Pedia</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-5 md:flex">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="text-sm text-slate-200 transition hover:text-white">
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <Link href="/report" className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-300/20">
                        Report a sighting
                    </Link>
                    <Link href="/get-involved" className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-[#092013] transition hover:bg-emerald-200">
                        Take Action
                    </Link>
                </div>

                <button
                    type="button"
                    className="inline-flex rounded-xl border border-white/10 p-2 text-white md:hidden"
                    onClick={() => setOpen((current) => !current)}
                    aria-label="Toggle navigation"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {open ? (
                <div className="border-t border-white/10 px-4 py-4 md:hidden">
                    <div className="flex flex-col gap-4">
                        {links.map((link) => (
                            <Link key={link.href} href={link.href} className="text-sm text-white/75" onClick={() => setOpen(false)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}
        </header>
    );
}
