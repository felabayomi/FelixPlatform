import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "WACI Project Hub",
    description: "Fund real conservation work. One project. One grantee. Measurable impact.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
