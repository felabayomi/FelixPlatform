import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "WACI | Wildlife Africa Conservation Initiative",
    description:
        "A public WACI website powered by the Felix Platform shared backend, admin, and support infrastructure.",
    icons: {
        icon: "https://mediahost.app/api/media/serve/a6a6a62c2c5d3698ffa2674ef586907e?w=400&h=400&fit=crop&crop=center&q=80",
        shortcut: "https://mediahost.app/api/media/serve/a6a6a62c2c5d3698ffa2674ef586907e?w=400&h=400&fit=crop&crop=center&q=80",
        apple: "https://mediahost.app/api/media/serve/a6a6a62c2c5d3698ffa2674ef586907e?w=400&h=400&fit=crop&crop=center&q=80",
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>
                <SiteHeader />
                <main>{children}</main>
                <SiteFooter />
            </body>
        </html>
    );
}
