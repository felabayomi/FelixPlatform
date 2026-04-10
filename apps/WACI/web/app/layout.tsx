import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { getSiteContent } from "@/lib/api";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const content = await getSiteContent();
    const logoUrl = content.headerLogoUrl;

    return {
        title: "WACI | Wildlife Africa Conservation Initiative",
        description:
            "A public WACI website powered by the Felix Platform shared backend, admin, and support infrastructure.",
        icons: logoUrl
            ? {
                icon: logoUrl,
                shortcut: logoUrl,
                apple: logoUrl,
            }
            : undefined,
    };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const content = await getSiteContent();

    return (
        <html lang="en">
            <body>
                <SiteHeader logoUrl={content.headerLogoUrl} />
                <main>{children}</main>
                <SiteFooter />
            </body>
        </html>
    );
}
