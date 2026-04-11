import { getWildlifeBlogPosts } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
    const posts = await getWildlifeBlogPosts();

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Blog / Insights</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Wildlife stories, research summaries, and practical insights.</h1>
                <p className="mt-4 max-w-3xl text-slate-300">
                    Use this space to translate conservation complexity into everyday understanding and actionable awareness.
                </p>

                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post) => (
                        <article key={post.id} className="glass-panel overflow-hidden rounded-[1.4rem] p-0">
                            {post.image ? <img src={post.image} alt={post.title} className="h-48 w-full object-cover" /> : null}
                            <div className="p-5">
                                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                                    <span className="uppercase tracking-[0.22em] text-emerald-300/75">{post.category || "Insights"}</span>
                                    <span>{post.publishedAt}</span>
                                </div>
                                <h2 className="mt-3 text-xl font-semibold text-white">{post.title}</h2>
                                <p className="mt-3 text-sm leading-7 text-slate-300">{post.excerpt}</p>
                                <p className="mt-3 text-sm leading-7 text-slate-300">{post.body}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
