import type { Metadata } from "next";
import WildlifeSiteFooter from "@/components/wildlife-site-footer";
import WildlifeSiteHeader from "@/components/wildlife-site-header";
import { getWildlifePediaSiteContent } from "@/lib/wildlife-api";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const content = await getWildlifePediaSiteContent();

    return {
        title: "Wildlife-Pedia | Learn wildlife. Prevent conflict. Take action.",
        description: content.heroText,
    };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>
                <WildlifeSiteHeader />
                <main>{children}</main>
                <WildlifeSiteFooter />
            </body>
        </html>
    );
}
