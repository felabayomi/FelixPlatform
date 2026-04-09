import Link from "next/link";
import { getStorefrontContent } from "@/lib/api";

const footerLinks = [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/data-usage", label: "Data Usage" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/contact", label: "Contact" },
];

export default async function Footer() {
    const content = await getStorefrontContent();

    return (
        <footer className="mt-auto border-t border-stone-200 bg-stone-50">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 text-sm text-stone-600 sm:px-6 lg:grid-cols-[1.2fr_0.9fr] lg:px-8">
                <div className="space-y-2">
                    <p className="font-semibold text-stone-900">{content.footerTitle}</p>
                    <p>{content.footerText}</p>
                    <p>{content.footerSubtext}</p>
                    {content.supportEmail ? (
                        <a href={`mailto:${content.supportEmail}`} className="font-medium text-stone-900 underline-offset-4 hover:underline">
                            {content.supportEmail}
                        </a>
                    ) : null}
                </div>

                <div>
                    <p className="mb-3 font-semibold text-stone-900">Customer information</p>
                    <div className="grid grid-cols-2 gap-2">
                        {footerLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
