"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Heart, Share2 } from "lucide-react";
import type { WaciStory } from "@/lib/api";
import { trackWaciStoryLike, trackWaciStoryShare, trackWaciStoryViewComplete } from "@/lib/api";

type Props = {
    story: WaciStory;
};

const shareTargets = [
    { label: "WhatsApp", platform: "whatsapp" },
    { label: "Facebook", platform: "facebook" },
    { label: "X", platform: "x" },
    { label: "Copy Link", platform: "copy_link" },
];

export default function StoryDetailClient({ story }: Props) {
    const [secondsOnPage, setSecondsOnPage] = useState(0);
    const [stats, setStats] = useState({
        viewCount: Number(story.viewCount || 0),
        likeCount: Number(story.likeCount || 0),
        shareCount: Number(story.shareCount || 0),
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [viewRecorded, setViewRecorded] = useState(false);
    const [likeSent, setLikeSent] = useState(false);
    const sessionId = useMemo(() => `waci-${Math.random().toString(36).slice(2, 10)}`, []);
    const storyId = story.slug || story.id;

    useEffect(() => {
        const timer = window.setInterval(() => {
            setSecondsOnPage((current) => current + 1);
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const setCountsFromResponse = (response: any) => {
        setStats({
            viewCount: Number(response?.item?.viewCount || stats.viewCount || 0),
            likeCount: Number(response?.item?.likeCount || stats.likeCount || 0),
            shareCount: Number(response?.item?.shareCount || stats.shareCount || 0),
        });
    };

    const handleViewComplete = async () => {
        setError("");
        setMessage("");

        try {
            const response = await trackWaciStoryViewComplete(storyId, {
                secondsOnPage,
                sessionId,
                source: "waci-story-detail",
            });
            setCountsFromResponse(response);
            setViewRecorded(true);
            setMessage("View recorded. Thanks for reading the story through.");
        } catch (trackError: any) {
            setError(trackError?.response?.data?.message || "Unable to record the completed view.");
        }
    };

    const handleLike = async () => {
        setError("");
        setMessage("");

        try {
            const response = await trackWaciStoryLike(storyId, {
                secondsOnPage,
                sessionId,
                source: "waci-story-detail",
            });
            setCountsFromResponse(response);
            setLikeSent(true);
            setMessage("Like recorded. WACI only counts one like per IP for fairness.");
        } catch (trackError: any) {
            setError(trackError?.response?.data?.message || "Unable to like this story yet.");
        }
    };

    const handleShare = async (platform: string) => {
        setError("");
        setMessage("");

        try {
            const response = await trackWaciStoryShare(storyId, {
                platform,
                secondsOnPage,
                sessionId,
                source: "waci-story-detail",
            });
            setCountsFromResponse(response);

            const currentUrl = window.location.href;
            const shareText = `${story.title} — ${story.summary}`;

            if (platform === "copy_link") {
                await navigator.clipboard.writeText(currentUrl);
            } else if (navigator.share) {
                await navigator.share({ title: story.title, text: shareText, url: currentUrl });
            }

            setMessage(`Share recorded for ${platform.replace(/_/g, " ")}.`);
        } catch (trackError: any) {
            setError(trackError?.response?.data?.message || "Unable to record the share right now.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-panel rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        <Clock3 className="h-4 w-4" /> {secondsOnPage}s on page
                    </span>
                    <span>{stats.viewCount.toLocaleString()} views</span>
                    <span>{stats.likeCount.toLocaleString()} likes</span>
                    <span>{stats.shareCount.toLocaleString()} shares</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handleViewComplete}
                        disabled={viewRecorded}
                        className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-[#092013] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {viewRecorded ? "View recorded" : "Mark view complete"}
                    </button>
                    <button
                        type="button"
                        onClick={handleLike}
                        disabled={secondsOnPage < 5 || likeSent}
                        className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Heart className="mr-2 h-4 w-4" />
                        {likeSent ? "Liked" : secondsOnPage < 5 ? `Like unlocks in ${5 - secondsOnPage}s` : "Like this story"}
                    </button>
                    {shareTargets.map((target) => (
                        <button
                            key={target.platform}
                            type="button"
                            onClick={() => handleShare(target.platform)}
                            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white"
                        >
                            <Share2 className="mr-2 h-4 w-4" /> {target.label}
                        </button>
                    ))}
                </div>

                {message ? (
                    <div className="mt-4 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {message}</span>
                    </div>
                ) : null}

                {error ? (
                    <div className="mt-4 rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        {error}
                    </div>
                ) : null}
            </div>

            {story.link ? (
                <Link href={story.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">
                    Open original/source link
                </Link>
            ) : null}
        </div>
    );
}
