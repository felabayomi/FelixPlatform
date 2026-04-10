import HomePageContent from "@/components/home-page-content";
import { getProducts, getSiteContent, getWaciPrograms, getWaciResources, getWaciStories } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [content, featuredCampaigns, waciPrograms, waciStories, waciResources] = await Promise.all([
        getSiteContent(),
        getProducts(true),
        getWaciPrograms(),
        getWaciStories(),
        getWaciResources(),
    ]);

    return (
        <HomePageContent
            content={content}
            featuredCampaigns={featuredCampaigns}
            waciPrograms={waciPrograms}
            waciStories={waciStories}
            waciResources={waciResources}
        />
    );
}
