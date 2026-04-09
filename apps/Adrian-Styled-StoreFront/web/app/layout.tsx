import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Adrian's Styled Collection",
  description: "Boutique kaftans and confidence-first statement fashion powered by Felix Platform.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg?v=20260408", type: "image/svg+xml" },
      { url: "/icon?v=20260408", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg?v=20260408",
    apple: "/apple-icon?v=20260408",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--bg)] text-[var(--primary)]">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
