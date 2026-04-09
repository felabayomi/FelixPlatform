import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Adrian's Styled Collection",
        short_name: "Adrian Store",
        description: "Luxury boutique fashion, curated styling, and statement pieces from Adrian's Styled Collection.",
        start_url: "/",
        display: "standalone",
        background_color: "#f8f6f2",
        theme_color: "#8b7355",
        icons: [
            {
                src: "/icon",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/apple-icon",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
