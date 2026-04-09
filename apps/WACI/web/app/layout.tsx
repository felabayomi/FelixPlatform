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
        icon: "/waci-logo.svg",
        shortcut: "/waci-logo.svg",
        apple: "/waci-logo.svg",
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
