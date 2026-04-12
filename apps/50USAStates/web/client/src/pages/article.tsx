import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState, useRef, useEffect, useMemo, useCallback, type MutableRefObject } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import type { Article } from "@shared/schema";
import {
  ArrowLeft,
  Clock,
  MapPin,
  BookOpen,
  Star,
  Loader2,
  ExternalLink,
  Compass,
  Plane,
  Volume2,
  Pause,
  Play,
  X,
  Radio,
  Mic,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type WhisperWord = { word: string; start: number; end: number };
type SpanMap = MutableRefObject<Map<number, HTMLSpanElement>>;

// ─── Word helpers ─────────────────────────────────────────────────────────────

/** Linear time-estimate timestamps from narration text + known audio duration */
function estimateTimestamps(parts: { title: string; summary: string; paras: string[] }, audioDuration: number): WhisperWord[] {
  const allText = [parts.title, parts.summary, ...parts.paras].join(" ");
  const words = allText.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w));
  if (!words.length || !audioDuration) return [];
  const timePerWord = audioDuration / words.length;
  return words.map((word, i) => ({
    word,
    start: i * timePerWord,
    end: (i + 1) * timePerWord,
  }));
}

function findActiveWordIdx(ts: WhisperWord[], time: number): number {
  if (!ts.length) return -1;
  let lo = 0, hi = ts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ts[mid].end < time) lo = mid + 1;
    else if (ts[mid].start > time) hi = mid - 1;
    else return mid;
  }
  return Math.min(lo, ts.length - 1);
}

function renderWords(
  text: string,
  wc: { count: number },
  activeIdx: number,
  spanRefs: SpanMap,
): React.ReactNode {
  return text.split(/(\s+)/).map((token, i) => {
    if (/^\s+$/.test(token)) return <span key={`s${wc.count}-${i}`}>{token}</span>;
    if (!/[a-zA-Z0-9]/.test(token)) return <span key={`p${wc.count}-${i}`}>{token}</span>;
    const idx = wc.count++;
    const active = idx === activeIdx;
    return (
      <span
        key={`w${idx}`}
        ref={el => { if (el) spanRefs.current.set(idx, el); }}
        className={
          active
            ? "bg-yellow-300 dark:bg-yellow-600/70 rounded-sm px-0.5 -mx-0.5 transition-colors duration-75"
            : "transition-colors duration-75"
        }
      >
        {token}
      </span>
    );
  });
}

// ─── Reading Panel ────────────────────────────────────────────────────────────

