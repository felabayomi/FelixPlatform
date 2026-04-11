import type { Metadata } from "next";
import WildlifeSiteFooter from "@/components/wildlife-site-footer";
import WildlifeSiteHeader from "@/components/wildlife-site-header";
import { getWildlifePediaSiteContent } from "@/lib/wildlife-api";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const content = await getWildlifePediaSiteContent();
    const title = "Wildlife-Pedia | Wildlife intelligence for everyday people";
    const description = content.heroText;

    return {
        metadataBase: new URL("https://wildlife-pedia.com"),
        title,
        description,
        applicationName: "Wildlife-Pedia",
        keywords: [
            "Wildlife-Pedia",
            "wildlife education",
            "African wildlife",
            "human wildlife conflict",
            "species directory",
            "conservation projects",
        ],
        alternates: {
            canonical: "/",
        },
        openGraph: {
            title,
            description,
            url: "https://wildlife-pedia.com",
            siteName: "Wildlife-Pedia",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const content = await getWildlifePediaSiteContent();
    const reservedSlugs = new Set(["about", "species", "habitats", "safety", "projects", "blog", "report", "get-involved", "contact"]);
    const customLinks = Array.isArray(content.pages)
        ? content.pages
            .filter((page) => page?.slug && page.showInNav !== false && !reservedSlugs.has(String(page.slug).toLowerCase()))
            .slice(0, 4)
            .map((page) => ({ href: `/${page.slug}`, label: page.navigationLabel || page.title }))
        : [];

    return (
        <html lang="en">
            <body>
                <WildlifeSiteHeader customLinks={customLinks} />
                <main>{children}</main>
                <WildlifeSiteFooter />
            </body>
        </html>
    );
}
