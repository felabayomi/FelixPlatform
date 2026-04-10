import HomePageContent from "@/components/home-page-content";
import { getSiteContent, getWaciPrograms, getWaciResources, getWaciStories } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
    const [content, waciPrograms, waciStories, waciResources] = await Promise.all([
        getSiteContent(),
        getWaciPrograms(),
        getWaciStories(),
        getWaciResources(),
    ]);

    return (
        <HomePageContent
            content={content}
            waciPrograms={waciPrograms}
            waciStories={waciStories}
            waciResources={waciResources}
        />
    );
}