function ReadingPanel({
  article,
  audioState,
  progress,
  activeWordIdx,
  spanRefs,
  wordsSynced,
  onPlayPause,
  onStop,
}: {
  article: Article;
  audioState: "idle" | "loading" | "playing" | "paused";
  progress: number;
  activeWordIdx: number;
  spanRefs: SpanMap;
  wordsSynced: boolean;
  onPlayPause: () => void;
  onStop: () => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clean narration sections (mirrors TTS text assembly on server)
  const narration = useMemo(() => {
    const cleanContent = (article.content || "")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const paras = cleanContent.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    return { title: article.title || "", summary: article.summary || "", paras };
  }, [article.id]);

  // Scroll active word into view WITHIN the panel (no page scroll)
  useEffect(() => {
    if (activeWordIdx < 0 || minimized) return;
    const span = spanRefs.current.get(activeWordIdx);
    const container = scrollRef.current;
    if (!span || !container) return;
    const spanRect = span.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    // Only scroll if span is outside the visible container area
    if (spanRect.top < containerRect.top + 40 || spanRect.bottom > containerRect.bottom - 40) {
      const relativeTop = container.scrollTop + (spanRect.top - containerRect.top);
      const targetTop = relativeTop - container.clientHeight / 2 + spanRect.height / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }, [activeWordIdx, minimized]);

  if (audioState === "idle" || audioState === "loading") return null;

  // Word counter — reset each render, counts in document order
  const wc = { count: 0 };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" />

      {/* Centered panel */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-3xl bg-background border border-border rounded-lg shadow-2xl flex flex-col" style={{ maxHeight: "80vh" }}>
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center mt-0.5">
            <Mic className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate max-w-xs">
                Daily Reading — {article.title}
              </span>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 no-default-active-elevate shrink-0">
                cached
              </Badge>
              {wordsSynced && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 no-default-active-elevate shrink-0">
                  synced
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {audioState === "playing" ? "Now playing..." : "Paused"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-3">
          <Button
            size="icon"
            onClick={onPlayPause}
            className="rounded-full bg-primary text-primary-foreground h-9 w-9"
            data-testid="button-panel-playpause"
          >
            {audioState === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMinimized(m => !m)}
            data-testid="button-panel-minimize"
          >
            {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onStop}
            data-testid="button-panel-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Narration text — scrolls internally */}
      {!minimized && (
        <div
          ref={scrollRef}
          className="overflow-y-auto border-t border-border mt-2"
          style={{ maxHeight: "42vh" }}
        >
          <div className="px-4 py-4 max-w-3xl">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
              Live Reading
            </p>

            {/* Title */}
            <p className="text-sm font-semibold text-foreground mb-3 leading-relaxed">
              {renderWords(narration.title, wc, activeWordIdx, spanRefs)}
            </p>

            {/* Summary */}
            <p className="text-sm text-foreground mb-4 leading-relaxed">
              {renderWords(narration.summary, wc, activeWordIdx, spanRefs)}
            </p>

            {/* Content paragraphs */}
            {narration.paras.map((para, i) => (
              <p key={i} className="text-sm text-foreground mb-3 leading-relaxed">
                {renderWords(para, wc, activeWordIdx, spanRefs)}
              </p>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

// ─── Article Markdown (formatted, no word highlighting) ────────────────────────

function ArticleMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => <h2 className="text-lg font-bold mt-6 mb-3 text-foreground border-b pb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
        p: ({ children }) => <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>,
        ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal list-inside">{children}</ol>,
        li: ({ children }) => (
          <li className="text-sm text-muted-foreground leading-relaxed flex gap-2">
            <span className="text-primary mt-1 shrink-0">&#8250;</span>
            <span>{children}</span>
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/30 pl-4 my-3 text-sm text-muted-foreground italic">{children}</blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
        hr: () => <hr className="my-4 border-border" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Events & Festivals": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Natural Wonders": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Food & Culture": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "History & Heritage": "bg-stone-100 text-stone-800 dark:bg-stone-800/40 dark:text-stone-300",
  "Adventure & Outdoors": "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  "Arts & Entertainment": "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  "Hidden Gems": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  "Seasonal Highlights": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function getSecsUntil12ET(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric", minute: "numeric", second: "numeric", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0");
  const nowSecs = get("hour") * 3600 + get("minute") * 60 + get("second");
  const targetSecs = 12 * 3600;
  return nowSecs <= targetSecs ? targetSecs - nowSecs : -1;
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ArticlePage() {
  const [, params] = useRoute("/articles/:id");

  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", params?.id],
    enabled: !!params?.id,
  });

  const adminToken =
    typeof window !== "undefined"
      ? (localStorage.getItem("ea_admin_token") || sessionStorage.getItem("ea_admin_token"))
      : null;
  const isAdmin = !!adminToken;

  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState(0);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [wordsSynced, setWordsSynced] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const wordTimestampsRef = useRef<WhisperWord[]>([]);
  const spanRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const timestampPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [secsLeft, setSecsLeft] = useState(() => getSecsUntil12ET());
  const autoPlayFiredRef = useRef(false);

  // Cleanup
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
      if (timestampPollRef.current) clearTimeout(timestampPollRef.current);
    };
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!isAdmin) return;
    const iv = setInterval(() => setSecsLeft(getSecsUntil12ET()), 1000);
    return () => clearInterval(iv);
  }, [isAdmin]);

  // Auto-play at 12pm ET
  useEffect(() => {
    if (!isAdmin || audioState !== "idle" || autoPlayFiredRef.current) return;
    if (secsLeft === 0) { autoPlayFiredRef.current = true; handleListen(); }
  }, [secsLeft, isAdmin, audioState]);

  // Poll for Whisper timestamps
  const startTimestampPolling = useCallback((articleId: string) => {
    let attempts = 0;
    const poll = async () => {
      if (attempts++ > 15) return;
      try {
        const res = await fetch(`/api/tts/${articleId}/timestamps`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const { timestamps } = await res.json() as { timestamps: WhisperWord[] };
          if (timestamps.length > 0) {
            wordTimestampsRef.current = timestamps;
            setWordsSynced(true);
            return;
          }
        }
      } catch {}
      timestampPollRef.current = setTimeout(poll, 8000);
    };
    poll();
  }, [adminToken]);

  function getNarrationParts(art: Article) {
    const cleanContent = (art.content || "")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const paras = cleanContent.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    return { title: art.title || "", summary: art.summary || "", paras };
  }

  async function handleListen() {
    if (audioState === "playing") {
      audioRef.current?.pause();
      setAudioState("paused");
      return;
    }
    if (audioState === "paused" && audioRef.current) {
      audioRef.current.play();
      setAudioState("playing");
      return;
    }
    if (!article) return;
    setAudioState("loading");
    try {
      const res = await fetch(`/api/tts/${article.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioBlobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      wordTimestampsRef.current = [];
      setWordsSynced(false);
      if (timestampPollRef.current) clearTimeout(timestampPollRef.current);

      // As soon as duration is known, seed estimated timestamps so highlighting starts immediately
      const parts = getNarrationParts(article);
      audio.addEventListener("loadedmetadata", () => {
        if (wordTimestampsRef.current.length === 0 && audio.duration > 0) {
          wordTimestampsRef.current = estimateTimestamps(parts, audio.duration);
        }
      });

      startTimestampPolling(article.id);

      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        setProgress((audio.currentTime / audio.duration) * 100);
        const ts = wordTimestampsRef.current;
        if (ts.length > 0) setActiveWordIdx(findActiveWordIdx(ts, audio.currentTime));
      });
      audio.addEventListener("ended", () => {
        setAudioState("idle");
        setProgress(0);
        setActiveWordIdx(-1);
        if (timestampPollRef.current) clearTimeout(timestampPollRef.current);
      });

      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("idle");
    }
  }

  function handleStop() {
    audioRef.current?.pause();
    if (audioBlobUrlRef.current) { URL.revokeObjectURL(audioBlobUrlRef.current); audioBlobUrlRef.current = null; }
    if (timestampPollRef.current) { clearTimeout(timestampPollRef.current); timestampPollRef.current = null; }
    audioRef.current = null;
    setAudioState("idle");
    setProgress(0);
    setActiveWordIdx(-1);
    setWordsSynced(false);
    wordTimestampsRef.current = [];
    spanRefs.current.clear();
  }

  // ─── Loading / not found ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Compass className="h-12 w-12 opacity-25" />
          <p className="font-medium">Dispatch not found</p>
          <Link href="/"><span className="text-sm text-primary underline cursor-pointer">Back to Expedition</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-6">

          {/* Back */}
          <div className="mb-6">
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Expedition Home
              </span>
            </Link>
          </div>

          {/* Article header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Badge className={`no-default-active-elevate ${CATEGORY_COLORS[article.category] || "bg-gray-100 text-gray-800"}`} variant="secondary">
                {article.category}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {article.city}, {article.stateName}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(article.createdAt)}
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-4 text-foreground">
              {article.title}
            </h1>

            <div className="p-4 rounded-md bg-primary/5 border border-primary/10">
              <p className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                <Compass className="h-3 w-3" />
                Expedition Dispatch — {article.stateName}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{article.summary}</p>
            </div>

            {/* Admin player trigger / Public CTA */}
            {isAdmin ? (
              <div className="mt-4 rounded-md border bg-card overflow-hidden">
                {audioState === "idle" && secsLeft >= 0 && secsLeft <= 300 && (
                  <div className="px-4 py-2 bg-primary/8 border-b flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                    <span className="text-xs font-semibold text-primary">
                      {secsLeft === 0 ? "Starting now…" : `Auto-plays in ${formatCountdown(secsLeft)}`}
                    </span>
                  </div>
                )}
                <div className="p-3 flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleListen}
                    disabled={audioState === "loading"}
                    data-testid="button-listen"
                  >
                    {audioState === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-medium text-foreground">
                        {audioState === "loading" ? "Preparing audio…" : "Play for Livestream"}
                      </span>
                      {audioState === "idle" && secsLeft > 300 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Radio className="h-3 w-3" />
                          Auto-plays at 12:00 PM ET
                        </span>
                      )}
                    </div>
                    <div className="h-1 bg-muted rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-md border bg-card flex items-center gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Hear This Dispatch Read Live</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tune in to the <strong>Daily Dispatch</strong> every day at{" "}
                    <strong>12pm EST</strong> on our livestream at{" "}
                    <a href="https://eacd.us" target="_blank" rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2" data-testid="link-livestream">
                      eacd.us
                    </a>
                  </p>
                </div>
                <a href="https://eacd.us" target="_blank" rel="noopener noreferrer" data-testid="button-tune-in">
                  <Button variant="outline" size="sm">Tune In</Button>
                </a>
              </div>
            )}

            {/* Hero image */}
            {article.imageUrl && (
              <div className="mt-6 rounded-md overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-auto block"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                />
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Full Dispatch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ArticleMarkdown content={article.content} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {article.highlights.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Expedition Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {article.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                          <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    State Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">State</span>
                    <span className="font-medium text-foreground">{article.stateName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Featured City</span>
                    <span className="font-medium text-foreground">{article.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-medium text-foreground">{article.publishedDate}</span>
                  </div>
                </CardContent>
              </Card>

              {article.sources.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Sources & Research
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {article.sources.map((source, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          {source.startsWith("http") ? (
                            <>
                              <ExternalLink className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <a href={source} target="_blank" rel="noopener noreferrer"
                                className="hover:text-primary underline-offset-2 hover:underline break-all">
                                {source}
                              </a>
                            </>
                          ) : (
                            <>
                              <span className="text-primary mt-0.5 shrink-0">&#8250;</span>
                              <span>{source}</span>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Schedez CTA */}
          <div className="mt-10 pt-8 border-t">
            <a href="https://schedez.io" target="_blank" rel="noopener noreferrer"
              className="block group" data-testid="link-schedez-cta">
              <div className="rounded-md bg-[#1e3a6e] hover-elevate overflow-visible p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="shrink-0 flex items-center justify-center rounded-xl bg-white/10 p-3">
                  <Plane className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-bold text-lg leading-tight">Schedez</span>
                    <span className="text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">Travel Planning</span>
                  </div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Plan Less, Travel More.</p>
                  <p className="text-blue-200 text-xs leading-relaxed">
                    Tell us where you want to go — Schedez plans, prices, and books the whole trip for you.
                    Full-service travel planning for individuals, families, and groups.
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 bg-white text-[#1e3a6e] font-semibold text-sm px-4 py-2 rounded-md group-hover:bg-blue-50 transition-colors">
                    Plan My Trip
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </a>
          </div>

        </div>
      </main>

      <SiteFooter />

      {/* Floating Reading Panel — admin only, shown while audio is active */}
      {isAdmin && article && (
        <ReadingPanel
          article={article}
          audioState={audioState}
          progress={progress}
          activeWordIdx={activeWordIdx}
          spanRefs={spanRefs}
          wordsSynced={wordsSynced}
          onPlayPause={handleListen}
          onStop={handleStop}
        />
      )}
    </div>
  );
}
