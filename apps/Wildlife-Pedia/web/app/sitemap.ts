import type { MetadataRoute } from "next";
import { getWildlifeSpecies } from "@/lib/wildlife-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://wildlife-pedia.com";
    const staticRoutes = ["", "/about", "/species", "/habitats", "/safety", "/projects", "/report", "/blog", "/get-involved", "/contact"];
    const species = await getWildlifeSpecies();

    return [
        ...staticRoutes.map((route, index) => ({
            url: `${baseUrl}${route}`,
            changeFrequency: (index === 0 ? "daily" : "weekly") as "daily" | "weekly",
            priority: index === 0 ? 1 : 0.7,
        })),
        ...species
            .filter((item) => item.slug)
            .map((item) => ({
                url: `${baseUrl}/species/${encodeURIComponent(item.slug)}`,
                changeFrequency: "monthly" as const,
                priority: 0.6,
            })),
    ];
}
