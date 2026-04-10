import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getWaciStories } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
    const stories = await getWaciStories();

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="soft-label">Stories & Media</p>
                        <h1 className="mt-3 text-4xl font-semibold text-white">Published WACI stories from the community.</h1>
                        <p className="mt-4 max-w-3xl text-slate-300">
                            Stories are submitted by contributors, reviewed in admin, and then published here once approved.
                        </p>
                    </div>
                    <Link
                        href="/submit-story"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-[#092013] hover:bg-emerald-200"
                    >
                        Submit your story <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {stories.length ? (
                    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {stories.map((story) => {
                            const href = `/stories/${encodeURIComponent(story.slug || story.id)}`;

                            return (
                                <article key={story.id} className="glass-panel flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/10">
                                    {story.image ? (
                                        <div
                                            className="min-h-[220px] w-full bg-cover bg-center"
                                            style={{ backgroundImage: `linear-gradient(180deg, rgba(3,17,11,0.12), rgba(3,17,11,0.32)), url(${story.image})` }}
                                        />
                                    ) : null}

                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                            {story.featured ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-300/10 px-2.5 py-1 text-amber-100">
                                                    <Sparkles className="h-3.5 w-3.5" /> Featured
                                                </span>
                                            ) : null}
                                            {story.location ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                                    <MapPin className="h-3.5 w-3.5" /> {story.location}
                                                </span>
                                            ) : null}
                                            {story.publishedAt ? <span>{story.publishedAt}</span> : null}
                                        </div>

                                        <h2 className="text-xl font-semibold text-white">{story.title}</h2>
                                        <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{story.summary}</p>

                                        <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                                            <span>{Number(story.viewCount || 0).toLocaleString()} views</span>
                                            <span>{Number(story.likeCount || 0).toLocaleString()} likes · {Number(story.shareCount || 0).toLocaleString()} shares</span>
                                        </div>

                                        <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">
                                            Open story <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-8 rounded-[1.3rem] border border-white/10 bg-white/5 px-5 py-6 text-sm text-slate-300">
                        No published WACI stories are live yet. You can be the first to submit one.
                    </div>
                )}
            </div>
        </div>
    );
}
