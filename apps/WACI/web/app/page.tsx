import HomePageContent from "@/components/home-page-content";
import { getProducts, getSiteContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [content, featuredCampaigns] = await Promise.all([getSiteContent(), getProducts(true)]);

    return <HomePageContent content={content} featuredCampaigns={featuredCampaigns} />;
}
