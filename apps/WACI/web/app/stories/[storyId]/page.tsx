import { notFound } from "next/navigation";
import StoryDetailClient from "@/components/story-detail-client";
import { getWaciStory } from "@/lib/api";

export const dynamic = "force-dynamic";

type StoryPageProps = {
    params: Promise<{
        storyId: string;
    }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
    const { storyId } = await params;
    const story = await getWaciStory(storyId);

    if (!story) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <article className="section-shell overflow-hidden p-6 sm:p-8">
                {story.image ? (
                    <div
                        className="story-image-panel mb-6 min-h-[320px]"
                        style={{ backgroundImage: `linear-gradient(180deg, rgba(3,17,11,0.15), rgba(3,17,11,0.42)), url(${story.image})` }}
                    />
                ) : null}

                <p className="soft-label">{story.featured ? "Featured Story" : "Published Story"}</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{story.title}</h1>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                    {story.location ? <span>{story.location}</span> : null}
                    {story.publishedAt ? <span>{story.publishedAt}</span> : null}
                    {story.authorName ? <span>By {story.authorName}</span> : null}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4 text-base leading-8 text-slate-200">
                        {String(story.summary || "")
                            .split(/\n{2,}/)
                            .filter(Boolean)
                            .map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                    </div>

                    <StoryDetailClient story={story} />
                </div>
            </article>
        </div>
    );
}
