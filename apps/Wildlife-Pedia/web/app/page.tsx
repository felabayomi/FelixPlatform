import WildlifeHomePage from "@/components/wildlife-home-page";
import {
    getWildlifeBlogPosts,
    getWildlifeHabitats,
    getWildlifePediaSiteContent,
    getWildlifeProjects,
    getWildlifeSpecies,
} from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [content, species, habitats, projects, posts] = await Promise.all([
        getWildlifePediaSiteContent(),
        getWildlifeSpecies({ featured: true }),
        getWildlifeHabitats(),
        getWildlifeProjects(),
        getWildlifeBlogPosts(),
    ]);

    return (
        <WildlifeHomePage
            content={content}
            species={species}
            habitats={habitats}
            projects={projects}
            posts={posts}
        />
    );
}
